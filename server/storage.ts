// 로컬 파일 스토리지 - uploads/ 폴더에 저장
import fs from "fs";
import path from "path";
import { ENV } from "./_core/env";

function getUploadDir(): string {
  const dir = path.resolve(process.cwd(), ENV.uploadDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function sanitizeFilename(name: string): string {
  // 안전한 파일명으로 변환 (UUID + 원본 확장자)
  const ext = path.extname(name);
  const uuid = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `${uuid}${ext}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const uploadDir = getUploadDir();
  
  // relKey에서 디렉토리 구조 유지 (예: files/filename.pdf)
  const parts = relKey.split("/");
  const subDir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
  const originalName = parts[parts.length - 1];
  const safeFilename = sanitizeFilename(originalName);
  
  let targetDir = uploadDir;
  if (subDir) {
    targetDir = path.join(uploadDir, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  }
  
  const key = subDir ? `${subDir}/${safeFilename}` : safeFilename;
  const filePath = path.join(uploadDir, key);
  
  if (typeof data === "string") {
    fs.writeFileSync(filePath, Buffer.from(data, "base64"));
  } else {
    fs.writeFileSync(filePath, data);
  }
  
  return { key, url: `/uploads/${key}` };
}

export async function storageDelete(relKey: string): Promise<void> {
  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, relKey);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // 파일 삭제 실패는 무시
  }
}
