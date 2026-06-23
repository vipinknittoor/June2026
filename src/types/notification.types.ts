export type NotificationEvent =
  | "TASK_ASSIGNED"
  | "TASK_DENIED"
  | "TASK_OVERDUE_REMINDER"
  | "TASK_OVERDUE_FLAG"
  | "TASK_SUBMITTED"
  | "TASK_APPROVED"
  | "TASK_REOPENED";

export interface Notification {
  id: string;
  event: NotificationEvent;
  message: string;
  taskId: string;
  read: boolean;
  createdAt: string;
}
