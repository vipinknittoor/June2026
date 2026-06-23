import Link from "next/link";
import { CalendarDays, Flag } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { formatDate, isOverdue } from "@/lib/utils";
import type { Task } from "@/types/task.types";

export function TaskCard({ task, href }: { task: Task; href: string }) {
  const overdue = isOverdue(task.endDate) && task.status !== "APPROVED";

  return (
    <Link href={href}>
      <Card className="transition hover:border-primary hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-950">{task.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{task.goal}</p>
          </div>
          <TaskStatusBadge status={task.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {formatDate(task.endDate)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Flag className="h-4 w-4" />
            {task.priority}
          </span>
          {overdue ? <span className="text-red-600">Overdue</span> : null}
        </div>
      </Card>
    </Link>
  );
}
