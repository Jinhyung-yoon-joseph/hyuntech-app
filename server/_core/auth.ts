import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { createHash } from "crypto";

function getSecretKey() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export type SessionPayload = {
  userId: number;
  name: string;
};

export function hashPassword(password: string): string {
  const salt = "hyuntech-salt-2024";
  return createHash("sha256").update(salt + password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// 사번 정규화 - 대소문자 무시, cp/id 부분 소문자로 통일
export function normalizeEmployeeId(employeeId: string): string {
  // 앞뒤 공백 제거
  let id = employeeId.trim();
  // CP로 시작하면 소문자 cp로
  id = id.replace(/^cp/i, "cp");
  // .ID로 끝나면 소문자 .id로  
  id = id.replace(/\.id$/i, ".id");
  return id;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1y")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function authenticateRequest(req: Request): Promise<User | null> {
  const cookieHeader = req.headers.cookie ?? "";
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.userId) return null;

  const user = await db.getUserById(payload.userId);
  return user ?? null;
}
