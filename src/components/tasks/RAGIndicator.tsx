import type { Task } from "@/types/task.types";

/* ─── Types ──────────────────────────────────────────────────── */
export type RAGStatus = "GREEN" | "AMBER" | "RED" | "DONE";

/* ─── Compute RAG from task data ─────────────────────────────── */
export function computeRAG(task: Task): RAGStatus {
  if (task.status === "APPROVED") return "DONE";
  if (task.status === "SUBMITTED") return "DONE";
  if (task.status === "DENIED") return "RED";
  if (task.status === "DRAFT") return "GREEN";

  const now = new Date();
  const start = new Date(task.startDate);
  const end = new Date(task.endDate);
  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();
  const pct = totalMs > 0 ? Math.max(0, Math.min(elapsedMs / totalMs, 1)) : 0;

  // Overdue and not submitted/approved → RED
  if (now > end) return "RED";

  // Reopened (manager sent it back) → AMBER
  if (task.status === "REOPENED") return "AMBER";

  // >75% time elapsed and still in progress → AMBER
  if (pct >= 0.75) return "AMBER";

  return "GREEN";
}

/* ─── Config per RAG status ──────────────────────────────────── */
const RAG_CONFIG: Record<
  RAGStatus,
  { label: string; description: string; markerColor: string; textColor: string; bgColor: string; borderColor: string }
> = {
  GREEN: {
    label: "On Track",
    description: "Task is progressing as planned.",
    markerColor: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  AMBER: {
    label: "At Risk",
    description: "Needs attention — deadline approaching or task reopened.",
    markerColor: "bg-amber-500",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  RED: {
    label: "Off Track",
    description: "Overdue or denied. Immediate action required.",
    markerColor: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  DONE: {
    label: "Completed",
    description: "Task has been submitted or approved.",
    markerColor: "bg-slate-400",
    textColor: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
  },
};

/* ─── Main component ─────────────────────────────────────────── */
export function RAGIndicator({ task }: { task: Task }) {
  const rag = computeRAG(task);
  const config = RAG_CONFIG[rag];

  // Find the date the task was completed or submitted
  const completionDate = (() => {
    if (task.status === "APPROVED" && task.actualCompletionDate) {
      return new Date(task.actualCompletionDate);
    }
    const completionLog = [...task.auditLogs]
      .filter((log) => {
        const action = log.action.toLowerCase();
        return action.includes("submitted") || action.includes("approved");
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    return completionLog ? new Date(completionLog.createdAt) : null;
  })();

  const getLocalDateStr = (d: Date | string) => {
    const dateObj = new Date(d);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const referenceDate = completionDate || new Date();
  const start = new Date(task.startDate);
  const end = new Date(task.endDate);
  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = referenceDate.getTime() - start.getTime();
  const pct = totalMs > 0 ? Math.max(0, Math.min((elapsedMs / totalMs) * 100, 100)) : 0;

  const daysTotal = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
  const daysLeft = Math.ceil((end.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = daysTotal - Math.max(daysLeft, 0);

  const completionDateStr = completionDate ? getLocalDateStr(completionDate) : null;
  const isCompletedEarly = completionDateStr && completionDateStr < task.endDate;

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4`}>
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* RAG dot */}
          <span
            className={`relative flex h-3 w-3 shrink-0`}
            title={config.label}
          >
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${config.markerColor}`}
            />
            <span className={`relative inline-flex h-3 w-3 rounded-full ${config.markerColor}`} />
          </span>
          <span className={`text-sm font-bold ${config.textColor}`}>{config.label}</span>
        </div>
        <span className={`text-xs font-semibold ${config.textColor}`}>
          {Math.round(pct)}% time used
        </span>
      </div>

      {/* 3-zone segmented bar */}
      <div className="relative mb-3">
        {/* Track */}
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          <div className="flex-1 bg-emerald-200" style={{ width: "50%" }} />
          <div className="flex-1 bg-amber-200" style={{ width: "25%" }} />
          <div className="flex-1 bg-red-200" style={{ width: "25%" }} />
        </div>

        {/* Position marker */}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${Math.min(Math.max(pct, 2), 98)}%` }}
        >
          <div
            className={`h-5 w-5 rounded-full border-2 border-white shadow-md ${config.markerColor}`}
          />
        </div>

        {/* Zone labels */}
        <div className="mt-1 flex justify-between text-[10px] font-semibold">
          <span className="text-emerald-600">On Track</span>
          <span className="text-amber-600">At Risk</span>
          <span className="text-red-600">Off Track</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span>
          <span className="font-semibold text-slate-700">{daysElapsed}</span> / {daysTotal} days elapsed
        </span>
        {completionDate ? (
          daysLeft > 0 ? (
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              🎉 Completed early by {daysLeft} {daysLeft === 1 ? "day" : "days"}!
            </span>
          ) : daysLeft === 0 ? (
            <span className="text-emerald-600 font-semibold">
              ✅ Completed on time!
            </span>
          ) : (
            <span className="text-amber-600 font-semibold">
              Completed {Math.abs(daysLeft)} {Math.abs(daysLeft) === 1 ? "day" : "days"} past deadline
            </span>
          )
        ) : daysLeft > 0 ? (
          <span>
            <span className="font-semibold text-slate-700">{daysLeft}</span> days remaining
          </span>
        ) : (
          <span className="font-semibold text-red-600">
            {Math.abs(daysLeft)} days overdue
          </span>
        )}
      </div>

      {/* Description */}
      <p className={`mt-2 text-xs ${config.textColor}`}>
        {completionDate && isCompletedEarly
          ? `🎉 Excellent! The task was completed and submitted ahead of schedule.`
          : config.description}
      </p>
    </div>
  );
}

/* ─── Compact pill for list views ───────────────────────────── */
export function RAGPill({ task }: { task: Task }) {
  const rag = computeRAG(task);
  const pills: Record<RAGStatus, string> = {
    GREEN: "bg-emerald-100 text-emerald-700 border-emerald-200",
    AMBER: "bg-amber-100 text-amber-700 border-amber-200",
    RED:   "bg-red-100 text-red-700 border-red-200",
    DONE:  "bg-slate-100 text-slate-500 border-slate-200",
  };
  const labels: Record<RAGStatus, string> = {
    GREEN: "🟢 On Track",
    AMBER: "🟡 At Risk",
    RED:   "🔴 Off Track",
    DONE:  "✅ Completed",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${pills[rag]}`}>
      {labels[rag]}
    </span>
  );
}
