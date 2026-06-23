"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Pencil, RotateCcw, Send, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { CommentThread } from "@/components/tasks/CommentThread";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import {
  useDeleteTask,
  useEmployees,
  useManagers,
  useTask,
  useTaskStatusMutation,
  useUpdateTask,
} from "@/hooks/useTasks";
import { formatDate } from "@/lib/utils";
import { reopenSchema, type ReopenFormValues } from "@/schemas/denial.schema";
import { taskSchema, type TaskFormValues } from "@/schemas/task.schema";

export default function AdminTaskDetailPage() {
  const router = useRouter();
  const params = useParams<{ taskId: string }>();
  const taskId = params.taskId;
  const { data: task, isLoading, isError } = useTask(taskId);
  const statusMutation = useTaskStatusMutation(taskId);
  const updateTask = useUpdateTask(taskId);
  const deleteTask = useDeleteTask();
  const employees = useEmployees();
  const managers = useManagers();
  const employeeList = employees.data ?? [];
  const [reopenOpen, setReopenOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const reopenForm = useForm<ReopenFormValues>({
    resolver: zodResolver(reopenSchema),
  });
  const editForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = reopenForm;

  useEffect(() => {
    if (!task) {
      return;
    }

    editForm.reset({
      title: task.title,
      description: task.description,
      goal: task.goal,
      startDate: task.startDate,
      endDate: task.endDate,
      priority: task.priority,
      acceptanceCriteria: task.acceptanceCriteria,
      assigneeIds: task.assignees.map((user) => user.id),
      reviewingManagerId: task.reviewingManager.id,
    });
  }, [editForm, task]);

  async function reopen(values: ReopenFormValues) {
    await statusMutation.mutateAsync({ status: "REOPENED", note: values.comment });
    reset();
    setReopenOpen(false);
  }

  async function submitEdit(values: TaskFormValues) {
    if (task?.status !== "DRAFT") {
      if (values.assigneeIds.length === 0) {
        editForm.setError("assigneeIds", { message: "Select at least one employee" });
        return;
      }

      if (!values.reviewingManagerId) {
        editForm.setError("reviewingManagerId", { message: "Select a reviewing manager" });
        return;
      }
    }

    await updateTask.mutateAsync(values);
    setEditOpen(false);
  }

  if (isLoading) {
    return <Spinner label="Loading task" />;
  }

  if (isError || !task) {
    return <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">Task could not be loaded.</p>;
  }

  const canDelete = task.status === "DRAFT" || task.status === "ASSIGNED";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <TaskStatusBadge status={task.status} />
            <h2 className="mt-3 text-2xl font-bold text-slate-950">{task.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{task.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => setEditOpen(true)}
              type="button"
              variant="secondary"
            >
              Edit
            </Button>
            <Button
              disabled={!canDelete}
              icon={<Trash2 className="h-4 w-4" />}
              isLoading={deleteTask.isPending}
              onClick={async () => {
                await deleteTask.mutateAsync(task.id);
                router.push("/admin/tasks");
              }}
              type="button"
              variant="danger"
            >
              Delete
            </Button>
            {task.status === "DRAFT" ? (
              <Button
                disabled={task.assignees.length === 0 || !task.reviewingManager.id}
                icon={<Send className="h-4 w-4" />}
                isLoading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ status: "ASSIGNED" })}
                type="button"
              >
                Assign
              </Button>
            ) : null}
            {task.status === "SUBMITTED" ? (
              <>
              <Button
                icon={<CheckCircle className="h-4 w-4" />}
                isLoading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ status: "APPROVED" })}
                type="button"
              >
                Approve
              </Button>
              <Button
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={() => setReopenOpen(true)}
                type="button"
                variant="secondary"
              >
                Reopen
              </Button>
              </>
            ) : null}
          </div>
        </div>
      </Card>
      <Card className="grid gap-4 sm:grid-cols-2">
        <Info label="Goal" value={task.goal} />
        <Info label="Priority" value={task.priority} />
        <Info label="Start" value={formatDate(task.startDate)} />
        <Info label="End" value={formatDate(task.endDate)} />
        <Info label="Reviewing manager" value={task.reviewingManager.name} />
        <Info label="Assignees" value={task.assignees.map((user) => user.name).join(", ")} />
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold text-slate-950">Acceptance criteria</h3>
        <p className="text-sm text-slate-700">{task.acceptanceCriteria}</p>
      </Card>
      {task.denialReason ? (
        <Card className="border-red-200 bg-red-50">
          <h3 className="mb-2 font-semibold text-red-950">Denial reason</h3>
          <p className="text-sm text-red-800">{task.denialReason}</p>
        </Card>
      ) : null}
      <Card>
        <h3 className="mb-3 font-semibold text-slate-950">Comments</h3>
        <CommentThread comments={task.comments} />
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold text-slate-950">Audit trail</h3>
        <div className="space-y-3">
          {task.auditLogs.map((log) => (
            <div className="rounded-md border border-slate-200 p-3 text-sm" key={log.id}>
              <p className="font-semibold text-slate-950">{log.action}</p>
              <p className="mt-1 text-slate-600">
                {log.actor.name} - {formatDate(log.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold text-slate-950">Effort logs</h3>
        {task.effortLogs.length === 0 ? (
          <p className="text-sm text-slate-500">No effort logged yet.</p>
        ) : (
          <div className="space-y-3">
            {task.effortLogs.map((log) => (
              <div className="rounded-md border border-slate-200 p-3 text-sm" key={log.id}>
                <p className="font-semibold text-slate-950">
                  {log.hours} hours - {log.actor.name}
                </p>
                <p className="mt-1 text-slate-600">{log.note}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(log.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Modal onClose={() => setEditOpen(false)} open={editOpen} title="Edit task">
        <form className="grid gap-4" onSubmit={editForm.handleSubmit(submitEdit)}>
          <Input error={editForm.formState.errors.title?.message} label="Title" {...editForm.register("title")} />
          <Textarea error={editForm.formState.errors.description?.message} label="Description" {...editForm.register("description")} />
          <Textarea error={editForm.formState.errors.goal?.message} label="Goal" {...editForm.register("goal")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input error={editForm.formState.errors.startDate?.message} label="Start date" type="date" {...editForm.register("startDate")} />
            <Input error={editForm.formState.errors.endDate?.message} label="End date" type="date" {...editForm.register("endDate")} />
          </div>
          <Select error={editForm.formState.errors.priority?.message} label="Priority" {...editForm.register("priority")}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>
          <Controller
            control={editForm.control}
            name="assigneeIds"
            render={({ field }) => (
              <fieldset>
                <legend className="text-sm font-medium text-slate-700">Employees</legend>
                <label className="mt-2 flex items-center gap-2 rounded-md border border-primary/30 bg-blue-50 p-3 text-sm font-semibold text-primary">
                  <input
                    checked={employeeList.length > 0 && field.value.length === employeeList.length}
                    className="h-4 w-4 accent-primary"
                    onChange={(event) =>
                      field.onChange(event.target.checked ? employeeList.map((employee) => employee.id) : [])
                    }
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
                          field.onChange(
                            event.target.checked
                              ? [...field.value, employee.id]
                              : field.value.filter((id) => id !== employee.id),
                          );
                        }}
                        type="checkbox"
                      />
                      {employee.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          />
          <Select
            error={editForm.formState.errors.reviewingManagerId?.message}
            label="Reviewing manager"
            {...editForm.register("reviewingManagerId")}
          >
            {(managers.data ?? []).map((manager) => (
              <option key={manager.id} value={manager.id}>{manager.name}</option>
            ))}
          </Select>
          <Textarea
            error={editForm.formState.errors.acceptanceCriteria?.message}
            label="Acceptance criteria"
            {...editForm.register("acceptanceCriteria")}
          />
          <Button isLoading={updateTask.isPending} type="submit">
            Save changes
          </Button>
        </form>
      </Modal>
      <Modal onClose={() => setReopenOpen(false)} open={reopenOpen} title="Reopen task">
        <form className="space-y-4" onSubmit={handleSubmit(reopen)}>
          <Textarea
            error={errors.comment?.message}
            label="Manager comment"
            {...register("comment")}
          />
          <Button isLoading={statusMutation.isPending} type="submit">
            Reopen task
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}
