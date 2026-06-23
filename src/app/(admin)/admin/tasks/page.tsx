"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { TaskCard } from "@/components/tasks/TaskCard";
import { useEmployees, useTasks } from "@/hooks/useTasks";
import type { Priority, TaskStatus } from "@/types/task.types";

const statusOptions: Array<TaskStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "ASSIGNED",
  "IN_PROGRESS",
  "DENIED",
  "SUBMITTED",
  "APPROVED",
  "REOPENED",
];

const priorityOptions: Array<Priority | "ALL"> = ["ALL", "LOW", "MEDIUM", "HIGH"];

export default function AdminTasksPage() {
  const [status, setStatus] = useState<TaskStatus | "ALL">("ALL");
  const [priority, setPriority] = useState<Priority | "ALL">("ALL");
  const [employeeId, setEmployeeId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data = [], isLoading, isError } = useTasks({
    status,
    priority,
    employeeId,
    dateFrom,
    dateTo,
  });
  const employees = useEmployees();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Tasks</h2>
          <p className="text-sm text-slate-600">Filter and review assigned work.</p>
        </div>
        <Link href="/admin/tasks/create">
          <Button icon={<PlusCircle className="h-4 w-4" />}>Create task</Button>
        </Link>
      </div>
      <Card className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Select
          label="Status"
          name="status"
          onChange={(event) => setStatus(event.target.value as TaskStatus | "ALL")}
          value={status}
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option === "ALL" ? "All statuses" : option.replace("_", " ")}
            </option>
          ))}
        </Select>
        <Select
          label="Priority"
          name="priority"
          onChange={(event) => setPriority(event.target.value as Priority | "ALL")}
          value={priority}
        >
          {priorityOptions.map((option) => (
            <option key={option} value={option}>
              {option === "ALL" ? "All priorities" : option}
            </option>
          ))}
        </Select>
        <Select
          label="Employee"
          name="employee"
          onChange={(event) => setEmployeeId(event.target.value)}
          value={employeeId}
        >
          <option value="">All employees</option>
          {(employees.data ?? []).map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </Select>
        <Input
          label="Due from"
          name="dateFrom"
          onChange={(event) => setDateFrom(event.target.value)}
          type="date"
          value={dateFrom}
        />
        <Input
          label="Due to"
          name="dateTo"
          onChange={(event) => setDateTo(event.target.value)}
          type="date"
          value={dateTo}
        />
      </Card>
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
            <TaskCard href={`/admin/tasks/${task.id}`} key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
