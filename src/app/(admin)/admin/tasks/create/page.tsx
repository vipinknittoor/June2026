"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Save, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  useAutofillTask,
  useCreateTask,
  useEmployees,
  useManagers,
} from "@/hooks/useTasks";
import { taskSchema, type TaskFormValues } from "@/schemas/task.schema";

export default function CreateTaskPage() {
  const router = useRouter();
  const createTask = useCreateTask();
  const autofillTask = useAutofillTask();
  const employees = useEmployees();
  const managers = useManagers();
  const employeeList = employees.data ?? [];
  const [submitMode, setSubmitMode] = useState<"DRAFT" | "ASSIGNED">("ASSIGNED");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  const {
    register,
    getValues,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: "MEDIUM",
      assigneeIds: [],
    },
  });

  function toggleAssignee(id: string) {
    const next = assigneeIds.includes(id)
      ? assigneeIds.filter((a) => a !== id)
      : [...assigneeIds, id];
    setAssigneeIds(next);
    setValue("assigneeIds", next);
  }

  function removeAssignee(id: string) {
    const next = assigneeIds.filter((a) => a !== id);
    setAssigneeIds(next);
    setValue("assigneeIds", next);
  }

  async function onSubmit(values: TaskFormValues) {
    if (submitMode === "ASSIGNED") {
      if (assigneeIds.length === 0) {
        setError("assigneeIds", { message: "Select at least one employee to assign" });
        return;
      }
      if (!values.reviewingManagerId) {
        setError("reviewingManagerId", { message: "Select a reviewing manager to assign" });
        return;
      }
    }

    const task = await createTask.mutateAsync({ ...values, assigneeIds, status: submitMode });
    router.push(`/admin/tasks/${task.id}`);
  }

  async function handleAutofill() {
    const title = getValues("title")?.trim();
    if (!title || title.length < 3) {
      setError("title", { message: "Enter a task title before using AI autofill" });
      return;
    }

    const details = await autofillTask.mutateAsync(title);
    setValue("description", details.description, { shouldValidate: true });
    setValue("goal", details.goal, { shouldValidate: true });
    setValue("acceptanceCriteria", details.acceptanceCriteria, {
      shouldValidate: true,
    });
    setValue("startDate", details.startDate, { shouldValidate: true });
    setValue("endDate", details.endDate, { shouldValidate: true });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-950">Create task</h2>
        <p className="text-sm text-slate-600">Assign goals, reviewers, dates, and acceptance criteria.</p>
      </div>
      <Card>
        <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <Input error={errors.title?.message} label="Title" {...register("title")} />
            <Button
              icon={<Sparkles className="h-4 w-4" />}
              isLoading={autofillTask.isPending}
              onClick={handleAutofill}
              type="button"
              variant="secondary"
            >
              AI autofill
            </Button>
          </div>
          {autofillTask.isError ? (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              AI task details could not be generated.
            </p>
          ) : null}
          <Textarea error={errors.description?.message} label="Description" {...register("description")} />
          <Textarea error={errors.goal?.message} label="Goal" {...register("goal")} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input error={errors.startDate?.message} label="Start date" type="date" {...register("startDate")} />
            <Input error={errors.endDate?.message} label="End date" type="date" {...register("endDate")} />
          </div>
          <Select error={errors.priority?.message} label="Priority" {...register("priority")}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>

          {/* Employees multi-select dropdown */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Employees</label>
              {assigneeIds.length === employeeList.length && employeeList.length > 0 ? (
                <button
                  className="text-xs font-medium text-red-500 hover:underline"
                  onClick={() => { setAssigneeIds([]); setValue("assigneeIds", []); }}
                  type="button"
                >
                  Clear all
                </button>
              ) : (
                <button
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => { const all = employeeList.map((e) => e.id); setAssigneeIds(all); setValue("assigneeIds", all); }}
                  type="button"
                >
                  Assign to all employees
                </button>
              )}
            </div>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => {
                const id = e.target.value;
                if (id) toggleAssignee(id);
                e.target.value = "";
              }}
              value=""
            >
              <option value="">— Select an employee to add —</option>
              {employeeList
                .filter((emp) => !assigneeIds.includes(emp.id))
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}{emp.title ? ` · ${emp.title}` : ""}
                  </option>
                ))}
            </select>

            {/* Selected employee tags */}
            {assigneeIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {assigneeIds.map((id) => {
                  const emp = employeeList.find((e) => e.id === id);
                  return emp ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      key={id}
                    >
                      {emp.name}
                      <button
                        className="rounded-full hover:text-red-500"
                        onClick={() => removeAssignee(id)}
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {errors.assigneeIds?.message ? (
              <p className="mt-1 text-xs text-red-600">{errors.assigneeIds.message}</p>
            ) : null}
          </div>

          <Select
            error={errors.reviewingManagerId?.message}
            label="Reviewing manager"
            {...register("reviewingManagerId")}
          >
            <option value="">Select manager</option>
            {(managers.data ?? []).map((manager) => (
              <option key={manager.id} value={manager.id}>{manager.name}</option>
            ))}
          </Select>
          <Textarea
            error={errors.acceptanceCriteria?.message}
            label="Acceptance criteria"
            {...register("acceptanceCriteria")}
          />
          {createTask.isError ? (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">Task could not be created.</p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full sm:w-fit"
              icon={<Save className="h-4 w-4" />}
              isLoading={createTask.isPending && submitMode === "DRAFT"}
              onClick={() => setSubmitMode("DRAFT")}
              type="submit"
              variant="secondary"
            >
              Save draft
            </Button>
            <Button
              className="w-full sm:w-fit"
              icon={<Send className="h-4 w-4" />}
              isLoading={createTask.isPending && submitMode === "ASSIGNED"}
              onClick={() => setSubmitMode("ASSIGNED")}
              type="submit"
            >
              Assign task
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
