import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => { server.close(() => resolve(true)); });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// 서버 시작 시 DB 테이블 자동 생성 (CREATE TABLE IF NOT EXISTS)
async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log("[DB] DATABASE_URL 없음 - 건너뜀");
    return;
  }
  try {
    console.log("[DB] 테이블 초기화 시작...");
    const mysql = await import("mysql2/promise");
    const conn = await mysql.createConnection(process.env.DATABASE_URL);

    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employeeId VARCHAR(64) NOT NULL UNIQUE,
        passwordHash VARCHAR(256) NOT NULL,
        name TEXT,
        email VARCHAR(320),
        role ENUM('user','admin') NOT NULL DEFAULT 'user',
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
        lastSignedIn TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS notices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT '일반',
        isPinned BOOLEAN NOT NULL DEFAULT FALSE,
        authorId INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL DEFAULT '기타',
        originalName VARCHAR(255) NOT NULL,
        fileKey VARCHAR(512) NOT NULL,
        fileUrl VARCHAR(1024) NOT NULL,
        mimeType VARCHAR(128),
        fileSize INT,
        uploaderId INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS qna_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        authorId INT NOT NULL,
        isAnswered BOOLEAN NOT NULL DEFAULT FALSE,
        isPrivate BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS qna_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        postId INT NOT NULL,
        content TEXT NOT NULL,
        authorId INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS signatures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        documentTitle VARCHAR(255) NOT NULL,
        documentContent TEXT,
        signatureData TEXT NOT NULL,
        signedAt TIMESTAMP NOT NULL DEFAULT NOW(),
        createdAt TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS exams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        timeLimit INT,
        passingScore INT NOT NULL DEFAULT 60,
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        authorId INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS exam_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        examId INT NOT NULL,
        questionText TEXT NOT NULL,
        options JSON NOT NULL,
        correctAnswer INT NOT NULL,
        points INT NOT NULL DEFAULT 1,
        orderIndex INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS exam_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        examId INT NOT NULL,
        userId INT NOT NULL,
        answers JSON NOT NULL,
        score INT NOT NULL,
        totalScore INT NOT NULL,
        percentage INT NOT NULL,
        isPassed BOOLEAN NOT NULL,
        startedAt TIMESTAMP NOT NULL,
        submittedAt TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS daily_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reportDate TIMESTAMP NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        photoUrl VARCHAR(1024),
        photoKey VARCHAR(512),
        uploaderId INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        type ENUM('notice','exam','system') NOT NULL DEFAULT 'system',
        relatedId INT,
        isRead BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS notice_reads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        noticeId INT NOT NULL,
        userId INT NOT NULL,
        readAt TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
    ];

    for (const sql of tables) {
      await conn.execute(sql);
    }

    await conn.end();
    console.log("[DB] 테이블 초기화 완료!");
  } catch (error) {
    console.error("[DB] 초기화 실패 (앱은 계속 실행):", error);
  }
}

async function startServer() {
  // DB 테이블 자동 생성
  await initDatabase();

  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));

  const uploadDir = path.resolve(process.cwd(), ENV.uploadDir);
  app.use("/uploads", express.static(uploadDir));

  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) console.log(`Port ${preferredPort} is busy, using port ${port} instead`);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
