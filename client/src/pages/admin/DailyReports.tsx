import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Trash2, Edit2, Calendar, AlertCircle, Image as ImageIcon, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { storagePut } from "@/lib/storage";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminDailyReportsPage() {
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: reports, isLoading } = trpc.dailyReports.list.useQuery();
  const createMutation = trpc.dailyReports.create.useMutation({
    onSuccess: () => {
      toast.success("작업일보가 등록되었습니다.");
      utils.dailyReports.list.invalidate();
      resetForm();
      setIsOpen(false);
    },
    onError: () => toast.error("등록에 실패했습니다."),
  });

  const updateMutation = trpc.dailyReports.update.useMutation({
    onSuccess: () => {
      toast.success("작업일보가 수정되었습니다.");
      utils.dailyReports.list.invalidate();
      resetForm();
      setIsOpen(false);
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const deleteMutation = trpc.dailyReports.delete.useMutation({
    onSuccess: () => {
      toast.success("작업일보가 삭제되었습니다.");
      utils.dailyReports.list.invalidate();
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const resetForm = () => {
    setEditingId(null);
    setReportDate(new Date().toISOString().split("T")[0]);
    setTitle("");
    setContent("");
    setPhotoFile(null);
    setPhotoUrl("");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("파일 크기는 10MB 이하여야 합니다.");
        return;
      }
      setPhotoFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    setIsUploading(true);
    let finalPhotoUrl = photoUrl;
    let finalPhotoKey = "";

    try {
      if (photoFile) {
        const buffer = await photoFile.arrayBuffer();
        const result = await storagePut(
          `daily-reports/${Date.now()}-${photoFile.name}`,
          new Uint8Array(buffer),
          photoFile.type
        );
        finalPhotoUrl = result.url;
        finalPhotoKey = result.key;
      }

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          reportDate: new Date(reportDate),
          title,
          content: content || undefined,
          photoUrl: finalPhotoUrl || undefined,
          photoKey: finalPhotoKey || undefined,
        });
      } else {
        await createMutation.mutateAsync({
          reportDate: new Date(reportDate),
          title,
          content: content || undefined,
          photoUrl: finalPhotoUrl || undefined,
          photoKey: finalPhotoKey || undefined,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">작업일보 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">일일 작업 현황을 기록하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (!reports || reports.length === 0) {
                toast.error("다운로드할 작업일보가 없습니다.");
                return;
              }
              const data = reports.map((r) => ({
                날짜: new Date(r.reportDate).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
                제목: r.title,
                내용: r.content || "-",
                등록일: new Date(r.createdAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
              }));
              const ws = XLSX.utils.json_to_sheet(data);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "작업일보");
              ws["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 40 }, { wch: 15 }];
              XLSX.writeFile(wb, `작업일보_${new Date().toISOString().split("T")[0]}.xlsx`);
              toast.success("Excel 파일이 다운로드되었습니다.");
            }}
            disabled={isLoading || !reports?.length}
          >
            <Download className="w-4 h-4" />
            Excel 다운로드
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => resetForm()}>
                <Plus className="w-4 h-4" />
                새 작업일보
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? "작업일보 수정" : "새 작업일보 등록"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                <Label>작업 날짜</Label>
                <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>제목</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="작업 제목"
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>내용</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="작업 내용 (선택)"
                  rows={3}
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>사진 업로드</Label>
                  <div className="relative">
                    <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={isUploading}
                      className="hidden"
                      id="photo-input"
                    />
                    <label
                    htmlFor="photo-input"
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/30 transition"
                    >
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {photoFile ? photoFile.name : "사진을 선택하세요"}
                      </span>
                    </label>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isUploading || createMutation.isPending || updateMutation.isPending}
                >
                  {isUploading ? "업로드 중..." : editingId ? "수정하기" : "등록하기"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Reports list */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))
          ) : reports?.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <AlertCircle className="w-8 h-8 opacity-30" />
              <p className="text-sm">작업일보가 없습니다.</p>
            </div>
          ) : (
            reports?.map((report) => (
              <div key={report.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition">
                {report.photoUrl ? (
                  <img
                    src={report.photoUrl}
                    alt={report.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{report.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{formatDate(report.reportDate)}</p>
                  </div>
                  {report.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{report.content}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(report.id);
                      setReportDate(new Date(report.reportDate).toISOString().split("T")[0]);
                      setTitle(report.title);
                      setContent(report.content || "");
                      setPhotoUrl(report.photoUrl || "");
                      setIsOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ id: report.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
