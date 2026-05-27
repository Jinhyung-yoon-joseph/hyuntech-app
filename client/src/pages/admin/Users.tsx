import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Users, Shield, User, ToggleLeft, ToggleRight, KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.users.list.useQuery();

  const [pwDialog, setPwDialog] = useState<{ open: boolean; userId: number; name: string }>({ open: false, userId: 0, name: "" });
  const [newPw, setNewPw] = useState("");

  const setActiveMutation = trpc.users.setActive.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? "계정이 활성화됐습니다." : "계정이 비활성화됐습니다.");
      utils.users.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetPwMutation = trpc.users.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("비밀번호가 초기화됐습니다.");
      setPwDialog({ open: false, userId: 0, name: "" });
      setNewPw("");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("권한이 변경됐습니다.");
      utils.users.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const adminCount = users?.filter((u) => u.role === "admin").length ?? 0;
  const activeCount = users?.filter((u) => u.isActive !== false).length ?? 0;
  const inactiveCount = users?.filter((u) => u.isActive === false).length ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">직원 관리</h1>
        <p className="text-sm text-muted-foreground mt-0.5">직원 계정을 관리하세요.</p>
      </div>

      {users && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground mt-1">전체</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-primary">{adminCount}</p>
            <p className="text-xs text-muted-foreground mt-1">관리자</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">활성</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{inactiveCount}</p>
            <p className="text-xs text-muted-foreground mt-1">비활성</p>
          </div>
        </div>
      )}

      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : !users?.length ? (
            <div className="p-8 text-center text-muted-foreground text-sm">직원이 없습니다.</div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => (
                <div key={u.id} className={cn("p-4 space-y-3", u.isActive === false && "opacity-60 bg-muted/30")}>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={cn("text-sm font-semibold", u.role === "admin" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        {u.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{u.name ?? "이름 없음"}</span>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">
                          {u.role === "admin" ? "관리자" : "일반"}
                        </Badge>
                        {u.isActive === false && <Badge variant="destructive" className="text-xs">비활성</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.employeeId}</p>
                    </div>
                  </div>

                  {/* 관리 버튼들 */}
                  {u.id !== currentUser?.id && (
                    <div className="flex gap-2 flex-wrap">
                      {/* 활성/비활성 토글 */}
                      <Button
                        size="sm"
                        variant={u.isActive === false ? "outline" : "destructive"}
                        className="text-xs h-7 px-2"
                        onClick={() => setActiveMutation.mutate({ userId: u.id, isActive: u.isActive === false })}
                        disabled={setActiveMutation.isPending}
                      >
                        {u.isActive === false ? (
                          <><ToggleLeft className="w-3 h-3 mr-1" />활성화</>
                        ) : (
                          <><ToggleRight className="w-3 h-3 mr-1" />비활성화</>
                        )}
                      </Button>

                      {/* 관리자 권한 토글 */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={() => updateRoleMutation.mutate({ userId: u.id, role: u.role === "admin" ? "user" : "admin" })}
                        disabled={updateRoleMutation.isPending}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {u.role === "admin" ? "관리자 해제" : "관리자 지정"}
                      </Button>

                      {/* 비밀번호 초기화 */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={() => { setPwDialog({ open: true, userId: u.id, name: u.name ?? "" }); setNewPw(""); }}
                      >
                        <KeyRound className="w-3 h-3 mr-1" />비번 초기화
                      </Button>
                    </div>
                  )}
                  {u.id === currentUser?.id && (
                    <p className="text-xs text-muted-foreground">내 계정</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 비밀번호 초기화 다이얼로그 */}
      <Dialog open={pwDialog.open} onOpenChange={(o) => setPwDialog(p => ({ ...p, open: o }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{pwDialog.name} 비밀번호 초기화</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>새 비밀번호</Label>
              <Input
                type="password"
                placeholder="새 비밀번호 입력"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => resetPwMutation.mutate({ userId: pwDialog.userId, newPassword: newPw })}
              disabled={resetPwMutation.isPending || !newPw}
            >
              {resetPwMutation.isPending ? "초기화 중..." : "비밀번호 초기화"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
