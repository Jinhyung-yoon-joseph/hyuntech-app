// 파일을 base64로 변환하는 클라이언트 유틸리티
// 실제 업로드는 서버 tRPC 라우터를 통해 처리됩니다

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/png;base64,... 에서 base64 부분만 추출
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Legacy compatibility - kept for DailyReports
export async function storagePut(
  _relKey: string,
  _data: Uint8Array | Buffer | ArrayBuffer,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  throw new Error("Use tRPC mutations for file uploads");
}
