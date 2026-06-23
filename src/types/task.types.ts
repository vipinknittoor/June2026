import type { User } from "./user.types";

export type TaskStatus =
  | "DRAFT"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "DENIED"
  | "SUBMITTED"
  | "APPROVED"
  | "REOPENED";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: string;
  title: string;
  description: string;
  goal: string;
  startDate: string;
  endDate: string;
  actualCompletionDate?: string;
  assignedBy: User;
  reviewingManager: User;
  assignees: User[];
  effortHours?: number;
  priority: Priority;
  status: TaskStatus;
  acceptanceCriteria: string;
  denialReason?: string;
  createdAt: string;
  comments: Comment[];
  attachments: Attachment[];
  auditLogs: AuditLog[];
  effortLogs: EffortLog[];
}

export interface Comment {
  id: string;
  taskId: string;
  author: User;
  type: "REOPEN_COMMENT" | "REVIEW_NOTE" | "GENERAL";
  text: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileUrl: string;
  uploadedBy: User;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  taskId: string;
  actor: User;
  action: string;
  createdAt: string;
}

export interface EffortLog {
  id: string;
  taskId: string;
  actor: User;
  hours: number;
  note: string;
  createdAt: string;
}
