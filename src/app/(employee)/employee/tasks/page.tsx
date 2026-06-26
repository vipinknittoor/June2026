"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Flag,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { CommentThread } from "@/components/tasks/CommentThread";
import { RAGIndicator } from "@/components/tasks/RAGIndicator";
import { useMyTasks, useDenyTask, useSaveProgress, useTaskStatusMutation, useUploadAttachment } from "@/hooks/useTasks";
import { denialSchema, type DenialFormValues } from "@/schemas/denial.schema";
import { formatDate, isOverdue } from "@/lib/utils";
import type { Task } from "@/types/task.types";

/* ─── Column config ─────────────────────────────────────────── */
const COLUMNS: { key: Task["status"][]; label: string; color: string; dot: string }[] = [
  { key: ["ASSIGNED"],    label: "Assigned",          color: "bg-blue-50 border-blue-200",   dot: "bg-blue-400"   },
  { key: ["IN_PROGRESS"], label: "Accepted",          color: "bg-violet-50 border-violet-200", dot: "bg-violet-400" },
  { key: ["SUBMITTED"],   label: "Submitted for Review", color: "bg-amber-50 border-amber-200",  dot: "bg-amber-400"  },
  { key: ["REOPENED"],    label: "Reopened",          color: "bg-rose-50 border-rose-200",   dot: "bg-rose-400"   },
  { key: ["APPROVED"],    label: "Approved",          color: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
];

/* ─── Priority colour ────────────────────────────────────────── */
const PRIORITY_COLOR: Record<string, string> = {
  HIGH:   "text-red-600",
  MEDIUM: "text-amber-600",
  LOW:    "text-slate-400",
};

/* ─── Progress form type ─────────────────────────────────────── */
interface ProgressFormValues {
  notes: string;
  effortHours: number;
  attachment: FileList;
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function EmployeeTasksPage() {
  const { data = [], isLoading, isError } = useMyTasks();
  const [selected, setSelected] = useState<Task | null>(null);

  // Sync selected task from live data so status updates reflect immediately
  const liveSelected = selected ? (data.find((t) => t.id === selected.id) ?? null) : null;

  return (
    <div className="relative">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-950">My Tasks</h2>
        <p className="text-sm text-slate-600">Your assigned work across every stage.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {COLUMNS.map((col) => <Skeleton className="h-48" key={col.label} />)}
        </div>
      ) : isError ? (
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">Tasks could not be loaded.</p>
      ) : (
        /* ── Kanban board ── */
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {COLUMNS.map((col) => {
            const tasks = data.filter((t) => col.key.includes(t.status));
            return (
              <div
                className={`rounded-xl border-2 ${col.color} flex flex-col`}
                key={col.label}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 border-b border-inherit px-4 py-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500 shadow-sm">
                    {tasks.length}
                  </span>
                </div>

                {/* Task cards (title only) */}
                <div className="flex flex-col gap-2 p-3">
                  {tasks.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">No tasks here</p>
                  ) : (
                    tasks.map((task) => (
                      <button
                        className={`group flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-800 shadow-sm transition hover:border-primary hover:shadow-md ${
                          liveSelected?.id === task.id ? "border-primary ring-1 ring-primary" : "border-slate-200"
                        }`}
                        key={task.id}
                        onClick={() => setSelected(task)}
                        type="button"
                      >
                        <span className="line-clamp-2 leading-snug">{task.title}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-primary" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail slide-in panel ── */}
      {liveSelected ? (
        <TaskDetailPanel
          onClose={() => setSelected(null)}
          task={liveSelected}
        />
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL PANEL (slide-in tiling)
═══════════════════════════════════════════════════════════════ */
function TaskDetailPanel({ task, onClose }: { task: Task; onClose: () => void }) {
  const statusMutation  = useTaskStatusMutation(task.id);
  const denyTask        = useDenyTask(task.id);
  const saveProgress    = useSaveProgress(task.id);
  const uploadAttachment = useUploadAttachment(task.id);

  const [denyOpen, setDenyOpen] = useState(false);

  const denialForm = useForm<DenialFormValues>({ resolver: zodResolver(denialSchema) });
  const progressForm = useForm<ProgressFormValues>({
    defaultValues: { notes: "", effortHours: 0 },
  });
  const attachment = progressForm.watch("attachment");

  const canWork = task.status === "IN_PROGRESS" || task.status === "REOPENED";
  const reopenComments = task.comments.filter((c) => c.type === "REOPEN_COMMENT");
  const overdue = isOverdue(task.endDate) && task.status !== "APPROVED";

  async function submitDenial(values: DenialFormValues) {
    await denyTask.mutateAsync(values.reason);
    denialForm.reset();
    setDenyOpen(false);
  }

  async function submitProgress(values: ProgressFormValues) {
    await saveProgress.mutateAsync({
      notes: values.notes,
      effortHours: Number(values.effortHours),
    });
    const file = values.attachment?.item(0);
    if (file) await uploadAttachment.mutateAsync(file);
    progressForm.reset();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        {/* Panel header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div className="min-w-0">
            <TaskStatusBadge status={task.status} />
            <h2 className="mt-2 text-lg font-bold leading-snug text-slate-950">{task.title}</h2>
          </div>
          <button
            className="mt-1 shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Due {formatDate(task.endDate)}
              {overdue ? <span className="ml-1 font-bold text-red-600">· Overdue</span> : null}
            </span>
            <span className={`flex items-center gap-1 ${PRIORITY_COLOR[task.priority]}`}>
              <Flag className="h-3.5 w-3.5" />
              {task.priority}
            </span>
          </div>

          {/* Description */}
          <Section title="Description">
            <p className="text-sm text-slate-700">{task.description}</p>
          </Section>

          {/* Details grid */}
          <Section title="Details">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Goal" value={task.goal} />
              <Info label="Reviewing manager" value={task.reviewingManager.name} />
              <Info label="Start date" value={formatDate(task.startDate)} />
              <Info label="End date" value={formatDate(task.endDate)} />
              <Info label="Acceptance criteria" value={task.acceptanceCriteria} />
              {task.effortHours ? <Info label="Effort logged" value={`${task.effortHours}h`} /> : null}
            </div>
          </Section>

          {/* RAG Health Graph */}
          <Section title="Task Health">
            <RAGIndicator task={task} />
          </Section>

          {/* Accept / Deny actions */}
          {task.status === "ASSIGNED" ? (
            <Section title="Actions">
              {denyOpen ? (
                <form className="grid gap-3" onSubmit={denialForm.handleSubmit(submitDenial)}>
                  <Textarea
                    error={denialForm.formState.errors.reason?.message}
                    label="Denial reason"
                    {...denialForm.register("reason")}
                  />
                  <div className="flex gap-2">
                    <Button isLoading={denyTask.isPending} type="submit" variant="danger">
                      Confirm denial
                    </Button>
                    <Button onClick={() => setDenyOpen(false)} type="button" variant="secondary">
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex gap-2">
                  <Button
                    icon={<Check className="h-4 w-4" />}
                    isLoading={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ status: "IN_PROGRESS" })}
                    type="button"
                  >
                    Accept task
                  </Button>
                  <Button
                    icon={<X className="h-4 w-4" />}
                    onClick={() => setDenyOpen(true)}
                    type="button"
                    variant="danger"
                  >
                    Deny
                  </Button>
                </div>
              )}
            </Section>
          ) : null}

          {/* Reopen comments */}
          {task.status === "REOPENED" && reopenComments.length > 0 ? (
            <Section title="Manager reopen comments">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <CommentThread comments={reopenComments} />
              </div>
            </Section>
          ) : null}

          {/* ── EOD Daily Progress Log ── */}
          {canWork ? (
            <Section title="Daily Progress Log">
              {/* Past effort log timeline */}
              {task.effortLogs.length > 0 ? (
                <div className="mb-4 flex flex-col gap-3">
                  {[...task.effortLogs].reverse().map((log) => (
                    <div
                      className="relative rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      key={log.id}
                    >
                      {/* Date + hours */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(log.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                          <Clock className="h-3 w-3" />
                          {log.hours}h logged
                        </span>
                      </div>
                      {/* Notes */}
                      {log.note ? (
                        <p className="mt-2 text-sm text-slate-700">{log.note}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-xs text-slate-400">No progress logged yet — add your first EOD update below.</p>
              )}

              {/* Compose box */}
              <form
                className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-4"
                onSubmit={progressForm.handleSubmit(submitProgress)}
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Log today&apos;s update</p>
                <Textarea
                  label="What did you work on today?"
                  {...progressForm.register("notes")}
                />
                <div className="mt-3 flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      label="Hours spent today"
                      min={0}
                      step={0.25}
                      type="number"
                      {...progressForm.register("effortHours", { valueAsNumber: true })}
                    />
                  </div>
                  {/* File attach */}
                  <div className="pb-0.5">
                    <label
                      className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary"
                      htmlFor="progress-attachment"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      Attach file
                    </label>
                    <input
                      className="sr-only"
                      id="progress-attachment"
                      type="file"
                      {...progressForm.register("attachment")}
                    />
                  </div>
                </div>
                {/* Show selected file name */}
                {attachment?.[0] ? (
                  <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                    <Paperclip className="h-3 w-3" />
                    {attachment[0].name}
                  </p>
                ) : null}
                <Button
                  className="mt-4 w-full"
                  isLoading={saveProgress.isPending || uploadAttachment.isPending}
                  type="submit"
                >
                  Save EOD update
                </Button>
              </form>

              {/* Submit for review — separate from daily log */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs text-slate-500">Done with all work? Submit the task for manager review.</p>
                <Button
                  className="w-full"
                  icon={<Send className="h-4 w-4" />}
                  isLoading={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ status: "SUBMITTED" })}
                  type="button"
                  variant="secondary"
                >
                  Submit for review
                </Button>
              </div>
            </Section>
          ) : null}

          {/* Comments */}
          {task.comments.length > 0 ? (
            <Section title="Comments">
              <CommentThread comments={task.comments} />
            </Section>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ─── Helpers ────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value}</p>
    </div>
  );
}
