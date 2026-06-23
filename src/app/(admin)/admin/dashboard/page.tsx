"use client";

import Link from "next/link";
import { ClipboardList, Clock, PlusCircle, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { useTasks } from "@/hooks/useTasks";
import { formatDate, isOverdue } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data = [], isLoading, isError } = useTasks();
  const inProgress = data.filter((task) => task.status === "IN_PROGRESS").length;
  const submitted = data.filter((task) => task.status === "SUBMITTED").length;
  const overdue = data.filter((task) => isOverdue(task.endDate) && task.status !== "APPROVED").length;

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 12 }}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Dashboard</h2>
          <p className="text-sm text-slate-600">Review active work and assignment health.</p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          href="/admin/tasks/create"
        >
          <PlusCircle className="h-4 w-4" />
          Create task
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={<ClipboardList />} label="Total tasks" value={data.length} />
        <SummaryCard icon={<Clock />} label="In progress" value={inProgress} />
        <SummaryCard icon={<Send />} label="Submitted" value={submitted} />
        <SummaryCard icon={<Clock />} label="Overdue" value={overdue} tone="text-red-600" />
      </div>
      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-slate-200 p-5">
          <h3 className="font-semibold text-slate-950">Recent tasks</h3>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : isError ? (
          <p className="p-5 text-sm text-red-600">Tasks could not be loaded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Task</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.slice(0, 8).map((task) => (
                  <tr className="hover:bg-slate-50" key={task.id}>
                    <td className="px-5 py-4">
                      <Link className="font-semibold text-primary" href={`/admin/tasks/${task.id}`}>
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4"><TaskStatusBadge status={task.status} /></td>
                    <td className="px-5 py-4">{task.priority}</td>
                    <td className="px-5 py-4">{formatDate(task.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone = "text-primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <Card>
      <div className={tone}>{icon}</div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
    </Card>
  );
}
