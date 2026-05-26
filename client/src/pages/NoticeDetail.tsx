import { trpc } from "@/lib/trpc";
import { ArrowLeft, Pin, Calendar } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

export default function NoticeDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = parseInt(params.id);

  const { data: notice, isLoading } = trpc.notices.byId.useQuery({ id }, { enabled: !isNaN(id) });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => navigate("/notices")}>
        <ArrowLeft className="w-4 h-4" />
        공지사항 목록
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : notice ? (
        <article className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-start gap-3">
              {notice.isPinned && (
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Pin className="w-4 h-4 text-accent" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-xl font-bold text-foreground">{notice.title}</h1>
                  {notice.isPinned && (
                    <Badge className="bg-accent/15 text-accent border-0 text-xs">고정 공지</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(notice.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
              {notice.content}
            </div>
          </div>
        </article>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>공지사항을 찾을 수 없습니다.</p>
        </div>
      )}
    </div>
  );
}
