import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Bell,
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderOpen,
  HardHat,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PenLine,
  Settings,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const userNavItems = [
  { href: "/", icon: LayoutDashboard, label: "홈" },
  { href: "/notices", icon: Bell, label: "공지사항" },
  { href: "/files", icon: FolderOpen, label: "자료실" },
  { href: "/qna", icon: MessageSquare, label: "Q&A" },
  { href: "/signature", icon: PenLine, label: "전자서명" },
  { href: "/exams", icon: ClipboardList, label: "시험" },
  { href: "/daily-reports", icon: FileText, label: "작업일보" },
  { href: "/notifications", icon: Bell, label: "알림" },
  { href: "/my-results", icon: Trophy, label: "내 결과" },
];

const adminNavItems = [
  { href: "/admin", icon: LayoutDashboard, label: "대시보드" },
  { href: "/admin/notices", icon: Bell, label: "공지관리" },
  { href: "/admin/files", icon: FolderOpen, label: "자료관리" },
  { href: "/admin/qna", icon: MessageSquare, label: "Q&A 관리" },
  { href: "/admin/signatures", icon: PenLine, label: "서명 관리" },
  { href: "/admin/exams", icon: ClipboardList, label: "시험 관리" },
  { href: "/admin/daily-reports", icon: FileText, label: "작업일보 관리" },
  { href: "/admin/users", icon: Users, label: "직원 관리" },
];

// Mobile bottom nav (5 items max)
const mobileUserNav = [
  { href: "/", icon: LayoutDashboard, label: "홈" },
  { href: "/notices", icon: Bell, label: "공지" },
  { href: "/files", icon: FolderOpen, label: "자료실" },
  { href: "/qna", icon: MessageSquare, label: "Q&A" },
  { href: "/notifications", icon: Bell, label: "알림" },
  { href: "/daily-reports", icon: FileText, label: "일보" },
];

const mobileAdminNav = [
  { href: "/admin", icon: LayoutDashboard, label: "대시보드" },
  { href: "/admin/notices", icon: Bell, label: "공지" },
  { href: "/admin/files", icon: FolderOpen, label: "자료" },
  { href: "/admin/daily-reports", icon: FileText, label: "일보" },
  { href: "/admin/exams", icon: ClipboardList, label: "시험" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNavItems : userNavItems;
  const mobileNav = isAdmin ? mobileAdminNav : mobileUserNav;

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
    onError: () => toast.error("로그아웃 실패"),
  });

  const initials = user?.name ? user.name.slice(0, 2) : "HT";

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 sidebar-nav">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <HardHat className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sidebar-foreground text-sm leading-tight">현테크</p>
            <p className="text-xs text-sidebar-foreground/60">현장관리 포털</p>
          </div>
        </div>

        {/* Role badge */}
        {isAdmin && (
          <div className="mx-4 mt-3 px-3 py-1.5 rounded-md bg-sidebar-primary/20 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-sidebar-primary" />
            <span className="text-xs font-medium text-sidebar-primary">관리자 모드</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* User profile */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarFallback className="bg-sidebar-primary/30 text-sidebar-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "직원"}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent text-xs gap-2"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="w-3.5 h-3.5" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <HardHat className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm leading-tight">현테크</p>
              {isAdmin && <p className="text-xs text-accent font-medium">관리자</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav lg:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNav.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[56px] cursor-pointer",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                  <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
