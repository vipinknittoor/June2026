"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { TaskCard } from "@/components/tasks/TaskCard";
import { useMyTasks } from "@/hooks/useTasks";
import type { TaskStatus } from "@/types/task.types";

const groups: TaskStatus[] = ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "REOPENED", "APPROVED"];

const STATUS_LABELS: Record<TaskStatus, string> = {
  DRAFT: "Draft",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "Accepted",
  SUBMITTED: "Submitted for Review",
  REOPENED: "Reopened",
  APPROVED: "Approved",
  DENIED: "Denied",
};

export default function EmployeeDashboardPage() {
  const { data = [], isLoading, isError } = useMyTasks();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-950">My dashboard</h2>
        <p className="text-sm text-slate-600">Track assigned, active, and submitted work.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : isError ? (
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">Tasks could not be loaded.</p>
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((status) => {
            const tasks = data.filter((task) => task.status === status);
            return (
              <Card key={status}>
                <h3 className="mb-4 font-semibold text-slate-950">{STATUS_LABELS[status]}</h3>
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <p className="text-sm text-slate-500">No tasks in this group.</p>
                  ) : (
                    tasks.map((task) => (
                      <TaskCard href={`/employee/tasks/${task.id}`} key={task.id} task={task} />
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
