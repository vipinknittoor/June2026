import { Badge } from "@/components/ui/Badge";
import type { TaskStatus } from "@/types/task.types";

const labels: Record<TaskStatus, string> = {
  DRAFT: "Draft",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "Accepted / In Progress",
  DENIED: "Denied",
  SUBMITTED: "Submitted for Review",
  APPROVED: "Approved / Closed",
  REOPENED: "Reopened",
};

const tones: Record<TaskStatus, "blue" | "teal" | "amber" | "green" | "red" | "slate"> = {
  DRAFT: "slate",
  ASSIGNED: "blue",
  IN_PROGRESS: "teal",
  DENIED: "red",
  SUBMITTED: "amber",
  APPROVED: "green",
  REOPENED: "amber",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}
