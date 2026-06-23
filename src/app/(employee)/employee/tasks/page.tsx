"use client";

import { TaskCard } from "@/components/tasks/TaskCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMyTasks } from "@/hooks/useTasks";

export default function EmployeeTasksPage() {
  const { data = [], isLoading, isError } = useMyTasks();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-950">My tasks</h2>
        <p className="text-sm text-slate-600">Assigned work and submissions.</p>
      </div>
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : isError ? (
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">Tasks could not be loaded.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((task) => (
            <TaskCard href={`/employee/tasks/${task.id}`} key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
