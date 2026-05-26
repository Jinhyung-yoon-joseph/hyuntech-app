import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { hashPassword, verifyPassword, createSessionToken } from "./_core/auth";
import {
  createDailyReport,
  createNotification,
  createUser,
  deleteDailyReport,
  getDailyReportById,
  getDailyReports,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markNoticeAsRead,
  hasUserReadNotice,
  getNoticeReadCount,
  getAllUsers,
  getAnswersByPostId,
  getDashboardStats,
  getExamById,
  getExamResults,
  getExamResultsByUser,
  getExams,
  getFileById,
  getFiles,
  getNoticeById,
  getNotices,
  getQnaPostById,
  getQnaPosts,
  getQuestionsByExamId,
  getSignatures,
  getUserById,
  getUserExamResult,
  createExam,
  createExamResult,
  createFile,
  createNotice,
  createQnaAnswer,
  createQnaPost,
  createQuestion,
  createSignature,
  deleteExam,
  deleteFile,
  deleteNotice,
  deleteQnaAnswer,
  deleteQnaPost,
  deleteQuestion,
  deleteQuestionsByExamId,
  updateDailyReport,
  updateExam,
  updateNotice,
  updateUserRole,
  updateUserLastSignIn,
  updateUserPassword,
  getAdminCount,
  getUserByEmployeeId,
  getDb,
} from "./db";
import { notifications } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Admin guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    login: publicProcedure
      .input(z.object({ employeeId: z.string().min(1), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmployeeId(input.employeeId);
        if (!user || !verifyPassword(input.password, user.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "사번 또는 비밀번호가 올바르지 않습니다." });
        }
        await updateUserLastSignIn(user.id);
        const token = await createSessionToken({ userId: user.id, name: user.name ?? "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true, user: { id: user.id, name: user.name, role: user.role } };
      }),

    register: publicProcedure
      .input(z.object({
        employeeId: z.string().min(1),
        password: z.string().min(4),
        name: z.string().min(1),
        email: z.string().email().optional(),
        // 첫 관리자 등록용 비밀키
        adminKey: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // 중복 체크
        const existing = await getUserByEmployeeId(input.employeeId);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "이미 사용 중인 사번입니다." });
        }

        // 관리자 등록 여부
        const adminCount = await getAdminCount();
        let role: "user" | "admin" = "user";
        if (adminCount === 0) {
          role = "admin"; // 최초 가입자는 자동으로 관리자
        } else if (input.adminKey === process.env.ADMIN_REGISTER_KEY) {
          role = "admin";
        }

        const passwordHash = hashPassword(input.password);
        await createUser({ employeeId: input.employeeId, passwordHash, name: input.name, email: input.email, role });
        return { success: true, role };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    changePassword: protectedProcedure
      .input(z.object({ currentPassword: z.string(), newPassword: z.string().min(4) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(ctx.user.id);
        if (!user || !verifyPassword(input.currentPassword, user.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "현재 비밀번호가 올바르지 않습니다." });
        }
        await updateUserPassword(ctx.user.id, hashPassword(input.newPassword));
        return { success: true };
      }),
  }),

  // ─── Users ───────────────────────────────────────────────────────────────
  users: router({
    list: adminProcedure.query(async () => {
      return getAllUsers();
    }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    resetPassword: adminProcedure
      .input(z.object({ userId: z.number(), newPassword: z.string().min(4) }))
      .mutation(async ({ input }) => {
        await updateUserPassword(input.userId, hashPassword(input.newPassword));
        return { success: true };
      }),
  }),

  // ─── Notices ─────────────────────────────────────────────────────────────
  notices: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), category: z.string().optional() }))
      .query(async ({ input }) => {
        const all = await getNotices();
        let filtered = all;
        if (input.category) {
          filtered = filtered.filter((n) => n.category === input.category);
        }
        if (!input.search) return filtered;
        return filtered.filter(
          (n) =>
            n.title.toLowerCase().includes(input.search!.toLowerCase()) ||
            n.content.toLowerCase().includes(input.search!.toLowerCase())
        );
      }),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const notice = await getNoticeById(input.id);
      if (!notice) throw new TRPCError({ code: "NOT_FOUND" });
      return notice;
    }),
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        category: z.string().default("일반"),
        isPinned: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        await createNotice({ ...input, authorId: ctx.user.id });
        const allUsers = await getAllUsers();
        for (const user of allUsers) {
          if (user.id !== ctx.user.id) {
            await createNotification({
              userId: user.id,
              title: `새 공지사항: ${input.title}`,
              content: input.content.substring(0, 100),
              type: "notice",
            });
          }
        }
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        isPinned: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateNotice(id, data);
        return { success: true };
      }),
    markAsRead: protectedProcedure
      .input(z.object({ noticeId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await markNoticeAsRead(input.noticeId, ctx.user.id);
        return { success: true };
      }),
    getReadStatus: protectedProcedure
      .input(z.object({ noticeId: z.number() }))
      .query(async ({ input, ctx }) => {
        const hasRead = await hasUserReadNotice(input.noticeId, ctx.user.id);
        const readCount = await getNoticeReadCount(input.noticeId);
        return { hasRead, readCount };
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteNotice(input.id);
      return { success: true };
    }),
  }),

  // ─── Files ───────────────────────────────────────────────────────────────
  files: router({
    list: protectedProcedure.input(z.object({ category: z.string().optional() })).query(async ({ input }) => {
      return getFiles(input.category);
    }),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const file = await getFileById(input.id);
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });
      return file;
    }),
    upload: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        originalName: z.string(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
        category: z.string().default("일반"),
        fileData: z.string(), // base64
      }))
      .mutation(async ({ input, ctx }) => {
        // 파일 크기 체크 (100MB)
        if (input.fileSize && input.fileSize > 100 * 1024 * 1024) {
          throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "파일 크기가 100MB를 초과합니다." });
        }
        const buffer = Buffer.from(input.fileData, "base64");
        // 한글/특수문자 파일명도 안전하게 처리됨 (storage.ts에서 UUID로 변환)
        const { key, url } = await storagePut(
          `files/${input.originalName}`,
          buffer,
          input.mimeType ?? "application/octet-stream"
        );
        await createFile({
          title: input.title,
          description: input.description,
          originalName: input.originalName,
          fileKey: key,
          fileUrl: url,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          category: input.category,
          uploaderId: ctx.user.id,
        });
        return { success: true, url };
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteFile(input.id);
      return { success: true };
    }),
  }),

  // ─── Q&A ─────────────────────────────────────────────────────────────────
  qna: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = ctx.user.role === "admin";
      return getQnaPosts(ctx.user.id, isAdmin);
    }),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const post = await getQnaPostById(input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (post.isPrivate && post.authorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const answers = await getAnswersByPostId(input.id);
      return { post, answers };
    }),
    create: protectedProcedure
      .input(z.object({ title: z.string().min(1), content: z.string().min(1), isPrivate: z.boolean().default(false) }))
      .mutation(async ({ input, ctx }) => {
        await createQnaPost({ ...input, authorId: ctx.user.id });
        return { success: true };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const post = await getQnaPostById(input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (post.authorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await deleteQnaPost(input.id);
      return { success: true };
    }),
    answer: adminProcedure
      .input(z.object({ postId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        await createQnaAnswer({ ...input, authorId: ctx.user.id });
        return { success: true };
      }),
    deleteAnswer: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteQnaAnswer(input.id);
      return { success: true };
    }),
  }),

  // ─── Signatures ───────────────────────────────────────────────────────────
  signatures: router({
    myList: protectedProcedure.query(async ({ ctx }) => {
      return getSignatures(ctx.user.id);
    }),
    allList: adminProcedure.query(async () => {
      return getSignatures();
    }),
    submit: protectedProcedure
      .input(z.object({
        documentTitle: z.string().min(1),
        documentContent: z.string().optional(),
        signatureData: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        await createSignature({ ...input, userId: ctx.user.id });
        return { success: true };
      }),
  }),

  // ─── Exams ───────────────────────────────────────────────────────────────
  exams: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const activeOnly = ctx.user.role !== "admin";
      return getExams(activeOnly);
    }),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const exam = await getExamById(input.id);
      if (!exam) throw new TRPCError({ code: "NOT_FOUND" });
      return exam;
    }),
    questions: protectedProcedure.input(z.object({ examId: z.number() })).query(async ({ input, ctx }) => {
      const questions = await getQuestionsByExamId(input.examId);
      if (ctx.user.role !== "admin") {
        return questions.map(({ correctAnswer, ...q }) => q);
      }
      return questions;
    }),
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        timeLimit: z.number().optional(),
        passingScore: z.number().min(0).max(100).default(60),
      }))
      .mutation(async ({ input, ctx }) => {
        await createExam({ ...input, authorId: ctx.user.id });
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        timeLimit: z.number().optional(),
        passingScore: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateExam(id, data);
        return { success: true };
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteExam(input.id);
      return { success: true };
    }),
    addQuestion: adminProcedure
      .input(z.object({
        examId: z.number(),
        questionText: z.string().min(1),
        options: z.array(z.string()).min(2).max(5),
        correctAnswer: z.number().min(0),
        points: z.number().min(1).default(1),
        orderIndex: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        await createQuestion(input);
        return { success: true };
      }),
    deleteQuestion: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteQuestion(input.id);
      return { success: true };
    }),
    replaceQuestions: adminProcedure
      .input(z.object({
        examId: z.number(),
        questions: z.array(z.object({
          questionText: z.string().min(1),
          options: z.array(z.string()).min(2).max(5),
          correctAnswer: z.number().min(0),
          points: z.number().min(1).default(1),
          orderIndex: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        await deleteQuestionsByExamId(input.examId);
        for (const q of input.questions) {
          await createQuestion({ examId: input.examId, ...q });
        }
        return { success: true };
      }),
    submit: protectedProcedure
      .input(z.object({
        examId: z.number(),
        answers: z.array(z.object({ questionId: z.number(), selectedAnswer: z.number() })),
        startedAt: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserExamResult(input.examId, ctx.user.id);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "이미 응시한 시험입니다." });

        const questions = await getQuestionsByExamId(input.examId);
        const exam = await getExamById(input.examId);
        if (!exam) throw new TRPCError({ code: "NOT_FOUND" });

        let score = 0;
        const totalScore = questions.reduce((sum, q) => sum + q.points, 0);
        for (const ans of input.answers) {
          const q = questions.find((q) => q.id === ans.questionId);
          if (q && q.correctAnswer === ans.selectedAnswer) score += q.points;
        }

        const percentage = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
        const isPassed = percentage >= exam.passingScore;

        await createExamResult({
          examId: input.examId,
          userId: ctx.user.id,
          answers: input.answers,
          score,
          totalScore,
          percentage,
          isPassed,
          startedAt: new Date(input.startedAt),
        });

        return { success: true, score, totalScore, percentage, isPassed };
      }),
    myResults: protectedProcedure.query(async ({ ctx }) => {
      return getExamResultsByUser(ctx.user.id);
    }),
    results: adminProcedure.input(z.object({ examId: z.number().optional() })).query(async ({ input }) => {
      return getExamResults(input.examId);
    }),
    resultWithDetails: adminProcedure
      .input(z.object({ examId: z.number() }))
      .query(async ({ input }) => {
        const results = await getExamResults(input.examId);
        const exam = await getExamById(input.examId);
        const questions = await getQuestionsByExamId(input.examId);
        const enriched = await Promise.all(
          results.map(async (r) => {
            const user = await getUserById(r.userId);
            return { ...r, userName: user?.name ?? "알 수 없음", userEmployeeId: user?.employeeId ?? "" };
          })
        );
        return { exam, questions, results: enriched };
      }),
  }),

  // ─── Daily Reports ────────────────────────────────────────────────────────
  dailyReports: router({
    list: protectedProcedure.query(async () => {
      return getDailyReports();
    }),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getDailyReportById(input.id);
    }),
    create: adminProcedure
      .input(z.object({
        reportDate: z.date(),
        title: z.string().min(1),
        content: z.string().optional(),
        photoUrl: z.string().optional(),
        photoKey: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createDailyReport({ ...input, uploaderId: ctx.user.id });
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        reportDate: z.date().optional(),
        title: z.string().optional(),
        content: z.string().optional(),
        photoUrl: z.string().optional(),
        photoKey: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateDailyReport(id, data);
        return { success: true };
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteDailyReport(input.id);
      return { success: true };
    }),
  }),

  // ─── Notifications ────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserNotifications(ctx.user.id);
    }),
    markAsRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const notif = await db.select().from(notifications).where(eq(notifications.id, input.id)).limit(1);
      if (!notif || notif.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
      if (notif[0].userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await markNotificationAsRead(input.id);
      return { success: true };
    }),
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ─── Dashboard ────────────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return getDashboardStats();
    }),
    recentNotices: protectedProcedure.query(async () => {
      const all = await getNotices();
      return all.slice(0, 5);
    }),
  }),
});

export type AppRouter = typeof appRouter;
