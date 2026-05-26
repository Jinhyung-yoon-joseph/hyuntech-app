import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExamTakePage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const examId = parseInt(params.id);

  const { data: exam } = trpc.exams.byId.useQuery({ id: examId }, { enabled: !isNaN(examId) });
  const { data: questions, isLoading } = trpc.exams.questions.useQuery({ examId }, { enabled: !isNaN(examId) });

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; totalScore: number; percentage: number; isPassed: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const startedAt = useRef(Date.now());

  const submitMutation = trpc.exams.submit.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setSubmitted(true);
    },
    onError: (err) => {
      if (err.data?.code === "CONFLICT") {
        toast.error("이미 응시한 시험입니다.");
        navigate("/exams");
      } else {
        toast.error("제출에 실패했습니다.");
      }
    },
  });

  useEffect(() => {
    if (exam?.timeLimit) {
      setTimeLeft(exam.timeLimit * 60);
    }
  }, [exam]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null || t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleSubmit = () => {
    if (!questions) return;
    const answerList = questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] ?? -1,
    }));
    submitMutation.mutate({ examId, answers: answerList, startedAt: startedAt.current });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (submitted && result) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 space-y-6">
        <div className={cn(
          "rounded-2xl p-8 text-center",
          result.isPassed ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"
        )}>
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
            result.isPassed ? "bg-emerald-100" : "bg-rose-100"
          )}>
            {result.isPassed
              ? <CheckCircle className="w-8 h-8 text-emerald-600" />
              : <AlertCircle className="w-8 h-8 text-rose-600" />}
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: result.isPassed ? "#059669" : "#e11d48" }}>
            {result.isPassed ? "합격" : "불합격"}
          </h2>
          <p className="text-4xl font-bold text-foreground my-3">{result.percentage}점</p>
          <p className="text-sm text-muted-foreground">
            {result.score} / {result.totalScore} 점 획득
          </p>
        </div>
        <Button className="w-full" onClick={() => navigate("/exams")}>시험 목록으로</Button>
        <Button variant="outline" className="w-full" onClick={() => navigate("/my-results")}>내 결과 보기</Button>
      </div>
    );
  }

  if (isLoading || !questions || !exam) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
        <p className="text-muted-foreground">등록된 문제가 없습니다.</p>
        <Button variant="outline" onClick={() => navigate("/exams")}>돌아가기</Button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">{exam.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentIdx + 1} / {questions.length} 문제 · {answeredCount}개 답변
          </p>
        </div>
        {timeLeft !== null && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold",
            timeLeft < 60 ? "bg-rose-50 text-rose-600" : "bg-primary/10 text-primary"
          )}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <Progress value={progress} className="h-2" />

      {/* Question card */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">문제 {currentIdx + 1}</span>
          <p className="text-base font-medium text-foreground mt-2 leading-relaxed">{currentQ.questionText}</p>
        </div>

        <div className="space-y-2.5">
          {(currentQ.options as string[]).map((option, idx) => {
            const isSelected = answers[currentQ.id] === idx;
            return (
              <button
                key={idx}
                onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: idx }))}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted/30 text-foreground"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold",
                  isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                )}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-sm">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          <ChevronLeft className="w-4 h-4" />
          이전
        </Button>
        {currentIdx < questions.length - 1 ? (
          <Button
            className="flex-1 gap-2"
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
          >
            <CheckCircle className="w-4 h-4" />
            {submitMutation.isPending ? "제출 중..." : "제출하기"}
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentIdx(idx)}
            className={cn(
              "w-7 h-7 rounded-full text-xs font-medium transition-all",
              idx === currentIdx
                ? "bg-primary text-primary-foreground"
                : answers[q.id] !== undefined
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
