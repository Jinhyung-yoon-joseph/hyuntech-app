import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Bell, ChevronRight, Pin, AlertCircle, Search, ShieldAlert, ClipboardList, FileWarning } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

const NOTICE_TABS = [
  { key: "안전회의", label: "안전회의", icon: ShieldAlert, color: "text-orange-600 bg-orange-50", badge: "bg-orange-100 text-orange-700" },
  { key: "매일공지", label: "매일 공지사항", icon: ClipboardList, color: "text-blue-600 bg-blue-50", badge: "bg-blue-100 text-blue-700" },
  { key: "사고사례", label: "사고사례(누적)", icon: FileWarning, color: "text-red-600 bg-red-50", badge: "bg-red-100 text-red-700" },
] as const;

type NoticeCategory = "안전회의" | "매일공지" | "사고사례";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function NoticesPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<NoticeCategory>("안전회의");

  const { data: allNotices, isLoading } = trpc.notices.list.useQuery({
    search: search || undefined,
  });

  const notices = allNotices?.filter(n => (n.category ?? "매일공지") === activeTab) ?? [];
  const currentTab = NOTICE_TABS.find(t => t.key === activeTab)!;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">공지사항</h1>
        <p className="text-sm text-muted-foreground mt-0.5">탭을 선택해 공지를 확인하세요.</p>
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
                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all",
                activeTab === tab.key
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium leading-tight text-center">{tab.label}</span>
              {count > 0 && (
                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", tab.badge)}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={`${currentTab.label} 검색...`}
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 공지 목록 */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))
          ) : notices.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <AlertCircle className="w-10 h-10 opacity-30" />
              <p className="text-sm">{search ? "검색 결과가 없습니다." : "공지사항이 없습니다."}</p>
            </div>
          ) : (
            notices.map((notice) => {
              const Icon = currentTab.icon;
              return (
                <Link key={notice.id} href={`/notices/${notice.id}`}>
                  <div className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors cursor-pointer active:bg-muted/60">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      notice.isPinned ? "bg-accent/20 text-accent" : currentTab.color
                    )}>
                      {notice.isPinned ? <Pin className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground leading-snug">{notice.title}</p>
                        {notice.isPinned && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-accent/15 text-accent border-0 shrink-0">
                            고정
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(notice.createdAt)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
