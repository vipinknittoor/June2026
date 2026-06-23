"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, CheckCircle, Clock, Paperclip, Pencil, RotateCcw, Send, Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { CommentThread } from "@/components/tasks/CommentThread";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { RAGIndicator } from "@/components/tasks/RAGIndicator";
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
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([]);
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
    setEditAssigneeIds(task.assignees.map((user) => user.id));
  }, [editForm, task]);

  async function reopen(values: ReopenFormValues) {
    await statusMutation.mutateAsync({ status: "REOPENED", note: values.comment });
    reset();
    setReopenOpen(false);
  }

  function toggleEditAssignee(id: string) {
    const next = editAssigneeIds.includes(id)
      ? editAssigneeIds.filter((a) => a !== id)
      : [...editAssigneeIds, id];
    setEditAssigneeIds(next);
    editForm.setValue("assigneeIds", next);
  }

  function removeEditAssignee(id: string) {
    const next = editAssigneeIds.filter((a) => a !== id);
    setEditAssigneeIds(next);
    editForm.setValue("assigneeIds", next);
  }

  async function submitEdit(values: TaskFormValues) {
    if (task?.status !== "DRAFT") {
      if (editAssigneeIds.length === 0) {
        editForm.setError("assigneeIds", { message: "Select at least one employee" });
        return;
      }

      if (!values.reviewingManagerId) {
        editForm.setError("reviewingManagerId", { message: "Select a reviewing manager" });
        return;
      }
    }

    await updateTask.mutateAsync({ ...values, assigneeIds: editAssigneeIds });
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
      {/* RAG Health Graph */}
      <RAGIndicator task={task} />
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
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-950 text-base">EOD Progress Timeline</h3>
            <p className="text-xs text-slate-500">Day-by-day compliance tracker from Start Date to End Date.</p>
          </div>
          {/* Simple legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Logged
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Missed Update
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Pending Today
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-200" /> Upcoming
            </span>
          </div>
        </div>

        {(() => {
          const dates = task.startDate && task.endDate ? getDatesInRange(task.startDate, task.endDate) : [];
          const todayStr = getLocalDateStr(new Date());

          if (dates.length === 0) {
            return <p className="text-sm text-slate-500">No scheduled dates available for this task.</p>;
          }

          return (
            <div className="relative ml-3 border-l-2 border-slate-200 pl-6 space-y-6 py-2">
              {dates.map((dateStr, index) => {
                const logsOnDay = task.effortLogs.filter((log) => getLocalDateStr(log.createdAt) === dateStr);
                const attachmentsOnDay = task.attachments.filter((att) => getLocalDateStr(att.createdAt) === dateStr);
                
                let status: "LOGGED" | "MISSED" | "PENDING" | "UPCOMING" = "UPCOMING";
                if (logsOnDay.length > 0) {
                  status = "LOGGED";
                } else if (dateStr < todayStr) {
                  status = "MISSED";
                } else if (dateStr === todayStr) {
                  status = "PENDING";
                }

                return (
                  <div key={index} className="relative">
                    {/* Timeline dot */}
                    <div className={`absolute -left-9 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                      status === "LOGGED" ? "bg-emerald-500 text-white" :
                      status === "MISSED" ? "bg-rose-500 text-white" :
                      status === "PENDING" ? "bg-amber-400 text-white animate-pulse" :
                      "bg-slate-200 text-slate-500"
                    }`}>
                      {status === "LOGGED" && <Check className="h-3 w-3" />}
                      {status === "MISSED" && <X className="h-3.5 w-3.5" />}
                      {status === "PENDING" && <Clock className="h-3 w-3" />}
                    </div>

                    {/* Day content */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          Day {index + 1}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {formatDate(dateStr + "T00:00:00")}
                        </span>
                        {status === "PENDING" && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Status body */}
                      <div className="mt-1.5">
                        {status === "LOGGED" ? (
                          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-2">
                            {logsOnDay.map((log) => (
                              <div key={log.id} className="text-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-semibold text-slate-900">{log.actor.name}</span>
                                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                                    <Clock className="h-3 w-3" />
                                    {log.hours}h logged
                                  </span>
                                </div>
                                {log.note ? <p className="mt-1.5 text-slate-600 leading-normal">{log.note}</p> : null}
                                
                                {/* Attachments for this day */}
                                {attachmentsOnDay.length > 0 && (
                                  <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-200/60 pt-2">
                                    {attachmentsOnDay.map((att) => (
                                      <a
                                        key={att.id}
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          alert(`Downloading file: ${att.fileUrl}`);
                                        }}
                                        className="inline-flex items-center gap-1 rounded bg-white border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                                      >
                                        <Paperclip className="h-3 w-3 text-slate-400 shrink-0" />
                                        <span className="truncate max-w-[150px]">{att.fileUrl}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : status === "MISSED" ? (
                          <div className="rounded-lg border border-rose-100 bg-rose-50/30 p-2.5 text-xs text-rose-700 font-medium flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                            <span>Missed update — no daily progress or effort hours logged for this day.</span>
                          </div>
                        ) : status === "PENDING" ? (
                          <div className="rounded-lg border border-amber-100 bg-amber-50/20 p-2.5 text-xs text-amber-700 font-medium flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-amber-500 shrink-0 animate-pulse" />
                            <span>Pending EOD update — employee has not yet logged effort for today.</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 pl-1 font-medium">Upcoming schedule day.</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
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
          {/* Employees dropdown + tags */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Employees</label>
              {editAssigneeIds.length === employeeList.length && employeeList.length > 0 ? (
                <button
                  className="text-xs font-medium text-red-500 hover:underline"
                  onClick={() => { setEditAssigneeIds([]); editForm.setValue("assigneeIds", []); }}
                  type="button"
                >
                  Clear all
                </button>
              ) : (
                <button
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => { const all = employeeList.map((e) => e.id); setEditAssigneeIds(all); editForm.setValue("assigneeIds", all); }}
                  type="button"
                >
                  Assign to all employees
                </button>
              )}
            </div>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => {
                if (e.target.value) toggleEditAssignee(e.target.value);
                e.target.value = "";
              }}
              value=""
            >
              <option value="">— Select an employee to add —</option>
              {employeeList
                .filter((emp) => !editAssigneeIds.includes(emp.id))
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}{emp.title ? ` · ${emp.title}` : ""}
                  </option>
                ))}
            </select>
            {editAssigneeIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {editAssigneeIds.map((id) => {
                  const emp = employeeList.find((e) => e.id === id);
                  return emp ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      key={id}
                    >
                      {emp.name}
                      <button
                        className="rounded-full hover:text-red-500"
                        onClick={() => removeEditAssignee(id)}
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
            {editForm.formState.errors.assigneeIds?.message ? (
              <p className="mt-1 text-xs text-red-600">{editForm.formState.errors.assigneeIds.message}</p>
            ) : null}
          </div>
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

function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const [startY, startM, startD] = startDateStr.split("-").map(Number);
  const [endY, endM, endD] = endDateStr.split("-").map(Number);
  
  const start = new Date(startY, startM - 1, startD);
  const end = new Date(endY, endM - 1, endD);
  
  const dates: string[] = [];
  const current = new Date(start);
  let count = 0;
  while (current <= end && count < 100) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    
    current.setDate(current.getDate() + 1);
    count++;
  }
  return dates;
}

function getLocalDateStr(dateInput: string | Date): string {
  const d = new Date(dateInput);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}
