"use client";

import Link from "next/link";
import { Briefcase, ClipboardList, Clock, Mail, PlusCircle, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { useTasks, useEmployees, useManagers } from "@/hooks/useTasks";
import { formatDate, isOverdue } from "@/lib/utils";
import type { User } from "@/types/user.types";

export default function AdminDashboardPage() {
  const { data = [], isLoading, isError } = useTasks();
  const employeesQuery = useEmployees();
  const managersQuery = useManagers();

  const inProgress = data.filter((task) => task.status === "IN_PROGRESS").length;
  const submitted = data.filter((task) => task.status === "SUBMITTED").length;
  const overdue = data.filter((task) => isOverdue(task.endDate) && task.status !== "APPROVED").length;

  const employees = employeesQuery.data;
  const managers = managersQuery.data;
  const allMembers: User[] = useMemo(() => {
    const mgrs = managers ?? [];
    const emps = employees ?? [];
    return [...mgrs, ...emps];
  }, [managers, employees]);

  const [titleFilter, setTitleFilter] = useState<string>("ALL");

  const activeTitles = useMemo(() => {
    const set = new Set(allMembers.map((m) => m.title).filter(Boolean));
    return Array.from(set) as string[];
  }, [allMembers]);

  const filteredMembers = useMemo(
    () => (titleFilter === "ALL" ? allMembers : allMembers.filter((m) => m.title === titleFilter)),
    [allMembers, titleFilter],
  );

  // Build a map of employeeId → number of IN_PROGRESS tasks
  const activeTasks = useMemo(() => {
    const map: Record<string, number> = {};
    for (const task of data) {
      if (task.status === "IN_PROGRESS") {
        for (const assignee of task.assignees) {
          map[assignee.id] = (map[assignee.id] ?? 0) + 1;
        }
      }
    }
    return map;
  }, [data]);

  const teamLoading = employeesQuery.isLoading || managersQuery.isLoading;

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 12 }}>
      {/* Header */}
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

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={<ClipboardList />} label="Total tasks" value={data.length} />
        <SummaryCard icon={<Clock />} label="In progress" value={inProgress} />
        <SummaryCard icon={<Send />} label="Submitted" value={submitted} />
        <SummaryCard icon={<Clock />} label="Overdue" value={overdue} tone="text-red-600" />
      </div>

      {/* Recent tasks table */}
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
                    <td className="px-5 py-4">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="px-5 py-4">{task.priority}</td>
                    <td className="px-5 py-4">{formatDate(task.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Team section */}
      <div className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Team</h3>
            <p className="text-sm text-slate-500">Filter members by title.</p>
          </div>
          <Link className="text-sm font-medium text-primary hover:underline" href="/admin/employees">
            Manage team →
          </Link>
        </div>

        {/* Title filter dropdown */}
        <select
          className="mb-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => setTitleFilter(e.target.value)}
          value={titleFilter}
        >
          <option value="ALL">All Titles</option>
          {activeTitles.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {teamLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <p className="text-sm text-slate-500">No team members match the selected title.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => {
              const activeCount = activeTasks[member.id] ?? 0;
              const isActive = activeCount > 0;
              return (
                <Card key={member.id}>
                  <div className="flex items-start justify-between gap-2">
                    {/* Name + role + status dot */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Status dot */}
                      <div className="relative shrink-0" title={isActive ? `Active · ${activeCount} task${activeCount > 1 ? "s" : ""} in progress` : "Available"}>
                        <span
                          className={`block h-3 w-3 rounded-full border-2 border-white shadow ${
                            isActive ? "bg-orange-400" : "bg-emerald-400"
                          }`}
                        />
                        {/* Ping animation ring */}
                        <span
                          className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                            isActive ? "bg-orange-400" : "bg-emerald-400"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate font-semibold text-slate-950">{member.name}</h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs capitalize text-slate-500">{member.role.toLowerCase()}</span>
                          {isActive ? (
                            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                              {activeCount} active
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Title badge */}
                    {member.title ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <Briefcase className="h-3 w-3" />
                        {member.title}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
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
