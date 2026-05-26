import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import AppLayout from "./components/AppLayout";
// Pages
import Home from "./pages/Home";
import NoticesPage from "./pages/Notices";
import NoticeDetailPage from "./pages/NoticeDetail";
import FilesPage from "./pages/Files";
import QnaPage from "./pages/Qna";
import QnaDetailPage from "./pages/QnaDetail";
import SignaturePage from "./pages/Signature";
import ExamsPage from "./pages/Exams";
import ExamTakePage from "./pages/ExamTake";
import MyResultsPage from "./pages/MyResults";
import DailyReportsPage from "./pages/DailyReports";
import NotificationsPage from "./pages/Notifications";
import LoginPage from "./pages/Login";
// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminNotices from "./pages/admin/Notices";
import AdminFiles from "./pages/admin/Files";
import AdminQna from "./pages/admin/Qna";
import AdminSignatures from "./pages/admin/Signatures";
import AdminExams from "./pages/admin/Exams";
import AdminExamEdit from "./pages/admin/ExamEdit";
import AdminExamResults from "./pages/admin/ExamResults";
import AdminUsers from "./pages/admin/Users";
import AdminDailyReports from "./pages/admin/DailyReports";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={Home} />
      <Route path="/notices" component={NoticesPage} />
      <Route path="/notices/:id" component={NoticeDetailPage} />
      <Route path="/files" component={FilesPage} />
      <Route path="/qna" component={QnaPage} />
      <Route path="/qna/:id" component={QnaDetailPage} />
      <Route path="/signature" component={SignaturePage} />
      <Route path="/exams" component={ExamsPage} />
      <Route path="/exams/:id/take" component={ExamTakePage} />
      <Route path="/my-results" component={MyResultsPage} />
      <Route path="/daily-reports" component={DailyReportsPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/notices" component={AdminNotices} />
      <Route path="/admin/files" component={AdminFiles} />
      <Route path="/admin/qna" component={AdminQna} />
      <Route path="/admin/signatures" component={AdminSignatures} />
      <Route path="/admin/exams" component={AdminExams} />
      <Route path="/admin/exams/:id/edit" component={AdminExamEdit} />
      <Route path="/admin/exams/:id/results" component={AdminExamResults} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/daily-reports" component={AdminDailyReports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route>
        <AuthGuard>
          <AppLayout>
            <Router />
          </AppLayout>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
