"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Terminal,
  FileText,
  AlertTriangle,
  RefreshCw,
  Layers
} from "lucide-react";
import { queryAgent, type AgentQueryResult, type AgentResponse } from "@/services/agent.service";
import { getAttachmentUrl } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  loading?: boolean;
  success?: boolean;
  data?: AgentQueryResult;
  error?: string;
  retryCount?: number;
}

interface UserRow {
  id?: string;
  name?: string;
  title?: string;
  email?: string;
}

interface TaskRow {
  id?: string;
  title?: string;
  status?: string;
  priority?: string;
}

const SUGGESTIONS = [
  { label: "👥 List active employees", prompt: "Give me a list of all active employee users" },
  { label: "📄 Report: High priority drafts", prompt: "Export a PDF report of all tasks that are priority HIGH and status DRAFT" },
  { label: "⏳ Show in-progress tasks", prompt: "Give me a list of all tasks that are in progress" },
  { label: "⚠️ Simulate syntax error query", prompt: "Query tasks where status contains invalidFilterOption" },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am your AI Database Assistant. I parse natural language prompts, compile them into Prisma query specifications, execute them against the database, and self-heal any syntax errors. I can also generate PDF reports if requested. How can I help you today?",
      timestamp: new Date(),
      success: true,
      retryCount: 0,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepText, setCurrentStepText] = useState("Agent Idle");
  const [expandedSpec, setExpandedSpec] = useState<Record<string, boolean>>({});
  const [viewModes, setViewModes] = useState<Record<string, "table" | "card">>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextIdRef = useRef(0);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle cycle of loading messages
  const startLoadingSteps = (prompt: string) => {
    const isReport = prompt.toLowerCase().includes("report") ||
      prompt.toLowerCase().includes("pdf") ||
      prompt.toLowerCase().includes("export") ||
      prompt.toLowerCase().includes("download");

    const steps = isReport 
      ? [
          "Querying database...",
          "Generating PDF report...",
          "Saving export file...",
        ]
      : [
          "Searching records...",
          "Formatting results...",
        ];

    let index = 0;
    setCurrentStepText(steps[0]);

    if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);

    stepIntervalRef.current = setInterval(() => {
      index = (index + 1) % steps.length;
      setCurrentStepText(steps[index]);
    }, 1200);
  };

  const stopLoadingSteps = () => {
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
    setCurrentStepText("Agent Idle");
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, []);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    nextIdRef.current += 1;
    const userMessageId = `msg-${nextIdRef.current}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    startLoadingSteps(textToSend);

    try {
      const response: AgentResponse = await queryAgent(textToSend);
      nextIdRef.current += 1;
      const botMessageId = `msg-${nextIdRef.current}`;

      let botText = response.message || "Query completed successfully";
      if (response.success && response.data) {
        const count = response.data.resultsCount;
        if (response.data.querySpec?.isConversational) {
          botText = response.data.querySpec.reply || response.message || "Conversational reply received.";
        } else if (response.data.pdfUrl) {
          botText = `📄 I generated a PDF report containing ${count} record${count === 1 ? "" : "s"}. You can download the report using the card below.`;
        } else {
          botText = `🔍 Found ${count} record${count === 1 ? "" : "s"} matching your request.`;
        }
      } else if (!response.success) {
        botText = response.message || "AI Assistant failed to retrieve results.";
      }

      let defaultViewMode: "table" | "card" = "table";
      if (response.success && response.data?.results && response.data.results.length > 0) {
        const sample = response.data.results[0] as Record<string, unknown>;
        const longKeys = ["description", "goal", "acceptancecriteria", "denialreason", "note", "text"];
        const hasLongField = Object.keys(sample).some(key => 
          longKeys.includes(key.toLowerCase()) || String(sample[key]).length > 60
        );
        if (hasLongField) {
          defaultViewMode = "card";
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: botMessageId,
          sender: "bot",
          text: botText,
          timestamp: new Date(),
          success: response.success,
          data: response.data,
          error: response.error,
          retryCount: response.retryCount ?? response.data?.retryCount ?? 0,
        },
      ]);

      setViewModes((prev) => ({
        ...prev,
        [botMessageId]: defaultViewMode,
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      nextIdRef.current += 1;
      const botMessageId = `msg-${nextIdRef.current}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMessageId,
          sender: "bot",
          text: "An unexpected error occurred while communicating with the AI Assistant backend.",
          timestamp: new Date(),
          success: false,
          error: errorMessage,
          retryCount: 0,
        },
      ]);
    } finally {
      setIsLoading(false);
      stopLoadingSteps();
    }
  };

  const toggleSpec = (msgId: string) => {
    setExpandedSpec((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* Header section with glow */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-bold text-slate-950">
              <Bot className="h-7 w-7 text-primary" />
              AI Database Assistant
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Admin workspace for natural language database operations, self-healing diagnostics, and PDF report exporting.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              LangGraph Agent Active
            </span>
          </div>
        </div>
      </div>

      {/* Centered Chat Layout */}
      <div className="mx-auto max-w-4xl w-full flex flex-col h-[650px] border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Icon */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
                    msg.sender === "user" 
                      ? "bg-primary" 
                      : "bg-slate-700"
                  }`}>
                    {msg.sender === "user" ? <Layers className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Chat Bubble */}
                  <div className="flex flex-col gap-1">
                    <div className={`rounded-xl px-4 py-3 text-sm shadow-sm ${
                      msg.sender === "user"
                        ? "bg-primary text-white"
                        : msg.success === false
                        ? "bg-red-50 text-red-950 border border-red-200"
                        : "bg-white text-slate-800 border border-slate-100"
                    }`}>
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                      {/* Results list/table */}
                      {msg.sender === "bot" && msg.success && msg.data?.results && msg.data.results.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2 w-full">
                          {/* View Mode Toggle Header */}
                          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              Results ({msg.data.resultsCount})
                            </span>
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                              <button
                                type="button"
                                onClick={() => setViewModes(prev => ({ ...prev, [msg.id]: "table" }))}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition cursor-pointer select-none ${
                                  (viewModes[msg.id] || "table") === "table"
                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                                    : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                Table
                              </button>
                              <button
                                type="button"
                                onClick={() => setViewModes(prev => ({ ...prev, [msg.id]: "card" }))}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition cursor-pointer select-none ${
                                  (viewModes[msg.id] || "table") === "card"
                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                                    : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                Cards
                              </button>
                            </div>
                          </div>

                          {/* Conditional Rendering */}
                          {(viewModes[msg.id] || "table") === "table" ? (
                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                              <table className="w-full min-w-[400px] text-left text-xs text-slate-700">
                                {renderTableResults(msg.data.results, msg.data.querySpec.model)}
                              </table>
                            </div>
                          ) : (
                            renderCardResults(msg.data.results, msg.data.querySpec.model)
                          )}
                        </div>
                      )}

                      {/* PDF Download Button (clean, direct) */}
                      {msg.sender === "bot" && msg.success && msg.data?.pdfUrl && (
                        <div className="mt-2.5 flex items-center">
                          <a
                            href={getAttachmentUrl(msg.data.pdfUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center justify-center gap-2 px-4 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                          >
                            <FileText className="h-4 w-4" />
                            Download PDF Report
                          </a>
                        </div>
                      )}

                      {/* Diagnostic Error Panel (simplified text alert) */}
                      {msg.sender === "bot" && msg.success === false && msg.error && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-100 flex flex-col gap-1">
                          <div className="font-semibold flex items-center gap-1 text-red-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Database Query Error
                          </div>
                          <p className="font-mono text-[10px] leading-relaxed break-words bg-white/70 p-2 rounded border border-red-50">
                            {msg.error}
                          </p>
                          {msg.retryCount !== undefined && msg.retryCount > 0 && (
                            <span className="text-[10px] text-red-500/80">
                              Heal attempts: {msg.retryCount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Collapsible prisma specification details (minimal and hidden by default) */}
                      {msg.sender === "bot" && msg.success && msg.data?.querySpec && !msg.data.querySpec.isConversational && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                          <button
                            onClick={() => toggleSpec(msg.id)}
                            className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Terminal className="h-3 w-3" />
                            {expandedSpec[msg.id] ? "Hide technical parameters" : "Show technical parameters"}
                          </button>

                          {expandedSpec[msg.id] && (
                            <pre className="mt-2 p-2 rounded bg-slate-900 text-slate-300 text-[10px] font-mono overflow-x-auto border border-slate-800">
                              {JSON.stringify(msg.data.querySpec, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-slate-400 px-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing status */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="flex gap-3 max-w-[85%]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white shadow-sm">
                    <Bot className="h-4 w-4 animate-bounce" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="rounded-xl px-4 py-2 text-sm border border-slate-100 bg-white shadow-sm flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-xs text-slate-500 font-medium">{currentStepText}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestions Chips */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
          {SUGGESTIONS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip.prompt)}
              disabled={isLoading}
              className="shrink-0 text-xs font-medium text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Chat input panel */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-4 border-t border-slate-200 bg-white flex gap-3 shrink-0 items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI Assistant (e.g., 'Give me a list of all active employees')..."
            disabled={isLoading}
            className="flex-1 h-11 px-4 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-slate-100 disabled:opacity-60 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover transition shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}

// Helper to dynamically render database query results in a premium table format
function renderTableResults(results: any[] | null | undefined, modelName: string | null) {
  if (!results || results.length === 0) return null;

  const sample = results[0];
  if (typeof sample !== "object" || sample === null) {
    return (
      <tbody>
        {results.map((val, idx) => (
          <tr key={idx} className="hover:bg-slate-50/50">
            <td className="px-3 py-2 font-semibold text-slate-900">{String(val)}</td>
          </tr>
        ))}
      </tbody>
    );
  }

  // Define keys we want to exclude from the visual UI tables to keep them neat
  const excludedKeys = [
    "id",
    "passwordHash",
    "isActive",
    "assignedById",
    "reviewingManagerId",
    "createdAt",
    "updatedAt"
  ];

  const displayKeys = Object.keys(sample).filter(
    (key) => !excludedKeys.includes(key)
  );

  const formatCellValue = (val: any) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "object") {
      if (Array.isArray(val)) {
        if (val.length === 0) return "—";
        if (typeof val[0] === "object" && val[0] !== null && "name" in val[0]) {
          return val.map((item: any) => item.name).join(", ");
        }
        return `[${val.length} items]`;
      }
      if ("name" in val) return String(val.name);
      return JSON.stringify(val);
    }
    // Format date string beautifully if matches ISO format
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(val)) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }
    }
    return String(val);
  };

  const formatKeyName = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <>
      <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
        <tr>
          {displayKeys.map((key) => (
            <th key={key} className="px-3 py-2 whitespace-nowrap">{formatKeyName(key)}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {results.map((row: any, rIdx) => (
          <tr key={row.id || rIdx} className="hover:bg-slate-50/50">
            {displayKeys.map((key) => {
              const val = row[key];
              if (key === "status") {
                return (
                  <td key={key} className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                      val === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      val === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                      val === "SUBMITTED" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      val === "REOPENED" ? "bg-red-50 text-red-700 border border-red-200" :
                      "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}>
                      {String(val)}
                    </span>
                  </td>
                );
              }
              if (key === "priority") {
                return (
                  <td key={key} className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                      val === "HIGH" ? "bg-red-50 text-red-700 border border-red-200" :
                      val === "MEDIUM" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {String(val)}
                    </span>
                  </td>
                );
              }
              return (
                <td key={key} className="px-3 py-2 text-slate-700 max-w-[240px] truncate animate-pulse-none" title={formatCellValue(val)}>
                  {formatCellValue(val)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </>
  );
}

// Helper to dynamically render database query results in a card layout (perfect for long fields like description or goal)
function renderCardResults(results: any[] | null | undefined, modelName: string | null) {
  if (!results || results.length === 0) return null;

  const sample = results[0];
  if (typeof sample !== "object" || sample === null) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        {results.map((val, idx) => (
          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm text-slate-800">
            {String(val)}
          </div>
        ))}
      </div>
    );
  }

  const excludedKeys = [
    "id",
    "passwordHash",
    "isActive",
    "assignedById",
    "reviewingManagerId",
    "createdAt",
    "updatedAt"
  ];

  const formatCellValue = (val: any) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "object") {
      if (Array.isArray(val)) {
        if (val.length === 0) return "—";
        if (typeof val[0] === "object" && val[0] !== null && "name" in val[0]) {
          return val.map((item: any) => item.name).join(", ");
        }
        return `[${val.length} items]`;
      }
      if ("name" in val) return String(val.name);
      return JSON.stringify(val);
    }
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(val)) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }
    }
    return String(val);
  };

  const formatKeyName = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  const displayKeys = Object.keys(sample).filter(
    (key) => !excludedKeys.includes(key)
  );

  const longKeys = ["description", "goal", "acceptancecriteria", "denialreason", "note", "text"];
  const isLongField = (key: string) => longKeys.includes(key.toLowerCase());

  // Short short meta fields (excluding title, name, status, priority, and long text)
  const metaKeys = displayKeys.filter(k => k !== "title" && k !== "name" && k !== "status" && k !== "priority" && !isLongField(k));
  // Long body text fields
  const bodyKeys = displayKeys.filter(k => isLongField(k));

  return (
    <div className="flex flex-col gap-3 mt-2 w-full text-left">
      {results.map((row: any, rIdx) => {
        const titleVal = row.title || row.name || `Record #${rIdx + 1}`;
        const statusVal = row.status;
        const priorityVal = row.priority;

        return (
          <div key={row.id || rIdx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:border-slate-300 transition">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <h4 className="font-bold text-slate-900 text-sm leading-snug">{titleVal}</h4>
              <div className="flex items-center gap-1.5 shrink-0">
                {statusVal && (
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    statusVal === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    statusVal === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                    statusVal === "SUBMITTED" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                    "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}>
                    {statusVal}
                  </span>
                )}
                {priorityVal && (
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    priorityVal === "HIGH" ? "bg-red-50 text-red-700 border border-red-200" :
                    priorityVal === "MEDIUM" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                    "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
                    {priorityVal}
                  </span>
                )}
              </div>
            </div>

            {/* Short Meta Grid */}
            {metaKeys.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-slate-50 pt-2.5">
                {metaKeys.map(key => (
                  <div key={key} className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{formatKeyName(key)}</span>
                    <span className="text-slate-700 font-medium truncate" title={formatCellValue(row[key])}>
                      {formatCellValue(row[key])}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Long text blocks (like description or goal) */}
            {bodyKeys.map(key => (
              <div key={key} className="text-xs border-t border-slate-50 pt-2.5 flex flex-col gap-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{formatKeyName(key)}</span>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                  {formatCellValue(row[key])}
                </p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
