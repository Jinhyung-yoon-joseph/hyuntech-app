import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Printer, Download, Trophy, XCircle, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminExamResults() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const examId = parseInt(params.id);

  const { data, isLoading } = trpc.exams.resultWithDetails.useQuery({ examId }, { enabled: !isNaN(examId) });

  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    if (!data) return;
    const headers = ["이름", "이메일", "점수", "백분율", "합격여부", "응시일시"];
    const rows = data.results.map((r) => [
      r.userName,
      r.userEmail,
      `${r.score}/${r.totalScore}`,
      `${r.percentage}%`,
      r.isPassed ? "합격" : "불합격",
      formatDate(r.submittedAt),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.exam?.title ?? "시험결과"}_${new Date().toLocaleDateString("ko-KR")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const passCount = data?.results.filter((r) => r.isPassed).length ?? 0;
  const avgScore = data?.results.length
    ? Math.round(data.results.reduce((s, r) => s + r.percentage, 0) / data.results.length)
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => navigate("/admin/exams")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">시험 결과</h1>
            <p className="text-sm text-muted-foreground">{data?.exam?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDownloadCSV}>
            <Download className="w-3.5 h-3.5" />
            CSV
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" />
            인쇄
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="print-only">
        <h1 className="text-2xl font-bold">{data?.exam?.title} - 시험 결과</h1>
        <p className="text-sm text-gray-500">출력일: {new Date().toLocaleDateString("ko-KR")}</p>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{data.results.length}</p>
            <p className="text-xs text-muted-foreground">응시자</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Trophy className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald-600">{passCount}</p>
            <p className="text-xs text-muted-foreground">합격 ({data.results.length > 0 ? Math.round((passCount / data.results.length) * 100) : 0}%)</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <TrendingUp className="w-5 h-5 text-violet-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-violet-600">{avgScore}점</p>
            <p className="text-xs text-muted-foreground">평균 점수</p>
          </div>
        </div>
      )}

      {/* Results table */}
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">이름</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">점수</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">백분율</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">결과</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">응시일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : data?.results.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    응시 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                data?.results.map((result) => (
                  <tr key={result.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{result.userName}</p>
                        <p className="text-xs text-muted-foreground">{result.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-foreground font-medium">
                      {result.score}/{result.totalScore}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "font-bold",
                        result.isPassed ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {result.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn(
                        "text-xs border-0",
                        result.isPassed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {result.isPassed ? "합격" : "불합격"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {formatDate(result.submittedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
