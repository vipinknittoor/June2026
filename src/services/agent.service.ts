import { api, type ApiResponse } from "@/lib/axios";

export interface QuerySpec {
  model: string | null;
  operation: string | null;
  args: {
    where?: Record<string, unknown>;
    take?: number;
    [key: string]: unknown;
  } | null;
  generatePDF: boolean;
  isConversational?: boolean;
  reply?: string | null;
}

export interface AgentQueryResult {
  querySpec: QuerySpec;
  resultsCount: number;
  pdfUrl: string | null;
  error: string | null;
  retryCount: number;
  results?: unknown[];
  queryResults?: unknown[] | null;
}

export interface AgentResponse {
  success: boolean;
  data?: AgentQueryResult;
  message: string;
  error?: string;
  retryCount?: number;
}

export interface ChatHistoryEntry {
  role: "user" | "model" | "assistant";
  message: string;
}

export async function queryAgent(
  prompt: string,
  history?: ChatHistoryEntry[],
  model?: string
): Promise<AgentResponse> {
  if (process.env.NEXT_PUBLIC_ENABLE_MOCKS === "true") {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return getMockAgentResponse(prompt);
  }

  try {
    const response = await api.post<ApiResponse<AgentQueryResult>>("/agent/query", {
      prompt,
      history,
      model,
    });
    const data = response.data.data;
    if (data && data.queryResults !== undefined && data.queryResults !== null) {
      data.results = data.queryResults;
    }
    return {
      success: response.data.status !== "error" && response.data.data !== undefined,
      data,
      message: response.data.message || "Agent query completed successfully",
    };
  } catch (error: unknown) {
    const err = error as {
      response?: {
        data?: {
          message?: string;
          error?: string;
          retryCount?: number;
        };
      };
      message?: string;
    };
    if (err.response?.data) {
      const errorData = err.response.data;
      return {
        success: false,
        message: errorData.message || "Agent execution failed to retrieve results",
        error: errorData.error || err.message,
        retryCount: typeof errorData.retryCount === "number" ? errorData.retryCount : 0,
      };
    }
    return {
      success: false,
      message: "Network error or backend agent unreachable",
      error: err.message || String(error),
      retryCount: 0,
    };
  }
}

function getMockAgentResponse(prompt: string): AgentResponse {
  const normalized = prompt.toLowerCase();

  // Scenario 3: Error simulation
  if (normalized.includes("error") || normalized.includes("fail") || normalized.includes("invalid")) {
    return {
      success: false,
      message: "Agent execution failed to retrieve results",
      error: "PrismaClientValidationError: Unknown argument \"invalidFilterOption\" on field \"where\" of model \"Task\". Ensure database fields align with Prisma client bindings.",
      retryCount: 3,
    };
  }

  // Scenario 2: PDF generation report
  if (
    normalized.includes("report") ||
    normalized.includes("pdf") ||
    normalized.includes("export") ||
    normalized.includes("download")
  ) {
    return {
      success: true,
      data: {
        querySpec: {
          model: "task",
          operation: "findMany",
          args: {
            where: {
              isActive: true,
              priority: "HIGH",
            },
            take: 100,
          },
          generatePDF: true,
        },
        resultsCount: 5,
        pdfUrl: "/uploads/reports/task_report_1782368766239.pdf",
        error: null,
        retryCount: 0,
        results: [
          { id: "task-10", title: "Review system security parameters", priority: "HIGH", status: "DRAFT", endDate: "2026-07-12" },
          { id: "task-11", title: "Compile audit credentials log", priority: "HIGH", status: "DRAFT", endDate: "2026-07-15" },
          { id: "task-12", title: "Deploy secure router rulesets", priority: "HIGH", status: "DRAFT", endDate: "2026-07-20" },
          { id: "task-13", title: "Update server SSL certificate", priority: "HIGH", status: "DRAFT", endDate: "2026-07-22" },
          { id: "task-14", title: "Resolve critical firewall warning", priority: "HIGH", status: "DRAFT", endDate: "2026-07-25" }
        ]
      },
      message: "Agent query completed successfully",
    };
  }

  // Scenario 1: Plain query for employees/users
  if (
    normalized.includes("employee") ||
    normalized.includes("user") ||
    normalized.includes("team") ||
    normalized.includes("member")
  ) {
    return {
      success: true,
      data: {
        querySpec: {
          model: "user",
          operation: "findMany",
          args: {
            where: {
              role: "EMPLOYEE",
              isActive: true,
            },
            take: 100,
          },
          generatePDF: false,
        },
        resultsCount: 3,
        pdfUrl: null,
        error: null,
        retryCount: 0,
        results: [
          { id: "employee-1", name: "Meera Employee", email: "employee@test.com", title: "Software Developer" },
          { id: "employee-2", name: "Kabir Employee", email: "kabir@test.com", title: "DevOps Engineer" },
          { id: "employee-3", name: "Neha Employee", email: "neha@test.com", title: "QA Engineer" }
        ]
      },
      message: "Agent query completed successfully",
    };
  }

  // General fallback response (e.g. querying active tasks)
  return {
    success: true,
    data: {
      querySpec: {
        model: "task",
        operation: "findMany",
        args: {
          where: {
            status: "IN_PROGRESS",
          },
          take: 50,
        },
        generatePDF: false,
      },
      resultsCount: 4,
      pdfUrl: null,
      error: null,
      retryCount: 1, // Simulated healed database query
      results: [
        { id: "task-1", title: "Prepare onboarding checklist", priority: "HIGH", status: "IN_PROGRESS", endDate: "2026-06-28" },
        { id: "task-4", title: "Accept assigned QA checklist", priority: "MEDIUM", status: "ASSIGNED", endDate: "2026-06-30" },
        { id: "task-5", title: "Configure backend server router", priority: "HIGH", status: "IN_PROGRESS", endDate: "2026-07-02" },
        { id: "task-6", title: "Write initial unit test cases", priority: "LOW", status: "IN_PROGRESS", endDate: "2026-07-04" }
      ]
    },
    message: "Agent query completed successfully",
  };
}
