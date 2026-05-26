import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Users, Shield, User, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = trpc.users.list.useQuery();

  const adminCount = users?.filter((u) => u.role === "admin").length ?? 0;
  const userCount = users?.filter((u) => u.role === "user").length ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">직원 관리</h1>
        <p className="text-sm text-muted-foreground mt-0.5">등록된 직원 목록을 확인하세요.</p>
      </div>

      {/* Stats */}
      {users && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground mt-1">전체 직원</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">{adminCount}</p>
            <p className="text-xs text-muted-foreground mt-1">관리자</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{userCount}</p>
            <p className="text-xs text-muted-foreground mt-1">일반 직원</p>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        <strong>역할 변경 안내:</strong> 직원의 관리자 권한 부여는 데이터베이스 패널에서 직접 role 필드를 수정하세요.
      </div>

      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : users?.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <AlertCircle className="w-10 h-10 opacity-30" />
              <p className="text-sm">등록된 직원이 없습니다.</p>
            </div>
          ) : (
            users?.map((user) => {
              const isCurrentUser = user.id === currentUser?.id;
              const initials = user.name ? user.name.slice(0, 2) : "HT";
              return (
                <div key={user.id} className="flex items-center gap-3 p-4">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className={cn(
                      "text-sm font-semibold",
                      user.role === "admin" ? "bg-primary/15 text-primary" : "bg-blue-50 text-blue-600"
                    )}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name ?? "이름 없음"}
                        {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(나)</span>}
                      </p>
                      <Badge className={cn(
                        "text-[10px] px-1.5 py-0 border-0 shrink-0",
                        user.role === "admin" ? "bg-primary/15 text-primary" : "bg-blue-50 text-blue-600"
                      )}>
                        {user.role === "admin" ? "관리자" : "직원"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {user.email ?? "이메일 없음"} · 가입 {formatDate(user.createdAt)}
                    </p>
                  </div>
                  {user.role === "admin" ? (
                    <Shield className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
