import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function NotificationsPage() {
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery();
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      toast.success("알림을 읽음 처리했습니다.");
    },
  });
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      toast.success("모든 알림을 읽음 처리했습니다.");
    },
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "notice":
        return "bg-blue-100 text-blue-700";
      case "exam":
        return "bg-purple-100 text-purple-700";
      case "system":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "notice":
        return "공지";
      case "exam":
        return "시험";
      case "system":
        return "시스템";
      default:
        return "알림";
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">알림</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : "모든 알림을 읽었습니다."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" className="gap-2" onClick={() => markAllAsReadMutation.mutate()}>
            <CheckCheck className="w-4 h-4" />
            모두 읽음
          </Button>
        )}
      </div>

      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-4 transition ${!notif.isRead ? "bg-muted/50" : ""}`}
              >
                <div className="mt-1">
                  <Bell className={`w-5 h-5 ${!notif.isRead ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{notif.title}</h3>
                    <Badge className={`text-xs ${getTypeColor(notif.type)}`}>{getTypeLabel(notif.type)}</Badge>
                  </div>
                  {notif.content && <p className="text-sm text-muted-foreground line-clamp-2">{notif.content}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!notif.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsReadMutation.mutate({ id: notif.id })}
                      disabled={markAsReadMutation.isPending}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">알림이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
