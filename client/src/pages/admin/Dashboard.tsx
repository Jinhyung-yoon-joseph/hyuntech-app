import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  Users, Bell, FolderOpen, MessageSquare, ClipboardList,
  TrendingUp, ChevronRight, Shield
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const adminMenus = [
  { href: "/admin/notices", icon: Bell, label: "공지사항 관리", desc: "공지 등록 및 수정", color: "bg-blue-50 text-blue-600" },
  { href: "/admin/files", icon: FolderOpen, label: "자료실 관리", desc: "파일 업로드 및 관리", color: "bg-emerald-50 text-emerald-600" },
  { href: "/admin/qna", icon: MessageSquare, label: "Q&A 관리", desc: "질문 답변 작성", color: "bg-violet-50 text-violet-600" },
  { href: "/admin/signatures", icon: Shield, label: "서명 관리", desc: "직원 서명 내역 조회", color: "bg-amber-50 text-amber-600" },
  { href: "/admin/exams", icon: ClipboardList, label: "시험 관리", desc: "시험 등록 및 결과 조회", color: "bg-rose-50 text-rose-600" },
  { href: "/admin/users", icon: Users, label: "직원 관리", desc: "직원 목록 및 권한 관리", color: "bg-orange-50 text-orange-600" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && user.role !== "admin") navigate("/");
  }, [user]);

  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: recentNotices } = trpc.dashboard.recentNotices.useQuery();

  const statCards = [
    { label: "전체 직원", value: stats?.users, icon: Users, color: "text-blue-600" },
    { label: "공지사항", value: stats?.notices, icon: Bell, color: "text-emerald-600" },
    { label: "자료실", value: stats?.files, icon: FolderOpen, color: "text-violet-600" },
    { label: "Q&A", value: stats?.qnaPosts, icon: MessageSquare, color: "text-amber-600" },
    { label: "시험", value: stats?.exams, icon: ClipboardList, color: "text-rose-600" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">관리자 대시보드</h1>
          <p className="text-sm text-muted-foreground">현테크 현장관리 포털 관리 센터</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-12 mb-1" />
              ) : (
                <p className={cn("text-3xl font-bold", stat.color)}>{stat.value ?? 0}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin menus */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">관리 메뉴</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {adminMenus.map((menu) => (
            <Link key={menu.href} href={menu.href}>
              <div className="bg-card rounded-2xl border border-border p-4 card-hover cursor-pointer">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", menu.color)}>
                  <menu.icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">{menu.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{menu.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent notices */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">최근 공지사항</h2>
          <Link href="/admin/notices">
            <span className="text-xs text-primary font-medium flex items-center gap-0.5 cursor-pointer hover:underline">
              관리하기 <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0 divide-y divide-border">
            {recentNotices?.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">공지사항이 없습니다.</div>
            ) : (
              recentNotices?.map((n) => (
                <div key={n.id} className="flex items-center gap-3 p-4">
                  <Bell className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-sm text-foreground flex-1 truncate">{n.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(n.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
