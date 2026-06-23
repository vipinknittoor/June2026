"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Send, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { CommentThread } from "@/components/tasks/CommentThread";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import {
  useDenyTask,
  useSaveProgress,
  useTask,
  useTaskStatusMutation,
  useUploadAttachment,
} from "@/hooks/useTasks";
import { denialSchema, type DenialFormValues } from "@/schemas/denial.schema";
import { formatDate } from "@/lib/utils";

interface ProgressFormValues {
  notes: string;
  effortHours: number;
  attachment: FileList;
}

export default function EmployeeTaskDetailPage() {
  const params = useParams<{ taskId: string }>();
  const taskId = params.taskId;
  const { data: task, isLoading, isError } = useTask(taskId);
  const statusMutation = useTaskStatusMutation(taskId);
  const denyTask = useDenyTask(taskId);
  const saveProgress = useSaveProgress(taskId);
  const uploadAttachment = useUploadAttachment(taskId);
  const [denyOpen, setDenyOpen] = useState(false);
  const denialForm = useForm<DenialFormValues>({
    resolver: zodResolver(denialSchema),
  });
  const progressForm = useForm<ProgressFormValues>({
    defaultValues: {
      notes: "",
      effortHours: 0,
    },
  });

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
    if (file) {
      await uploadAttachment.mutateAsync(file);
    }
  }

  if (isLoading) {
    return <Spinner label="Loading task" />;
  }

  if (isError || !task) {
    return <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">Task could not be loaded.</p>;
  }

  const canWork = task.status === "IN_PROGRESS" || task.status === "REOPENED";
  const reopenComments = task.comments.filter((comment) => comment.type === "REOPEN_COMMENT");

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <TaskStatusBadge status={task.status} />
            <h2 className="mt-3 text-2xl font-bold text-slate-950">{task.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{task.description}</p>
          </div>
          {task.status === "ASSIGNED" ? (
            <div className="flex gap-2">
              <Button
                icon={<Check className="h-4 w-4" />}
                isLoading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ status: "IN_PROGRESS" })}
                type="button"
              >
                Accept
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
          ) : null}
        </div>
      </Card>
      <Card className="grid gap-4 sm:grid-cols-2">
        <Info label="Goal" value={task.goal} />
        <Info label="Reviewing manager" value={task.reviewingManager.name} />
        <Info label="Start" value={formatDate(task.startDate)} />
        <Info label="End" value={formatDate(task.endDate)} />
        <Info label="Priority" value={task.priority} />
        <Info label="Acceptance criteria" value={task.acceptanceCriteria} />
      </Card>
      {task.status === "REOPENED" && reopenComments.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <h3 className="mb-3 font-semibold text-amber-950">Manager reopen comments</h3>
          <CommentThread comments={reopenComments} />
        </Card>
      ) : null}
      {canWork ? (
        <Card>
          <h3 className="mb-4 font-semibold text-slate-950">Progress update</h3>
          <form className="grid gap-4" onSubmit={progressForm.handleSubmit(submitProgress)}>
            <Textarea label="Progress notes" {...progressForm.register("notes")} />
            <Input
              label="Effort hours"
              min={0}
              step={0.25}
              type="number"
              {...progressForm.register("effortHours", { valueAsNumber: true })}
            />
            <Input label="Attachment" type="file" {...progressForm.register("attachment")} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button isLoading={saveProgress.isPending || uploadAttachment.isPending} type="submit">
                Save progress
              </Button>
              <Button
                icon={<Send className="h-4 w-4" />}
                isLoading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ status: "SUBMITTED" })}
                type="button"
                variant="secondary"
              >
                Submit for review
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
      <Card>
        <h3 className="mb-3 font-semibold text-slate-950">Comments</h3>
        <CommentThread comments={task.comments} />
      </Card>
      <Modal onClose={() => setDenyOpen(false)} open={denyOpen} title="Deny task">
        <form className="space-y-4" onSubmit={denialForm.handleSubmit(submitDenial)}>
          <Textarea
            error={denialForm.formState.errors.reason?.message}
            label="Reason"
            {...denialForm.register("reason")}
          />
          <Button isLoading={denyTask.isPending} type="submit" variant="danger">
            Submit reason
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
