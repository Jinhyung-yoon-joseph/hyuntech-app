import { trpc } from "@/lib/trpc";
import { useRef, useEffect, useState, useCallback } from "react";
import { PenLine, Trash2, CheckCircle, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function SignaturePage() {
  const utils = trpc.useUtils();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [docTitle, setDocTitle] = useState("입사 서약서");
  const [docContent, setDocContent] = useState("본인은 현테크의 취업규칙 및 제반 규정을 준수하고 성실히 근무할 것을 서약합니다.");
  const [submitted, setSubmitted] = useState(false);

  const { data: mySignatures, isLoading } = trpc.signatures.myList.useQuery();

  const submitMutation = trpc.signatures.submit.useMutation({
    onSuccess: () => {
      toast.success("서명이 제출되었습니다.");
      utils.signatures.myList.invalidate();
      setSubmitted(true);
      clearCanvas();
    },
    onError: () => toast.error("서명 제출에 실패했습니다."),
  });

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      toast.error("서명을 먼저 작성해주세요.");
      return;
    }
    if (!docTitle.trim()) {
      toast.error("문서 제목을 입력해주세요.");
      return;
    }
    const signatureData = canvas.toDataURL("image/png");
    submitMutation.mutate({ documentTitle: docTitle, documentContent: docContent, signatureData });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">전자서명</h1>
        <p className="text-sm text-muted-foreground mt-0.5">문서에 서명하고 제출하세요.</p>
      </div>

      {/* Signature form */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4 text-primary" />
            서명 작성
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>문서 제목</Label>
            <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="서명할 문서 제목" />
          </div>
          <div className="space-y-1.5">
            <Label>문서 내용 (선택)</Label>
            <Textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="서명할 문서 내용"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>서명란</Label>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={clearCanvas}>
                <RotateCcw className="w-3.5 h-3.5" />
                지우기
              </Button>
            </div>
            <div className="relative rounded-xl border-2 border-dashed border-border bg-muted/20 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="signature-canvas w-full h-[160px] block"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-sm text-muted-foreground/60">이 곳에 서명하세요</p>
                </div>
              )}
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !hasSignature}
          >
            <CheckCircle className="w-4 h-4" />
            {submitMutation.isPending ? "제출 중..." : "서명 제출"}
          </Button>
        </CardContent>
      </Card>

      {/* My signatures */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">내 서명 내역</h2>
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0 divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))
            ) : mySignatures?.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <AlertCircle className="w-8 h-8 opacity-30" />
                <p className="text-sm">서명 내역이 없습니다.</p>
              </div>
            ) : (
              mySignatures?.map((sig) => (
                <div key={sig.id} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sig.documentTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(sig.signedAt)}</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-0 text-xs shrink-0">완료</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
