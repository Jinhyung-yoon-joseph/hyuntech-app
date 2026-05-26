import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Pencil, Trash2, Pin, Bell, AlertCircle, ShieldAlert, ClipboardList, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// 공지 카테고리 3개 탭
const NOTICE_TABS = [
  { key: "안전회의", label: "안전회의", icon: ShieldAlert, color: "text-orange-600 bg-orange-50" },
  { key: "매일공지", label: "매일 공지사항", icon: ClipboardList, color: "text-blue-600 bg-blue-50" },
  { key: "사고사례", label: "사고사례(누적)", icon: FileWarning, color: "text-red-600 bg-red-50" },
] as const;

type NoticeCategory = "안전회의" | "매일공지" | "사고사례";
type Notice = { id: number; title: string; content: string; isPinned: boolean; category?: string; createdAt: Date };

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function getCategoryStyle(category?: string | null) {
  const tab = NOTICE_TABS.find(t => t.key === category);
  return tab?.color ?? "text-primary bg-primary/10";
}

function getCategoryIcon(category?: string | null) {
  const tab = NOTICE_TABS.find(t => t.key === category);
  const Icon = tab?.icon ?? Bell;
  return Icon;
}

export default function AdminNotices() {
  const utils = trpc.useUtils();
  const { data: allNotices, isLoading } = trpc.notices.list.useQuery({ search: undefined });

  const [activeTab, setActiveTab] = useState<NoticeCategory>("안전회의");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NoticeCategory>("안전회의");

  // 현재 탭의 공지만 필터링
  const notices = allNotices?.filter(n => (n.category ?? "매일공지") === activeTab) ?? [];

  const createMutation = trpc.notices.create.useMutation({
    onSuccess: () => { toast.success("공지사항이 등록되었습니다."); utils.notices.list.invalidate(); utils.dashboard.recentNotices.invalidate(); closeDialog(); },
    onError: () => toast.error("등록에 실패했습니다."),
  });

  const updateMutation = trpc.notices.update.useMutation({
    onSuccess: () => { toast.success("공지사항이 수정되었습니다."); utils.notices.list.invalidate(); utils.dashboard.recentNotices.invalidate(); closeDialog(); },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const deleteMutation = trpc.notices.delete.useMutation({
    onSuccess: () => { toast.success("삭제되었습니다."); utils.notices.list.invalidate(); utils.dashboard.recentNotices.invalidate(); setDeleteId(null); },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setContent("");
    setIsPinned(false);
    setSelectedCategory(activeTab); // 현재 탭 카테고리로 기본 설정
    setOpen(true);
  };

  const openEdit = (n: Notice) => {
    setEditing(n);
    setTitle(n.title);
    setContent(n.content);
    setIsPinned(n.isPinned);
    setSelectedCategory((n.category as NoticeCategory) ?? "매일공지");
    setOpen(true);
  };

  const closeDialog = () => { setOpen(false); setEditing(null); };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) { toast.error("제목과 내용을 입력해주세요."); return; }
    if (editing) {
      updateMutation.mutate({ id: editing.id, title, content, isPinned, category: selectedCategory });
    } else {
      createMutation.mutate({ title, content, isPinned, category: selectedCategory });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">공지사항 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">탭을 선택하고 공지를 등록하세요.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          새 공지
        </Button>
      </div>

      {/* 탭 3개 */}
      <div className="grid grid-cols-3 gap-2">
        {NOTICE_TABS.map((tab) => {
          const Icon = tab.icon;
          const count = allNotices?.filter(n => (n.category ?? "매일공지") === tab.key).length ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all text-center",
                activeTab === tab.key
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium leading-tight">{tab.label}</span>
              {count > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 border-0">{count}</Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* 현재 탭 공지 목록 */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
              </div>
            ))
          ) : notices.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
              <AlertCircle className="w-10 h-10 opacity-30" />
              <p className="text-sm">등록된 공지사항이 없습니다.</p>
              <Button size="sm" variant="outline" onClick={openCreate}>
                <Plus className="w-3.5 h-3.5 mr-1" />첫 공지 등록하기
              </Button>
            </div>
          ) : (
            notices.map((notice) => {
              const Icon = getCategoryIcon(notice.category);
              return (
                <div key={notice.id} className="flex items-center gap-3 p-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", getCategoryStyle(notice.category))}>
                    {notice.isPinned ? <Pin className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{notice.title}</p>
                      {notice.isPinned && <Badge className="text-[10px] px-1.5 py-0 bg-accent/15 text-accent border-0 shrink-0">고정</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(notice.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(notice as Notice)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(notice.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 공지 작성/수정 Dialog - 모바일 최적화 (스크롤 + 버튼 항상 표시) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md flex flex-col max-h-[90dvh] p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
            <DialogTitle>{editing ? "공지사항 수정" : "새 공지사항"}</DialogTitle>
          </DialogHeader>

          {/* 스크롤 가능한 본문 */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4">
            {/* 카테고리 탭 선택 */}
            <div className="space-y-1.5">
              <Label>카테고리</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {NOTICE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedCategory(tab.key)}
                    className={cn(
                      "py-2 px-1 rounded-lg text-xs font-medium border transition-all",
                      selectedCategory === tab.key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>제목 <span className="text-destructive">*</span></Label>
              <Input
                placeholder="공지사항 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>내용 <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="카톡 내용을 붙여넣거나 직접 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] resize-none text-sm leading-relaxed"
                style={{ height: "auto", minHeight: "200px" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 400) + "px";
                }}
              />
              <p className="text-xs text-muted-foreground">{content.length}자</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">상단 고정</p>
                <p className="text-xs text-muted-foreground">목록 최상단에 표시됩니다</p>
              </div>
              <Switch checked={isPinned} onCheckedChange={setIsPinned} />
            </div>
          </div>

          {/* 항상 보이는 하단 버튼 */}
          <DialogFooter className="px-5 py-4 border-t border-border shrink-0 flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={closeDialog}>취소</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={isPending}>
              {isPending ? "저장 중..." : editing ? "수정하기" : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
