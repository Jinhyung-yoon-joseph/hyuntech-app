import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, MessageSquare, CheckCircle, Lock, Calendar } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export default function QnaDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const id = parseInt(params.id);

  const { data, isLoading } = trpc.qna.byId.useQuery({ id }, { enabled: !isNaN(id) });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => navigate("/qna")}>
        <ArrowLeft className="w-4 h-4" />
        Q&A 목록
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Question */}
          <article className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  data.post.isAnswered ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-600"
                )}>
                  {data.post.isAnswered ? <CheckCircle className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-lg font-bold text-foreground">{data.post.title}</h1>
                    {data.post.isPrivate && <Lock className="w-4 h-4 text-muted-foreground" />}
                    <Badge className={cn(
                      "text-xs border-0",
                      data.post.isAnswered ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-600"
                    )}>
                      {data.post.isAnswered ? "답변완료" : "답변대기"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(data.post.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{data.post.content}</p>
            </div>
          </article>

          {/* Answers */}
          {data.answers.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">답변</h2>
              {data.answers.map((answer) => (
                <div key={answer.id} className="bg-primary/5 rounded-2xl border border-primary/15 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">관</span>
                    </div>
                    <span className="text-xs font-semibold text-primary">관리자</span>
                    <span className="text-xs text-muted-foreground ml-auto">{formatDate(answer.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{answer.content}</p>
                </div>
              ))}
            </div>
          )}

          {!data.post.isAnswered && (
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">관리자가 답변을 준비 중입니다.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>게시글을 찾을 수 없습니다.</p>
        </div>
      )}
    </div>
  );
}
