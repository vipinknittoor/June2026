"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useMarkNotificationRead, useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";

export function NotificationDrawer() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data = [] } = useNotifications();
  const { role } = useAuth();
  const markRead = useMarkNotificationRead();
  const unreadCount = data.filter((item) => !item.read).length;

  return (
    <div className="relative">
      <Button
        aria-label="Notifications"
        className="relative h-10 w-10 px-0"
        icon={<Bell className="h-5 w-5" />}
        onClick={() => setOpen((value) => !value)}
        type="button"
        variant="secondary"
      />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 rounded-full bg-teal-500 px-1.5 text-xs font-bold text-white">
          {unreadCount}
        </span>
      ) : null}
      {open ? (
        <Card className="absolute right-0 top-12 z-40 w-80 p-0">
          <div className="border-b border-slate-200 p-4">
            <h2 className="font-semibold text-slate-950">Notifications</h2>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {data.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">No notifications.</p>
            ) : (
              data.map((notification) => (
                <button
                  className="w-full rounded-md p-3 text-left text-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  key={notification.id}
                  onClick={() => {
                    markRead.mutate(notification.id);
                    setOpen(false);
                    router.push(
                      role === "EMPLOYEE"
                        ? `/employee/tasks/${notification.taskId}`
                        : `/admin/tasks/${notification.taskId}`,
                    );
                  }}
                  type="button"
                >
                  <span className="font-medium text-slate-900">{notification.message}</span>
                  {!notification.read ? (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-teal-500" />
                  ) : null}
                </button>
              ))
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
