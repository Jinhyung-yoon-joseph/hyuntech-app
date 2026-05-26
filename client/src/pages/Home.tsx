import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Bell,
  ClipboardList,
  FolderOpen,
  MessageSquare,
  PenLine,
  Trophy,
  ChevronRight,
  Pin,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const quickMenuUser = [
  { href: "/notices", icon: Bell, label: "공지사항", color: "bg-blue-50 text-blue-600", desc: "최신 공지 확인" },
  { href: "/files", icon: FolderOpen, label: "자료실", color: "bg-emerald-50 text-emerald-600", desc: "업무 자료 열람" },
  { href: "/qna", icon: MessageSquare, label: "Q&A", color: "bg-violet-50 text-violet-600", desc: "질문 및 답변" },
  { href: "/signature", icon: PenLine, label: "전자서명", color: "bg-amber-50 text-amber-600", desc: "문서 서명 제출" },
  { href: "/exams", icon: ClipboardList, label: "시험 응시", color: "bg-rose-50 text-rose-600", desc: "입사 시험 응시" },
  { href: "/my-results", icon: Trophy, label: "내 결과", color: "bg-orange-50 text-orange-600", desc: "시험 결과 확인" },
];

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function Home() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: recentNotices, isLoading: noticesLoading } = trpc.dashboard.recentNotices.useQuery();

  const isAdmin = user?.role === "admin";
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "좋은 아침이에요";
    if (h < 18) return "안녕하세요";
    return "수고하셨어요";
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 lg:max-w-4xl">
      {/* Hero greeting */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 21px)"
        }} />
        <div className="relative">
          <p className="text-primary-foreground/70 text-sm mb-1">{greeting()},</p>
          <h1 className="text-2xl font-bold mb-1">{user?.name ?? "직원"}님</h1>
          <p className="text-primary-foreground/70 text-sm">
            현테크 현장관리 포털에 오신 것을 환영합니다.
          </p>
          {isAdmin && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-accent/20 text-accent-foreground/90 px-3 py-1 rounded-full text-xs font-medium border border-accent/30">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              관리자 계정
            </div>
          )}
        </div>
      </div>

      {/* Stats (admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : (
            <>
              <StatCard label="전체 직원" value={stats?.users ?? 0} color="text-blue-600" />
              <StatCard label="공지사항" value={stats?.notices ?? 0} color="text-emerald-600" />
              <StatCard label="자료실" value={stats?.files ?? 0} color="text-violet-600" />
              <StatCard label="Q&A" value={stats?.qnaPosts ?? 0} color="text-amber-600" />
            </>
          )}
        </div>
      )}

      {/* Quick menu */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">빠른 메뉴</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {quickMenuUser.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border card-hover cursor-pointer">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-foreground text-center leading-tight">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent notices */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">최근 공지사항</h2>
          <Link href="/notices">
            <span className="text-xs text-primary font-medium flex items-center gap-0.5 cursor-pointer hover:underline">
              전체보기 <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
        <Card className="border-border">
          <CardContent className="p-0 divide-y divide-border">
            {noticesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))
            ) : recentNotices?.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <AlertCircle className="w-8 h-8 opacity-40" />
                <p className="text-sm">등록된 공지사항이 없습니다.</p>
              </div>
            ) : (
              recentNotices?.map((notice) => (
                <Link key={notice.id} href={`/notices/${notice.id}`}>
                  <div className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors cursor-pointer">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      notice.isPinned ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
                    )}>
                      {notice.isPinned ? <Pin className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{notice.title}</p>
                        {notice.isPinned && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 bg-accent/15 text-accent border-0">
                            고정
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(notice.createdAt)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* Admin shortcut */}
      {isAdmin && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">관리자 메뉴</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { href: "/admin", label: "대시보드", icon: "📊" },
              { href: "/admin/exams", label: "시험 관리", icon: "📝" },
              { href: "/admin/qna", label: "Q&A 답변", icon: "💬" },
              { href: "/admin/users", label: "직원 관리", icon: "👥" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/15 card-hover cursor-pointer">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 text-center">
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
