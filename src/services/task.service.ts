import { api } from "@/lib/axios";
import type { Comment as TaskComment, Task, TaskStatus } from "@/types/task.types";
import type { User } from "@/types/user.types";
import type { TaskFormValues } from "@/schemas/task.schema";
import {
  demoPasswords,
  demoUsers,
  mockNotifications,
  mockTasks,
  setMockNotifications,
  setMockTasks,
} from "./mockData";

export interface TaskFilters {
  status?: TaskStatus | "ALL";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "ALL";
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProgressPayload {
  notes: string;
  effortHours: number;
}

export type CreateTaskPayload = TaskFormValues & {
  status: "DRAFT" | "ASSIGNED";
};

export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  try {
    const response = await api.get<Task[]>("/tasks", { params: filters });
    return response.data;
  } catch {
    return filterTasks(mockTasks, filters);
  }
}

export async function getMyTasks(): Promise<Task[]> {
  try {
    const response = await api.get<Task[]>("/tasks/my");
    return response.data;
  } catch {
    return mockTasks.filter((task) =>
      task.status !== "DRAFT" &&
      task.assignees.some((assignee) => assignee.id === "employee-1"),
    );
  }
}

export async function getTask(taskId: string): Promise<Task> {
  try {
    const response = await api.get<Task>(`/tasks/${taskId}`);
    return response.data;
  } catch {
    const task = mockTasks.find((item) => item.id === taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    return task;
  }
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  try {
    const response = await api.post<Task>("/tasks", payload);
    return response.data;
  } catch {
    if (
      payload.status === "ASSIGNED" &&
      (payload.assigneeIds.length === 0 || !payload.reviewingManagerId)
    ) {
      throw new Error("Assigned tasks require employees and a reviewing manager");
    }

    const assignees = demoUsers.filter((user) => payload.assigneeIds.includes(user.id));
    const reviewingManager =
      demoUsers.find((user) => user.id === payload.reviewingManagerId) ?? demoUsers[0];
    const taskId = `task-${Date.now()}`;
    const task: Task = {
      id: taskId,
      title: payload.title,
      description: payload.description,
      goal: payload.goal,
      startDate: payload.startDate,
      endDate: payload.endDate,
      assignedBy: demoUsers[0],
      reviewingManager,
      assignees,
      priority: payload.priority,
      status: payload.status,
      acceptanceCriteria: payload.acceptanceCriteria,
      createdAt: new Date().toISOString(),
      comments: [],
      attachments: [],
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          taskId,
          actor: demoUsers[0],
          action:
            payload.status === "DRAFT"
              ? "Created draft task"
              : "Assigned task to employee with reviewing manager",
          createdAt: new Date().toISOString(),
        },
      ],
      effortLogs: [],
    };

    setMockTasks([task, ...mockTasks]);
    return task;
  }
}

