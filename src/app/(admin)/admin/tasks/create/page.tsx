"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useCreateTask, useEmployees, useManagers } from "@/hooks/useTasks";
import { taskSchema, type TaskFormValues } from "@/schemas/task.schema";

export default function CreateTaskPage() {
  const router = useRouter();
  const createTask = useCreateTask();
  const employees = useEmployees();
  const managers = useManagers();
  const employeeList = employees.data ?? [];
  const [submitMode, setSubmitMode] = useState<"DRAFT" | "ASSIGNED">("ASSIGNED");
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: "MEDIUM",
      assigneeIds: [],
    },
  });

  async function onSubmit(values: TaskFormValues) {
    if (submitMode === "ASSIGNED") {
      if (values.assigneeIds.length === 0) {
        setError("assigneeIds", { message: "Select at least one employee to assign" });
        return;
      }

      if (!values.reviewingManagerId) {
        setError("reviewingManagerId", { message: "Select a reviewing manager to assign" });
        return;
      }
    }

    const task = await createTask.mutateAsync({ ...values, status: submitMode });
    router.push(`/admin/tasks/${task.id}`);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-950">Create task</h2>
        <p className="text-sm text-slate-600">Assign goals, reviewers, dates, and acceptance criteria.</p>
      </div>
      <Card>
        <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
          <Input error={errors.title?.message} label="Title" {...register("title")} />
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
          <Controller
            control={control}
            name="assigneeIds"
            render={({ field }) => (
              <fieldset>
                <legend className="text-sm font-medium text-slate-700">Employees</legend>
                <label className="mt-2 flex items-center gap-2 rounded-md border border-primary/30 bg-blue-50 p-3 text-sm font-semibold text-primary">
                  <input
                    checked={
                      employeeList.length > 0 && field.value.length === employeeList.length
                    }
                    className="h-4 w-4 accent-primary"
                    onChange={(event) => {
                      field.onChange(
                        event.target.checked ? employeeList.map((employee) => employee.id) : [],
                      );
                    }}
                    type="checkbox"
                  />
                  Assign to every employee
                </label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {employeeList.map((employee) => (
                    <label className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm" key={employee.id}>
                      <input
                        checked={field.value.includes(employee.id)}
                        className="h-4 w-4 accent-primary"
                        onChange={(event) => {
                          const nextValue = event.target.checked
                            ? [...field.value, employee.id]
                            : field.value.filter((id) => id !== employee.id);
                          field.onChange(nextValue);
                        }}
                        type="checkbox"
                      />
                      {employee.name}
                    </label>
                  ))}
                </div>
                {errors.assigneeIds?.message ? (
                  <p className="mt-1 text-xs text-red-600">{errors.assigneeIds.message}</p>
                ) : null}
              </fieldset>
            )}
          />
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
