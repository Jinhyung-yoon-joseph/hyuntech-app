import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Trophy, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function MyResultsPage() {
  const { data: results, isLoading } = trpc.exams.myResults.useQuery();
  const { data: exams } = trpc.exams.list.useQuery();

  const examMap = new Map(exams?.map((e) => [e.id, e]) ?? []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">내 시험 결과</h1>
        <p className="text-sm text-muted-foreground mt-0.5">응시한 시험의 결과를 확인하세요.</p>
      </div>

      {/* Summary */}
      {results && results.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{results.length}</p>
            <p className="text-xs text-muted-foreground mt-1">총 응시</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{results.filter((r) => r.isPassed).length}</p>
            <p className="text-xs text-muted-foreground mt-1">합격</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0}점
            </p>
            <p className="text-xs text-muted-foreground mt-1">평균 점수</p>
          </div>
        </div>
      )}

      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="w-16 h-8 rounded-lg" />
              </div>
            ))
          ) : results?.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <AlertCircle className="w-10 h-10 opacity-30" />
              <p className="text-sm">응시한 시험이 없습니다.</p>
            </div>
          ) : (
            results?.map((result) => {
              const exam = examMap.get(result.examId);
              return (
                <div key={result.id} className="flex items-center gap-3 p-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    result.isPassed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {result.isPassed ? <Trophy className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {exam?.title ?? `시험 #${result.examId}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatDate(result.submittedAt)}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{result.score}/{result.totalScore}점</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      "text-lg font-bold",
                      result.isPassed ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {result.percentage}점
                    </span>
                    <Badge className={cn(
                      "text-[10px] px-1.5 py-0 border-0",
                      result.isPassed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {result.isPassed ? "합격" : "불합격"}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
