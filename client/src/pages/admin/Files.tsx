import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Upload, Trash2, File, FileText, Image, FolderOpen, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = ["일반", "안전", "교육", "서식", "기타"];

// 파일 용량 제한: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// 허용 파일 형식
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/webp": "WebP",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "text/plain": "TXT",
  "application/zip": "ZIP",
  "application/x-hwp": "HWP",
  "application/haansofthwp": "HWP",
};

function formatSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function FileIcon({ mimeType }: { mimeType?: string | null }) {
  if (mimeType?.startsWith("image/")) return <Image className="w-5 h-5" />;
  if (mimeType === "application/pdf") return <FileText className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
}

function getFileColor(mimeType?: string | null) {
  if (mimeType?.startsWith("image/")) return "bg-emerald-50 text-emerald-600";
  if (mimeType === "application/pdf") return "bg-rose-50 text-rose-600";
  return "bg-blue-50 text-blue-600";
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `파일 크기가 너무 큽니다. 최대 50MB까지 업로드 가능합니다. (현재: ${formatSize(file.size)})`;
  }
  // 파일 확장자 기반 허용 (MIME 타입이 브라우저마다 다를 수 있으므로)
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ["pdf", "jpg", "jpeg", "png", "gif", "webp", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip", "hwp"];
  if (ext && !allowedExts.includes(ext)) {
    return `지원하지 않는 파일 형식입니다. (${ext.toUpperCase()})\n지원 형식: PDF, JPG, PNG, DOCX, XLSX, PPTX, HWP, TXT, ZIP`;
  }
  return null;
}

export default function AdminFiles() {
  const utils = trpc.useUtils();
  const { data: files, isLoading } = trpc.files.list.useQuery({});
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("일반");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.files.upload.useMutation({
    onSuccess: () => {
      toast.success("파일이 업로드되었습니다.");
      utils.files.list.invalidate();
      closeDialog();
    },
    onError: (err) => {
      toast.error("업로드에 실패했습니다. 다시 시도해주세요.");
      setUploading(false);
      setProgress(0);
    },
  });

  const deleteMutation = trpc.files.delete.useMutation({
    onSuccess: () => { toast.success("파일이 삭제되었습니다."); utils.files.list.invalidate(); setDeleteId(null); },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const closeDialog = () => {
    setOpen(false);
    setSelectedFile(null);
    setFileError(null);
    setTitle("");
    setDescription("");
    setCategory("일반");
    setUploading(false);
    setProgress(0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    // 파일명에서 확장자 제외하고 제목 자동입력
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const error = validateFile(file);
    if (error) { setFileError(error); return; }
    setFileError(null);
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) { toast.error("파일과 제목을 입력해주세요."); return; }
    setUploading(true);
    setProgress(10);

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(10 + Math.round((e.loaded / e.total) * 50));
      }
    };
    reader.onload = (e) => {
      setProgress(70);
      const base64 = (e.target?.result as string).split(",")[1];
      uploadMutation.mutate({
        title,
        description: description || undefined,
        originalName: selectedFile.name,
        mimeType: selectedFile.type || "application/octet-stream",
        fileSize: selectedFile.size,
        category,
        fileData: base64,
      });
    };
    reader.onerror = () => {
      toast.error("파일 읽기에 실패했습니다.");
      setUploading(false);
      setProgress(0);
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">자료실 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">파일을 업로드하고 관리하세요.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Upload className="w-4 h-4" />
          파일 업로드
        </Button>
      </div>

      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
              </div>
            ))
          ) : files?.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <FolderOpen className="w-10 h-10 opacity-30" />
              <p className="text-sm">업로드된 파일이 없습니다.</p>
            </div>
          ) : (
            files?.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", getFileColor(file.mimeType))}>
                  <FileIcon mimeType={file.mimeType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{formatDate(file.createdAt)}</span>
                    {file.fileSize && <span className="text-xs text-muted-foreground">· {formatSize(file.fileSize)}</span>}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-0">{file.category}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive shrink-0"
                  onClick={() => setDeleteId(file.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Upload dialog - 모바일 최적화 */}
      <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md flex flex-col max-h-[90dvh] p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
            <DialogTitle>파일 업로드</DialogTitle>
            {/* 용량/형식 안내 */}
            <div className="flex items-start gap-1.5 mt-1 p-2.5 rounded-lg bg-blue-50 text-blue-700">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed">
                최대 <strong>50MB</strong>까지 업로드 가능<br />
                PDF, JPG, PNG, DOCX, XLSX, PPTX, HWP, TXT, ZIP
              </p>
            </div>
          </DialogHeader>

          {/* 스크롤 가능한 본문 */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4">
            {/* File drop zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors",
                fileError ? "border-destructive bg-destructive/5" :
                selectedFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.hwp"
              />
              {selectedFile ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <File className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setFileError(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">클릭하거나 파일을 여기에 끌어다 놓으세요</p>
                </div>
              )}
            </div>

            {/* 파일 오류 메시지 */}
            {fileError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs whitespace-pre-line">
                {fileError}
              </div>
            )}

            {/* 업로드 진행률 */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>업로드 중...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>제목 <span className="text-destructive">*</span></Label>
              <Input placeholder="파일 제목" value={title} onChange={(e) => setTitle(e.target.value)} disabled={uploading} />
            </div>
            <div className="space-y-1.5">
              <Label>설명 (선택)</Label>
              <Textarea placeholder="파일에 대한 설명" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={uploading} />
            </div>
            <div className="space-y-1.5">
              <Label>카테고리</Label>
              <Select value={category} onValueChange={setCategory} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 항상 보이는 하단 버튼 */}
          <DialogFooter className="px-5 py-4 border-t border-border shrink-0 flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={closeDialog} disabled={uploading}>취소</Button>
            <Button className="flex-1" onClick={handleUpload} disabled={uploading || !selectedFile || !!fileError}>
              {uploading ? "업로드 중..." : "업로드"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>파일 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 파일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
