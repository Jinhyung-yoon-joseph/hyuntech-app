import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, Save, GripVertical, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Question = {
  questionText: string;
  options: string[];
  correctAnswer: number;
  points: number;
  orderIndex: number;
};

const emptyQuestion = (): Question => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  points: 1,
  orderIndex: 0,
});

export default function AdminExamEdit() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const examId = parseInt(params.id);

  const { data: exam } = trpc.exams.byId.useQuery({ id: examId }, { enabled: !isNaN(examId) });
  const { data: existingQs, isLoading } = trpc.exams.questions.useQuery({ examId }, { enabled: !isNaN(examId) });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize from existing questions
  if (existingQs && !initialized) {
    setQuestions(existingQs.map((q, i) => ({
      questionText: q.questionText,
      options: q.options as string[],
      correctAnswer: (q as any).correctAnswer ?? 0,
      points: q.points,
      orderIndex: i,
    })));
    setInitialized(true);
  }

  const saveMutation = trpc.exams.replaceQuestions.useMutation({
    onSuccess: () => {
      toast.success("문제가 저장되었습니다.");
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { ...emptyQuestion(), orderIndex: prev.length }]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, orderIndex: i })));
  };

  const updateQuestion = (idx: number, field: keyof Question, value: unknown) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[optIdx] = value;
      return { ...q, options: opts };
    }));
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx || q.options.length >= 5) return q;
      return { ...q, options: [...q.options, ""] };
    }));
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx || q.options.length <= 2) return q;
      const opts = q.options.filter((_, oi) => oi !== optIdx);
      const correct = q.correctAnswer >= opts.length ? opts.length - 1 : q.correctAnswer;
      return { ...q, options: opts, correctAnswer: correct };
    }));
  };

  const handleSave = () => {
    for (const q of questions) {
      if (!q.questionText.trim()) { toast.error("모든 문제의 질문을 입력해주세요."); return; }
      if (q.options.some((o) => !o.trim())) { toast.error("모든 보기를 입력해주세요."); return; }
    }
    saveMutation.mutate({
      examId,
      questions: questions.map((q, i) => ({ ...q, orderIndex: i })),
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => navigate("/admin/exams")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{exam?.title ?? "시험 편집"}</h1>
            <p className="text-sm text-muted-foreground">문제 {questions.length}개</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "저장 중..." : "저장"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qIdx) => (
            <Card key={qIdx} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-primary">문제 {qIdx + 1}</CardTitle>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive"
                    onClick={() => removeQuestion(qIdx)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">문제 내용</Label>
                  <Textarea
                    placeholder="문제를 입력하세요"
                    rows={2}
                    value={q.questionText}
                    onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">보기 (정답을 선택하세요)</Label>
                    {q.options.length < 5 && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => addOption(qIdx)}>
                        <Plus className="w-3 h-3" />
                        보기 추가
                      </Button>
                    )}
                  </div>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuestion(qIdx, "correctAnswer", optIdx)}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-all",
                          q.correctAnswer === optIdx
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-border text-muted-foreground hover:border-emerald-400"
                        )}
                      >
                        {q.correctAnswer === optIdx ? <CheckCircle className="w-4 h-4" /> : String.fromCharCode(65 + optIdx)}
                      </button>
                      <Input
                        placeholder={`보기 ${String.fromCharCode(65 + optIdx)}`}
                        value={opt}
                        onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                        className="flex-1"
                      />
                      {q.options.length > 2 && (
                        <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0"
                          onClick={() => removeOption(qIdx, optIdx)}>
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    ✓ 표시된 항목이 정답입니다. 클릭하여 정답을 변경하세요.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">배점</Label>
                  <Input
                    type="number"
                    min={1}
                    className="w-24"
                    value={q.points}
                    onChange={(e) => updateQuestion(qIdx, "points", parseInt(e.target.value) || 1)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full gap-2 border-dashed" onClick={addQuestion}>
            <Plus className="w-4 h-4" />
            문제 추가
          </Button>
        </div>
      )}
    </div>
  );
}
