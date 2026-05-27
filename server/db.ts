import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  notices,
  noticeReads,
  notifications,
  files,
  qnaPosts,
  qnaAnswers,
  signatures,
  exams,
  examQuestions,
  examResults,
  dailyReports,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function createUser(data: {
  employeeId: string;
  passwordHash: string;
  name?: string;
  email?: string;
  role?: "user" | "admin";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(users).values({
    employeeId: data.employeeId,
    passwordHash: data.passwordHash,
    name: data.name ?? null,
    email: data.email ?? null,
    role: data.role ?? "user",
    lastSignedIn: new Date(),
  });
}

export async function getUserByEmployeeId(employeeId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.employeeId, employeeId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserLastSignIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function updateUserActive(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function getAdminCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "admin"));
  return Number(result[0]?.count ?? 0);
}

// ─── Notices ─────────────────────────────────────────────────────────────────

export async function getNotices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notices).orderBy(desc(notices.isPinned), desc(notices.createdAt));
}

export async function getNoticeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(notices).where(eq(notices.id, id)).limit(1);
  return result[0];
}

export async function createNotice(data: {
  title: string;
  content: string;
  category?: string;
  isPinned: boolean;
  authorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(notices).values({ ...data, category: data.category ?? "일반" });
}

export async function updateNotice(id: number, data: {
  title?: string;
  content?: string;
  category?: string;
  isPinned?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(notices).set(data).where(eq(notices.id, id));
}

export async function deleteNotice(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(notices).where(eq(notices.id, id));
}

// ─── Files ───────────────────────────────────────────────────────────────────

export async function getFiles(category?: string) {
  const db = await getDb();
  if (!db) return [];
  if (category) {
    return db.select().from(files).where(eq(files.category, category)).orderBy(desc(files.createdAt));
  }
  return db.select().from(files).orderBy(desc(files.createdAt));
}

export async function getFileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(files).where(eq(files.id, id)).limit(1);
  return result[0];
}

export async function createFile(data: {
  title: string;
  description?: string;
  originalName: string;
  fileKey: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
  category: string;
  uploaderId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(files).values(data);
}

export async function deleteFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(files).where(eq(files.id, id));
}

// ─── Q&A ─────────────────────────────────────────────────────────────────────

export async function getQnaPosts(userId?: number, isAdmin?: boolean) {
  const db = await getDb();
  if (!db) return [];
  const allPosts = await db.select().from(qnaPosts).orderBy(desc(qnaPosts.createdAt));
  if (isAdmin) return allPosts;
  return allPosts.filter((p) => !p.isPrivate || p.authorId === userId);
}

export async function getQnaPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(qnaPosts).where(eq(qnaPosts.id, id)).limit(1);
  return result[0];
}

export async function createQnaPost(data: {
  title: string;
  content: string;
  authorId: number;
  isPrivate: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(qnaPosts).values(data);
}

export async function deleteQnaPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(qnaAnswers).where(eq(qnaAnswers.postId, id));
  await db.delete(qnaPosts).where(eq(qnaPosts.id, id));
}

export async function getAnswersByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(qnaAnswers).where(eq(qnaAnswers.postId, postId)).orderBy(qnaAnswers.createdAt);
}

export async function createQnaAnswer(data: {
  postId: number;
  content: string;
  authorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(qnaAnswers).values(data);
  await db.update(qnaPosts).set({ isAnswered: true }).where(eq(qnaPosts.id, data.postId));
}

export async function deleteQnaAnswer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(qnaAnswers).where(eq(qnaAnswers.id, id));
}

// ─── Signatures ───────────────────────────────────────────────────────────────

export async function getSignatures(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (userId) {
    return db.select().from(signatures).where(eq(signatures.userId, userId)).orderBy(desc(signatures.createdAt));
  }
  return db.select().from(signatures).orderBy(desc(signatures.createdAt));
}

export async function createSignature(data: {
  userId: number;
  documentTitle: string;
  documentContent?: string;
  signatureData: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(signatures).values({ ...data, signedAt: new Date() });
}

// ─── Exams ───────────────────────────────────────────────────────────────────

export async function getExams(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(exams).where(eq(exams.isActive, true)).orderBy(desc(exams.createdAt));
  }
  return db.select().from(exams).orderBy(desc(exams.createdAt));
}

