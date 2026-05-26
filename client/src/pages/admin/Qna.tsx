import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { MessageSquare, CheckCircle, Lock, ChevronDown, ChevronUp, Send, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function AdminQna() {
  const utils = trpc.useUtils();
  const { data: posts, isLoading } = trpc.qna.list.useQuery();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [answerTexts, setAnswerTexts] = useState<Record<number, string>>({});

  const answerMutation = trpc.qna.answer.useMutation({
    onSuccess: (_, vars) => {
      toast.success("답변이 등록되었습니다.");
      utils.qna.list.invalidate();
      utils.qna.byId.invalidate({ id: vars.postId });
      setAnswerTexts((prev) => ({ ...prev, [vars.postId]: "" }));
    },
    onError: () => toast.error("답변 등록에 실패했습니다."),
  });

  const deletePostMutation = trpc.qna.delete.useMutation({
    onSuccess: () => { toast.success("게시글이 삭제되었습니다."); utils.qna.list.invalidate(); },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const handleAnswer = (postId: number) => {
    const text = answerTexts[postId]?.trim();
    if (!text) { toast.error("답변 내용을 입력해주세요."); return; }
    answerMutation.mutate({ postId, content: text });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Q&A 관리</h1>
        <p className="text-sm text-muted-foreground mt-0.5">직원들의 질문에 답변하세요.</p>
      </div>

      {/* Stats */}
      {posts && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-violet-600">{posts.filter((p) => !p.isAnswered).length}</p>
            <p className="text-xs text-muted-foreground mt-1">답변 대기</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{posts.filter((p) => p.isAnswered).length}</p>
            <p className="text-xs text-muted-foreground mt-1">답변 완료</p>
          </div>
        </div>
      )}

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
        ) : posts?.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <AlertCircle className="w-10 h-10 opacity-30" />
            <p className="text-sm">등록된 질문이 없습니다.</p>
          </div>
        ) : (
          posts?.map((post) => {
            const isExpanded = expandedId === post.id;
            const { data: detail } = trpc.qna.byId.useQuery({ id: post.id }, { enabled: isExpanded });

            return (
              <Card key={post.id} className={cn("border-border overflow-hidden", !post.isAnswered && "border-violet-200")}>
                <CardContent className="p-0">
                  {/* Header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : post.id)}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      post.isAnswered ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-600"
                    )}>
                      {post.isAnswered ? <CheckCircle className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                        {post.isPrivate && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                        <Badge className={cn(
                          "text-[10px] px-1.5 py-0 border-0 shrink-0",
                          post.isAnswered ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-600"
                        )}>
                          {post.isAnswered ? "답변완료" : "대기중"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(post.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); deletePostMutation.mutate({ id: post.id }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 space-y-4">
                      <div className="pt-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">질문 내용</p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
                          {detail?.post.content}
                        </p>
                      </div>

                      {detail?.answers && detail.answers.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">기존 답변</p>
                          {detail.answers.map((ans) => (
                            <div key={ans.id} className="bg-primary/5 rounded-lg p-3 border border-primary/15">
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{ans.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">{formatDate(ans.createdAt)}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {!post.isAnswered && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">답변 작성</p>
                          <Textarea
                            placeholder="답변 내용을 입력하세요..."
                            rows={3}
                            value={answerTexts[post.id] ?? ""}
                            onChange={(e) => setAnswerTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          />
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleAnswer(post.id)}
                            disabled={answerMutation.isPending}
                          >
                            <Send className="w-3.5 h-3.5" />
                            {answerMutation.isPending ? "등록 중..." : "답변 등록"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
