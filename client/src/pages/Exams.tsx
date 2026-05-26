import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ClipboardList, ChevronRight, Clock, CheckCircle, AlertCircle, Trophy } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function ExamsPage() {
  const { data: exams, isLoading } = trpc.exams.list.useQuery();
  const { data: myResults } = trpc.exams.myResults.useQuery();

  const attemptedExamIds = new Set(myResults?.map((r) => r.examId) ?? []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">시험 응시</h1>
        <p className="text-sm text-muted-foreground mt-0.5">입사 시험 및 교육 평가에 응시하세요.</p>
      </div>

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
                <Skeleton className="w-20 h-8 rounded-lg" />
              </div>
            ))
          ) : exams?.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <AlertCircle className="w-10 h-10 opacity-30" />
              <p className="text-sm">등록된 시험이 없습니다.</p>
            </div>
          ) : (
            exams?.map((exam) => {
              const attempted = attemptedExamIds.has(exam.id);
              const result = myResults?.find((r) => r.examId === exam.id);
              return (
                <div key={exam.id} className="flex items-center gap-3 p-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    attempted
                      ? result?.isPassed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      : "bg-blue-50 text-blue-600"
                  )}>
                    {attempted
                      ? result?.isPassed ? <Trophy className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />
                      : <ClipboardList className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{exam.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {exam.timeLimit && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exam.timeLimit}분
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">합격 {exam.passingScore}점</span>
                      {attempted && result && (
                        <Badge className={cn(
                          "text-[10px] px-1.5 py-0 border-0",
                          result.isPassed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {result.percentage}점 · {result.isPassed ? "합격" : "불합격"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {attempted ? (
                    <Badge variant="secondary" className="shrink-0 text-xs">응시완료</Badge>
                  ) : (
                    <Link href={`/exams/${exam.id}/take`}>
                      <div className="flex items-center gap-1 text-xs font-medium text-primary cursor-pointer hover:underline shrink-0">
                        응시하기
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>
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
