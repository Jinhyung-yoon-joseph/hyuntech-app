import { trpc } from "@/lib/trpc";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

type Sig = { id: number; userId: number; documentTitle: string; documentContent?: string | null; signatureData: string; signedAt: Date; createdAt: Date };

export default function AdminSignatures() {
  const { data: signatures, isLoading } = trpc.signatures.allList.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  const [viewSig, setViewSig] = useState<Sig | null>(null);

  const userMap = new Map(users?.map((u) => [u.id, u]) ?? []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">서명 관리</h1>
        <p className="text-sm text-muted-foreground mt-0.5">직원들의 전자서명 내역을 조회하세요.</p>
      </div>

      {signatures && (
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{signatures.length}</p>
          <p className="text-xs text-muted-foreground mt-1">총 서명 건수</p>
        </div>
      )}

      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
              </div>
            ))
          ) : signatures?.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <AlertCircle className="w-10 h-10 opacity-30" />
              <p className="text-sm">서명 내역이 없습니다.</p>
            </div>
          ) : (
            signatures?.map((sig) => {
              const user = userMap.get(sig.userId);
              return (
                <div key={sig.id} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sig.documentTitle}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{user?.name ?? `직원 #${sig.userId}`}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{formatDate(sig.signedAt)}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs shrink-0" onClick={() => setViewSig(sig as Sig)}>
                    서명 보기
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Signature view dialog */}
      <Dialog open={!!viewSig} onOpenChange={(o) => !o && setViewSig(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{viewSig?.documentTitle}</DialogTitle>
          </DialogHeader>
          {viewSig && (
            <div className="space-y-4">
              {viewSig.documentContent && (
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 leading-relaxed">
                  {viewSig.documentContent}
                </p>
              )}
              <div className="border rounded-xl overflow-hidden bg-white">
                <img src={viewSig.signatureData} alt="서명" className="w-full" />
              </div>
              <p className="text-xs text-center text-muted-foreground">서명일시: {formatDate(viewSig.signedAt)}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
