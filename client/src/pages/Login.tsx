import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HardHat } from "lucide-react";

export default function LoginPage() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("login");

  // 로그인
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // 회원가입
  const [regId, setRegId] = useState("");
  const [regPw, setRegPw] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regAdminKey, setRegAdminKey] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      window.location.href = "/";
    },
    onError: (e) => toast.error(e.message),
  });

  const resetMutation = trpc.auth.resetAllUsers.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (e) => toast.error(e.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      toast.success(data.role === "admin" ? "관리자 계정이 생성됐습니다! 로그인하세요." : "계정이 생성됐습니다. 로그인하세요.");
      setRegId(""); setRegPw(""); setRegName(""); setRegEmail(""); setRegAdminKey("");
      setActiveTab("login");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* 로고 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground">
            <HardHat className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold">현테크 현장관리</h1>
          <p className="text-muted-foreground text-sm">건설현장 직원 포털</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">로그인</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">계정 등록</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">로그인</CardTitle>
                <CardDescription>사번과 비밀번호를 입력하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>사번</Label>
                  <Input
                    placeholder="사번 입력"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate({ employeeId: loginId, password: loginPw })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>비밀번호</Label>
                  <Input
                    type="password"
                    placeholder="비밀번호 입력"
                    value={loginPw}
                    onChange={(e) => setLoginPw(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate({ employeeId: loginId, password: loginPw })}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => loginMutation.mutate({ employeeId: loginId, password: loginPw })}
                  disabled={loginMutation.isPending || !loginId || !loginPw}
                >
                  {loginMutation.isPending ? "로그인 중..." : "로그인"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">계정 등록</CardTitle>
                <CardDescription>처음 사용 시 계정을 등록하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>사번 <span className="text-destructive">*</span></Label>
                  <Input placeholder="사번 (로그인 ID)" value={regId} onChange={(e) => setRegId(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>이름 <span className="text-destructive">*</span></Label>
                  <Input placeholder="이름" value={regName} onChange={(e) => setRegName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>비밀번호 <span className="text-destructive">*</span></Label>
                  <Input type="password" placeholder="4자리 이상" value={regPw} onChange={(e) => setRegPw(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>이메일</Label>
                  <Input type="email" placeholder="선택사항" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>관리자 등록키</Label>
                  <Input placeholder="관리자만 해당 (선택사항)" value={regAdminKey} onChange={(e) => setRegAdminKey(e.target.value)} />
                </div>
                <Button
                  className="w-full"
                  onClick={() => registerMutation.mutate({
                    employeeId: regId,
                    password: regPw,
                    name: regName,
                    email: regEmail || undefined,
                    adminKey: regAdminKey || undefined,
                  })}
                  disabled={registerMutation.isPending || !regId || !regPw || !regName}
                >
                  {registerMutation.isPending ? "등록 중..." : "계정 등록"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  최초 등록자는 자동으로 관리자가 됩니다
                </p>
                <div className="border-t pt-3 mt-1">
                  <p className="text-xs text-muted-foreground text-center mb-2">계정이 막혔을 때만 사용</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      if (confirm("모든 계정을 초기화할까요? 기존 데이터는 유지됩니다.")) {
                        resetMutation.mutate({ confirmKey: "reset-hyuntech-users-2024" });
                      }
                    }}
                    disabled={resetMutation.isPending}
                  >
                    {resetMutation.isPending ? "초기화 중..." : "계정 전체 초기화 (비상용)"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