export async function updateTask(taskId: string, payload: TaskFormValues): Promise<Task> {
  try {
    const response = await api.put<Task>(`/tasks/${taskId}`, payload);
    return response.data;
  } catch {
    const assignees = demoUsers.filter((user) => payload.assigneeIds.includes(user.id));
    const reviewingManager =
      demoUsers.find((user) => user.id === payload.reviewingManagerId) ?? demoUsers[0];
    const updatedTasks = mockTasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            title: payload.title,
            description: payload.description,
            goal: payload.goal,
            startDate: payload.startDate,
            endDate: payload.endDate,
            priority: payload.priority,
            acceptanceCriteria: payload.acceptanceCriteria,
            assignees,
            reviewingManager,
            auditLogs: [
              ...task.auditLogs,
              {
                id: `audit-${Date.now()}`,
                taskId,
                actor: demoUsers[0],
                action: "Edited task details",
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : task,
    );
    const updatedTask = updatedTasks.find((task) => task.id === taskId);

    if (!updatedTask) {
      throw new Error("Task not found");
    }

    setMockTasks(updatedTasks);
    return updatedTask;
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    await api.delete(`/tasks/${taskId}`);
  } catch {
    const task = mockTasks.find((item) => item.id === taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.status !== "DRAFT" && task.status !== "ASSIGNED") {
      throw new Error("Cannot delete task after work has started");
    }

    setMockTasks(mockTasks.filter((item) => item.id !== taskId));
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  note?: string,
): Promise<Task> {
  try {
    const response = await api.patch<Task>(`/tasks/${taskId}/status`, { status, note });
    return response.data;
  } catch {
    const existingTask = mockTasks.find((task) => task.id === taskId);

    if (!existingTask) {
      throw new Error("Task not found");
    }

    if (!isAllowedTransition(existingTask.status, status)) {
      throw new Error(`Invalid lifecycle transition from ${existingTask.status} to ${status}`);
    }

    if (
      status === "ASSIGNED" &&
      (existingTask.assignees.length === 0 || !existingTask.reviewingManager.id)
    ) {
      throw new Error("Assigned tasks require employees and a reviewing manager");
    }

    if (status === "REOPENED" && !note?.trim()) {
      throw new Error("Reopen comments are mandatory");
    }

    const commentType: TaskComment["type"] =
      status === "REOPENED" ? "REOPEN_COMMENT" : "REVIEW_NOTE";
    const actor = getTransitionActor(status);
    const updatedTasks = mockTasks.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      return {
        ...task,
        status,
        actualCompletionDate: status === "APPROVED" ? new Date().toISOString() : task.actualCompletionDate,
        comments: note
          ? [
              ...task.comments,
              {
                id: `comment-${Date.now()}`,
                taskId,
                author: actor,
                type: commentType,
                text: note,
                createdAt: new Date().toISOString(),
              },
            ]
          : task.comments,
        auditLogs: [
          ...task.auditLogs,
          {
            id: `audit-${Date.now()}`,
            taskId,
            actor,
            action: getTransitionAction(status),
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
    const updatedTask = updatedTasks.find((task) => task.id === taskId);

    if (!updatedTask) {
      throw new Error("Task not found");
    }

    setMockTasks(updatedTasks);
    if (status === "SUBMITTED" || status === "REOPENED" || status === "APPROVED") {
      setMockNotifications([
        {
          id: `notification-${Date.now()}`,
          event:
            status === "SUBMITTED"
              ? "TASK_SUBMITTED"
              : status === "REOPENED"
                ? "TASK_REOPENED"
                : "TASK_APPROVED",
          message: `${updatedTask.title} moved to ${status.replace("_", " ")}.`,
          taskId,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...mockNotifications,
      ]);
    }
    return updatedTask;
  }
}

export async function denyTask(taskId: string, reason: string): Promise<Task> {
  try {
    const response = await api.patch<Task>(`/tasks/${taskId}/deny`, { reason });
    return response.data;
  } catch {
    const updatedTask = await updateTaskStatus(taskId, "DENIED", reason);
    const updatedTasks = mockTasks.map((task) =>
      task.id === taskId ? { ...task, denialReason: reason } : task,
    );
    setMockTasks(updatedTasks);
    setMockNotifications([
      {
        id: `notification-${Date.now()}`,
        event: "TASK_DENIED",
        message: `${updatedTask.title} was denied: ${reason}`,
        taskId,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...mockNotifications,
    ]);
    return { ...updatedTask, denialReason: reason };
  }
}

export async function saveProgress(
  taskId: string,
  payload: ProgressPayload,
): Promise<Task> {
  try {
    const response = await api.patch<Task>(`/tasks/${taskId}/progress`, payload);
    return response.data;
  } catch {
    const updatedTasks = mockTasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            effortHours: payload.effortHours,
            effortLogs: [
              ...task.effortLogs,
              {
                id: `effort-${Date.now()}`,
                taskId,
                actor: demoUsers[1],
                hours: payload.effortHours,
                note: payload.notes,
                createdAt: new Date().toISOString(),
              },
            ],
            auditLogs: [
              ...task.auditLogs,
              {
                id: `audit-${Date.now()}`,
                taskId,
                actor: demoUsers[1],
                action: `Logged ${payload.effortHours} effort hours`,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : task,
    );
    const updatedTask = updatedTasks.find((task) => task.id === taskId);

    if (!updatedTask) {
      throw new Error("Task not found");
    }

    setMockTasks(updatedTasks);
    return updatedTask;
  }
}

export async function uploadAttachment(taskId: string, file: File): Promise<Task> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post<Task>(`/tasks/${taskId}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  } catch {
    const updatedTasks = mockTasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            attachments: [
              ...task.attachments,
              {
                id: `attachment-${Date.now()}`,
                taskId,
                fileUrl: file.name,
                uploadedBy: demoUsers[1],
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : task,
    );
    const updatedTask = updatedTasks.find((task) => task.id === taskId);

    if (!updatedTask) {
      throw new Error("Task not found");
    }

    setMockTasks(updatedTasks);
    return updatedTask;
  }
}

export async function getEmployees(): Promise<User[]> {
  try {
    const response = await api.get<User[]>("/users", { params: { role: "EMPLOYEE" } });
    return response.data;
  } catch {
    return demoUsers.filter((user) => user.role === "EMPLOYEE");
  }
}

export async function getManagers(): Promise<User[]> {
  try {
    const response = await api.get<User[]>("/users", { params: { role: "ADMIN" } });
    return response.data;
  } catch {
    return demoUsers.filter((user) => user.role === "ADMIN");
  }
}

export interface AddEmployeePayload {
  name: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  password?: string;
  title?: string;
}

export async function addEmployee(payload: AddEmployeePayload): Promise<User> {
  try {
    const response = await api.post<User>("/users", payload);
    return response.data;
  } catch {
    const emailLower = payload.email.trim().toLowerCase();
    const newUser: User = {
      id: `${payload.role.toLowerCase()}-${Date.now()}`,
      name: payload.name,
      email: emailLower,
      role: payload.role,
      title: payload.title as User["title"],
    };
    demoUsers.push(newUser);
    if (payload.password) {
      demoPasswords[emailLower] = payload.password;
    }
    return newUser;
  }
}

function filterTasks(tasks: Task[], filters?: TaskFilters): Task[] {
  return tasks.filter((task) => {
    const statusMatch =
      !filters?.status || filters.status === "ALL" || task.status === filters.status;
    const priorityMatch =
      !filters?.priority || filters.priority === "ALL" || task.priority === filters.priority;
    const employeeMatch =
      !filters?.employeeId ||
      task.assignees.some((assignee) => assignee.id === filters.employeeId);
    const dateFromMatch =
      !filters?.dateFrom || new Date(task.endDate) >= new Date(filters.dateFrom);
    const dateToMatch =
      !filters?.dateTo || new Date(task.endDate) <= new Date(filters.dateTo);

    return statusMatch && priorityMatch && employeeMatch && dateFromMatch && dateToMatch;
  });
}

function isAllowedTransition(from: TaskStatus, to: TaskStatus): boolean {
  const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
    DRAFT: ["ASSIGNED"],
    ASSIGNED: ["IN_PROGRESS", "DENIED"],
    IN_PROGRESS: ["SUBMITTED"],
    DENIED: [],
    SUBMITTED: ["APPROVED", "REOPENED"],
    APPROVED: [],
    REOPENED: ["SUBMITTED"],
  };

  return allowedTransitions[from].includes(to);
}

function getTransitionActor(status: TaskStatus): User {
  if (status === "IN_PROGRESS" || status === "DENIED" || status === "SUBMITTED") {
    return demoUsers[1];
  }

  return demoUsers[0];
}

function getTransitionAction(status: TaskStatus): string {
  const actions: Record<TaskStatus, string> = {
    DRAFT: "Created draft task",
    ASSIGNED: "Assigned task to employee with reviewing manager",
    IN_PROGRESS: "Employee accepted task",
    DENIED: "Employee denied task",
    SUBMITTED: "Employee submitted task for review",
    APPROVED: "Reviewing manager approved and closed task",
    REOPENED: "Reviewing manager reopened task with mandatory comments",
  };

  return actions[status];
}
