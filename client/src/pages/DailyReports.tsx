import { trpc } from "@/lib/trpc";
import { Calendar, Download, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import * as XLSX from "xlsx";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function DailyReportsPage() {
  const { data: reports, isLoading } = trpc.dailyReports.list.useQuery();

  const handleDownloadExcel = () => {
    if (!reports || reports.length === 0) {
      toast.error("다운로드할 작업일보가 없습니다.");
      return;
    }

    const data = reports.map((r) => ({
      날짜: formatDate(r.reportDate),
      제목: r.title,
      내용: r.content || "-",
      등록일: formatDate(r.createdAt),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "작업일보");

    // 열 너비 설정
    ws["!cols"] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 40 },
      { wch: 15 },
    ];

    XLSX.writeFile(wb, `작업일보_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Excel 파일이 다운로드되었습니다.");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">작업일보</h1>
          <p className="text-sm text-muted-foreground mt-0.5">일일 작업 현황을 확인하세요.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleDownloadExcel} disabled={isLoading || !reports?.length}>
          <Download className="w-4 h-4" />
          Excel 다운로드
        </Button>
      </div>

      {/* Reports grid */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : reports?.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <AlertCircle className="w-8 h-8 opacity-30" />
              <p className="text-sm">작업일보가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          reports?.map((report) => (
            <Card key={report.id} className="border-border overflow-hidden hover:shadow-md transition">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate">{report.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{formatDate(report.reportDate)}</p>
                    </div>
                  </div>
                </div>

                {report.content && (
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">{report.content}</p>
                )}

                {report.photoUrl && (
                  <div className="relative rounded-xl overflow-hidden bg-muted max-h-64">
                    <img
                      src={report.photoUrl}
                      alt={report.title}
                      className="w-full h-auto object-cover max-h-64"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
