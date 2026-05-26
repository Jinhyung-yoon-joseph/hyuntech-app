import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Pencil, Trash2, ClipboardList, BarChart2, AlertCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function AdminExams() {
  const utils = trpc.useUtils();
  const { data: exams, isLoading } = trpc.exams.list.useQuery();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [passingScore, setPassingScore] = useState("60");

  const createMutation = trpc.exams.create.useMutation({
    onSuccess: () => { toast.success("시험이 생성되었습니다."); utils.exams.list.invalidate(); closeDialog(); },
    onError: () => toast.error("생성에 실패했습니다."),
  });

  const updateMutation = trpc.exams.update.useMutation({
    onSuccess: () => { toast.success("변경되었습니다."); utils.exams.list.invalidate(); },
    onError: () => toast.error("변경에 실패했습니다."),
  });

  const deleteMutation = trpc.exams.delete.useMutation({
    onSuccess: () => { toast.success("시험이 삭제되었습니다."); utils.exams.list.invalidate(); setDeleteId(null); },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const closeDialog = () => { setOpen(false); setTitle(""); setDescription(""); setTimeLimit(""); setPassingScore("60"); };

  const handleCreate = () => {
    if (!title.trim()) { toast.error("시험 제목을 입력해주세요."); return; }
    createMutation.mutate({
      title,
      description: description || undefined,
      timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
      passingScore: parseInt(passingScore) || 60,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">시험 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">시험을 생성하고 문제를 관리하세요.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          새 시험
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))
        ) : exams?.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <AlertCircle className="w-10 h-10 opacity-30" />
            <p className="text-sm">등록된 시험이 없습니다.</p>
          </div>
        ) : (
          exams?.map((exam) => (
            <Card key={exam.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    exam.isActive ? "bg-blue-50 text-blue-600" : "bg-muted text-muted-foreground"
                  )}>
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{exam.title}</p>
                      <Badge className={cn(
                        "text-[10px] px-1.5 py-0 border-0",
                        exam.isActive ? "bg-blue-50 text-blue-600" : "bg-muted text-muted-foreground"
                      )}>
                        {exam.isActive ? "활성" : "비활성"}
                      </Badge>
                    </div>
                    {exam.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{exam.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>합격 {exam.passingScore}점</span>
                      {exam.timeLimit && <span>· {exam.timeLimit}분</span>}
                      <span>· {formatDate(exam.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Link href={`/admin/exams/${exam.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1">
                      <Pencil className="w-3.5 h-3.5" />
                      문제 편집
                    </Button>
                  </Link>
                  <Link href={`/admin/exams/${exam.id}/results`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1">
                      <BarChart2 className="w-3.5 h-3.5" />
                      결과 조회
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => updateMutation.mutate({ id: exam.id, isActive: !exam.isActive })}
                  >
                    {exam.isActive ? <ToggleRight className="w-4 h-4 text-blue-600" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(exam.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 시험 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>시험 제목</Label>
              <Input placeholder="예: 신입사원 입사 시험" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>설명 (선택)</Label>
              <Textarea placeholder="시험에 대한 설명" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>제한 시간 (분, 선택)</Label>
                <Input type="number" placeholder="예: 30" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>합격 점수 (%)</Label>
                <Input type="number" placeholder="60" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>취소</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "생성 중..." : "시험 생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시험 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 시험과 모든 문제, 결과가 삭제됩니다. 되돌릴 수 없습니다.</AlertDialogDescription>
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