export async function getExamById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
  return result[0];
}

export async function createExam(data: {
  title: string;
  description?: string;
  timeLimit?: number;
  passingScore: number;
  authorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(exams).values({ ...data, isActive: true });
}

export async function updateExam(id: number, data: {
  title?: string;
  description?: string;
  timeLimit?: number;
  passingScore?: number;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(exams).set(data).where(eq(exams.id, id));
}

export async function deleteExam(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(examResults).where(eq(examResults.examId, id));
  await db.delete(examQuestions).where(eq(examQuestions.examId, id));
  await db.delete(exams).where(eq(exams.id, id));
}

export async function getQuestionsByExamId(examId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(examQuestions).where(eq(examQuestions.examId, examId)).orderBy(examQuestions.orderIndex);
}

export async function createQuestion(data: {
  examId: number;
  questionText: string;
  options: string[];
  correctAnswer: number;
  points: number;
  orderIndex: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(examQuestions).values(data);
}

export async function deleteQuestion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(examQuestions).where(eq(examQuestions.id, id));
}

export async function deleteQuestionsByExamId(examId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(examQuestions).where(eq(examQuestions.examId, examId));
}

export async function getExamResults(examId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (examId) {
    return db.select().from(examResults).where(eq(examResults.examId, examId)).orderBy(desc(examResults.submittedAt));
  }
  return db.select().from(examResults).orderBy(desc(examResults.submittedAt));
}

export async function getExamResultsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(examResults).where(eq(examResults.userId, userId)).orderBy(desc(examResults.submittedAt));
}

export async function getUserExamResult(examId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(examResults)
    .where(and(eq(examResults.examId, examId), eq(examResults.userId, userId))).limit(1);
  return result[0];
}

export async function createExamResult(data: {
  examId: number;
  userId: number;
  answers: { questionId: number; selectedAnswer: number }[];
  score: number;
  totalScore: number;
  percentage: number;
  isPassed: boolean;
  startedAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(examResults).values(data);
}

// ─── Daily Reports ────────────────────────────────────────────────────────────

export async function getDailyReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailyReports).orderBy(desc(dailyReports.reportDate));
}

export async function getDailyReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dailyReports).where(eq(dailyReports.id, id)).limit(1);
  return result[0];
}

export async function createDailyReport(data: {
  reportDate: Date;
  title: string;
  content?: string;
  photoUrl?: string;
  photoKey?: string;
  uploaderId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(dailyReports).values(data);
}

export async function updateDailyReport(id: number, data: {
  title?: string;
  content?: string;
  reportDate?: Date;
  photoUrl?: string;
  photoKey?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(dailyReports).set(data).where(eq(dailyReports.id, id));
}

export async function deleteDailyReport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(dailyReports).where(eq(dailyReports.id, id));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(data: {
  userId: number;
  title: string;
  content?: string;
  type?: "notice" | "exam" | "system";
  relatedId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ─── Notice Reads ─────────────────────────────────────────────────────────────

export async function markNoticeAsRead(noticeId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(noticeReads).values({ noticeId, userId });
  } catch {
    // 이미 읽음 처리된 경우 무시
  }
}

export async function getNoticeReadCount(noticeId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(noticeReads).where(eq(noticeReads.noticeId, noticeId));
  return Number(result[0]?.count ?? 0);
}

export async function hasUserReadNotice(noticeId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(noticeReads)
    .where(and(eq(noticeReads.noticeId, noticeId), eq(noticeReads.userId, userId))).limit(1);
  return result.length > 0;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { users: 0, notices: 0, files: 0, qnaPosts: 0, exams: 0 };

  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [noticeCount] = await db.select({ count: sql<number>`count(*)` }).from(notices);
  const [fileCount] = await db.select({ count: sql<number>`count(*)` }).from(files);
  const [qnaCount] = await db.select({ count: sql<number>`count(*)` }).from(qnaPosts);
  const [examCount] = await db.select({ count: sql<number>`count(*)` }).from(exams);

  return {
    users: Number(userCount?.count ?? 0),
    notices: Number(noticeCount?.count ?? 0),
    files: Number(fileCount?.count ?? 0),
    qnaPosts: Number(qnaCount?.count ?? 0),
    exams: Number(examCount?.count ?? 0),
  };
}
