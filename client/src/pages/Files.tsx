import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Download, FileText, Image, File, Search, AlertCircle, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const FILE_CATEGORIES = ["전체", "일반", "안전", "교육", "서식", "기타"];

function formatSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
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

export default function FilesPage() {
  const [category, setCategory] = useState("전체");
  const [search, setSearch] = useState("");

  const { data: files, isLoading } = trpc.files.list.useQuery({
    category: category === "전체" ? undefined : category,
  });

  const filtered = files?.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.originalName.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (file: { fileUrl: string; originalName: string; title: string }) => {
    const link = document.createElement("a");
    link.href = file.fileUrl;
    link.download = file.originalName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`"${file.title}" 다운로드를 시작합니다.`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">자료실</h1>
        <p className="text-sm text-muted-foreground mt-0.5">업무에 필요한 자료를 다운로드하세요.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="파일 검색..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0",
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="w-20 h-8 rounded-lg" />
              </div>
            ))
          ) : filtered?.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <FolderOpen className="w-10 h-10 opacity-30" />
              <p className="text-sm">자료가 없습니다.</p>
            </div>
          ) : (
            filtered?.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
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
                  {file.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{file.description}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5 text-xs"
                  onClick={() => handleDownload(file)}
                >
                  <Download className="w-3.5 h-3.5" />
                  다운로드
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
