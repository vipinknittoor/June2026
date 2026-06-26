"use client";

import { Briefcase, Mail, PlusCircle, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useEmployees, useManagers, useCreateEmployee, useTasks } from "@/hooks/useTasks";
import { employeeSchema, type EmployeeFormValues } from "@/schemas/employee.schema";
import { USER_TITLES } from "@/types/user.types";
import type { User } from "@/types/user.types";

export default function EmployeesPage() {
  const employeesQuery = useEmployees();
  const managersQuery = useManagers();
  const createEmployee = useCreateEmployee();
  const tasksQuery = useTasks();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [titleFilter, setTitleFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const employees = employeesQuery.data;
  const managers = managersQuery.data;
  const isLoading = employeesQuery.isLoading || managersQuery.isLoading;
  const isError = employeesQuery.isError || managersQuery.isError;

  const allMembers: User[] = useMemo(() => {
    const mgrs = managers ?? [];
    const emps = employees ?? [];
    return [...mgrs, ...emps];
  }, [managers, employees]);

  const filteredManagers = useMemo(() => {
    const mgrs = managers ?? [];
    return mgrs.filter((m) => {
      const matchesTitle = titleFilter === "ALL" || m.title === titleFilter;
      const matchesSearch = search === "" || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
      return matchesTitle && matchesSearch;
    });
  }, [managers, titleFilter, search]);

  const filteredEmployees = useMemo(() => {
    const emps = employees ?? [];
    return emps.filter((e) => {
      const matchesTitle = titleFilter === "ALL" || e.title === titleFilter;
      const matchesSearch = search === "" || e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
      return matchesTitle && matchesSearch;
    });
  }, [employees, titleFilter, search]);

  // Collect unique titles present in the team
  const activeTitles = useMemo(() => {
    const set = new Set(allMembers.map((m) => m.title).filter(Boolean));
    return Array.from(set) as string[];
  }, [allMembers]);

  // Build employeeId → IN_PROGRESS task count map
  const activeTaskMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const task of tasksQuery.data ?? []) {
      if (task.status === "IN_PROGRESS") {
        for (const assignee of task.assignees) {
          map[assignee.id] = (map[assignee.id] ?? 0) + 1;
        }
      }
    }
    return map;
  }, [tasksQuery.data]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: "EMPLOYEE",
    },
  });

  async function onSubmit(values: EmployeeFormValues) {
    setError("");
    try {
      await createEmployee.mutateAsync(values);
      reset();
      setOpen(false);
    } catch {
      setError("Failed to add team member. Email might already exist.");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Team</h2>
          <p className="text-sm text-slate-600">Manage and assign roles to dashboard users.</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary-hover focus-visible:ring-primary"
          icon={<PlusCircle className="h-4 w-4" />}
          onClick={() => {
            setError("");
            reset();
            setOpen(true);
          }}
          type="button"
        >
          Add Team Member
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            type="text"
            value={search}
          />
        </div>

        {/* Title filter dropdown */}
        <select
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => setTitleFilter(e.target.value)}
          value={titleFilter}
        >
          <option value="ALL">All Titles</option>
          {activeTitles.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : isError ? (
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">Team members could not be loaded.</p>
      ) : (
        <div className="space-y-8">
          {/* Admins & Managers */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-950">Admins &amp; Managers</h3>
            {filteredManagers.length === 0 ? (
              <p className="text-sm text-slate-500">No admins or managers match the current filter.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredManagers.map((manager) => (
                  <MemberCard activeCount={activeTaskMap[manager.id] ?? 0} key={manager.id} user={manager} />
                ))}
              </div>
            )}
          </div>

          {/* Employees */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-950">Employees</h3>
            {filteredEmployees.length === 0 ? (
              <p className="text-sm text-slate-500">No employees match the current filter.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredEmployees.map((employee) => (
                  <MemberCard activeCount={activeTaskMap[employee.id] ?? 0} key={employee.id} user={employee} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      <Modal onClose={() => setOpen(false)} open={open} title="Add Team Member">
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            error={errors.name?.message}
            label="Name"
            type="text"
            {...register("name")}
          />
          <Input
            error={errors.email?.message}
            label="Email"
            type="email"
            {...register("email")}
          />
          <Input
            error={errors.password?.message}
            label="Password"
            type="password"
            {...register("password")}
          />
          <Select
            error={errors.role?.message}
            label="Role"
            {...register("role")}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin / Manager</option>
          </Select>
          <Select
            label="Title (optional)"
            {...register("title")}
          >
            <option value="">— Select a title —</option>
            {USER_TITLES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          <Button isLoading={createEmployee.isPending} type="submit">
            Add Team Member
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function MemberCard({ user, activeCount = 0 }: { user: User; activeCount?: number }) {
  const isActive = activeCount > 0;
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        {/* Dot + name + status badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="relative shrink-0"
            title={isActive ? `Active · ${activeCount} task${activeCount > 1 ? "s" : ""} in progress` : "Available"}
          >
            <span
              className={`block h-3 w-3 rounded-full border-2 border-white shadow ${
                isActive ? "bg-orange-400" : "bg-emerald-400"
              }`}
            />
            <span
              className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                isActive ? "bg-orange-400" : "bg-emerald-400"
              }`}
            />
          </div>
          <div className="min-w-0">
            <h4 className="truncate font-semibold text-slate-950">{user.name}</h4>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs capitalize text-slate-500">{user.role.toLowerCase()}</span>
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
        {user.title ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Briefcase className="h-3 w-3" />
            {user.title}
          </span>
        ) : null}
      </div>
      <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
        <Mail className="h-4 w-4" />
        {user.email}
      </p>
    </Card>
  );
}
