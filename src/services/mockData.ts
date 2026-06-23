import type { Notification } from "@/types/notification.types";
import type { Task } from "@/types/task.types";
import type { User } from "@/types/user.types";

export const demoUsers: User[] = [
  {
    id: "admin-1",
    name: "Aarav Manager",
    email: "admin@test.com",
    role: "ADMIN",
  },
  {
    id: "employee-1",
    name: "Meera Employee",
    email: "employee@test.com",
    role: "EMPLOYEE",
  },
  {
    id: "employee-2",
    name: "Kabir Employee",
    email: "kabir@test.com",
    role: "EMPLOYEE",
  },
];

export const demoPasswords: Record<string, string> = {
  "admin@test.com": "admin123",
  "employee@test.com": "employee123",
};

export let mockTasks: Task[] = [
  {
    id: "task-0",
    title: "Draft quarterly task plan",
    description: "Outline the next set of assignments before publishing them to employees.",
    goal: "Managers can prepare tasks before assigning them.",
    startDate: "2026-06-22",
    endDate: "2026-07-05",
    assignedBy: demoUsers[0],
    reviewingManager: demoUsers[0],
    assignees: [demoUsers[1], demoUsers[2]],
    priority: "LOW",
    status: "DRAFT",
    acceptanceCriteria: "Draft includes title, goal, assignees, priority, and review owner.",
    createdAt: "2026-06-22T06:00:00.000Z",
    comments: [],
    attachments: [],
    auditLogs: [
      {
        id: "audit-0",
        taskId: "task-0",
        actor: demoUsers[0],
        action: "Created draft task",
        createdAt: "2026-06-22T06:00:00.000Z",
      },
    ],
    effortLogs: [],
  },
  {
    id: "task-1",
    title: "Prepare onboarding checklist",
    description: "Create a practical onboarding checklist for new dashboard users.",
    goal: "Managers can assign consistent onboarding tasks to every new employee.",
    startDate: "2026-06-20",
    endDate: "2026-06-28",
    assignedBy: demoUsers[0],
    reviewingManager: demoUsers[0],
    assignees: [demoUsers[1]],
    effortHours: 2,
    priority: "HIGH",
    status: "IN_PROGRESS",
    acceptanceCriteria: "Checklist includes account setup, first task flow, review flow, and support contact.",
    createdAt: "2026-06-20T09:00:00.000Z",
    comments: [
      {
        id: "comment-1",
        taskId: "task-1",
        author: demoUsers[0],
        type: "GENERAL",
        text: "Keep the checklist short enough for day-one use.",
        createdAt: "2026-06-20T10:00:00.000Z",
      },
    ],
    attachments: [],
    auditLogs: [
      {
        id: "audit-1",
        taskId: "task-1",
        actor: demoUsers[0],
        action: "Assigned task",
        createdAt: "2026-06-20T09:00:00.000Z",
      },
      {
        id: "audit-2",
        taskId: "task-1",
        actor: demoUsers[1],
        action: "Accepted task",
        createdAt: "2026-06-20T11:00:00.000Z",
      },
    ],
    effortLogs: [
      {
        id: "effort-1",
        taskId: "task-1",
        actor: demoUsers[1],
        hours: 2,
        note: "Initial checklist draft",
        createdAt: "2026-06-21T09:30:00.000Z",
      },
    ],
  },
  {
    id: "task-2",
    title: "Fix submitted task review copy",
    description: "Review the wording on task approval and reopen actions.",
    goal: "Admin review screens should feel clear and action-oriented.",
    startDate: "2026-06-18",
    endDate: "2026-06-23",
    assignedBy: demoUsers[0],
    reviewingManager: demoUsers[0],
    assignees: [demoUsers[1], demoUsers[2]],
    effortHours: 4,
    priority: "MEDIUM",
    status: "SUBMITTED",
    acceptanceCriteria: "Approval, reopen, and comment labels are understandable without training.",
    createdAt: "2026-06-18T11:00:00.000Z",
    comments: [
      {
        id: "comment-2",
        taskId: "task-2",
        author: demoUsers[1],
        type: "GENERAL",
        text: "Submitted the first copy pass for review.",
        createdAt: "2026-06-21T13:00:00.000Z",
      },
    ],
    attachments: [],
    auditLogs: [
      {
        id: "audit-3",
        taskId: "task-2",
        actor: demoUsers[0],
        action: "Assigned task",
        createdAt: "2026-06-18T11:00:00.000Z",
      },
      {
        id: "audit-4",
        taskId: "task-2",
        actor: demoUsers[1],
        action: "Submitted task for review",
        createdAt: "2026-06-21T13:00:00.000Z",
      },
    ],
    effortLogs: [
      {
        id: "effort-2",
        taskId: "task-2",
        actor: demoUsers[1],
        hours: 4,
        note: "Reviewed approval and reopen copy",
        createdAt: "2026-06-21T12:45:00.000Z",
      },
    ],
  },
  {
    id: "task-3",
    title: "Upload daily progress screenshots",
    description: "Capture progress screenshots from the employee task workflow.",
    goal: "Give managers visible proof of work before final submission.",
    startDate: "2026-06-16",
    endDate: "2026-06-21",
    assignedBy: demoUsers[0],
    reviewingManager: demoUsers[0],
    assignees: [demoUsers[1]],
    priority: "LOW",
    status: "REOPENED",
    acceptanceCriteria: "At least three screenshots are attached with a short progress note.",
    createdAt: "2026-06-16T12:00:00.000Z",
    comments: [
      {
        id: "comment-3",
        taskId: "task-3",
        author: demoUsers[0],
        type: "REOPEN_COMMENT",
        text: "Please add the missing mobile screenshot before resubmitting.",
        createdAt: "2026-06-21T15:00:00.000Z",
      },
    ],
    attachments: [],
    auditLogs: [
      {
        id: "audit-5",
        taskId: "task-3",
        actor: demoUsers[0],
        action: "Reopened task with comments",
        createdAt: "2026-06-21T15:00:00.000Z",
      },
    ],
    effortLogs: [],
  },
  {
    id: "task-4",
    title: "Accept assigned QA checklist",
    description: "Go through the QA checklist and accept or deny the task.",
    goal: "Employee can confirm ownership before work begins.",
    startDate: "2026-06-22",
    endDate: "2026-06-30",
    assignedBy: demoUsers[0],
    reviewingManager: demoUsers[0],
    assignees: [demoUsers[1]],
    priority: "MEDIUM",
    status: "ASSIGNED",
    acceptanceCriteria: "Employee accepts the task and records first progress notes.",
    createdAt: "2026-06-22T07:00:00.000Z",
    comments: [],
    attachments: [],
    auditLogs: [
      {
        id: "audit-6",
        taskId: "task-4",
        actor: demoUsers[0],
        action: "Assigned task",
        createdAt: "2026-06-22T07:00:00.000Z",
      },
    ],
    effortLogs: [],
  },
];

export let mockNotifications: Notification[] = [
  {
    id: "notification-1",
    event: "TASK_SUBMITTED",
    message: "Fix submitted task review copy is ready for review.",
    taskId: "task-2",
    read: false,
    createdAt: "2026-06-21T13:05:00.000Z",
  },
  {
    id: "notification-2",
    event: "TASK_REOPENED",
    message: "Upload daily progress screenshots was reopened.",
    taskId: "task-3",
    read: false,
    createdAt: "2026-06-21T15:05:00.000Z",
  },
  {
    id: "notification-3",
    event: "TASK_DENIED",
    message: "Accept assigned QA checklist was denied with a reason.",
    taskId: "task-4",
    read: true,
    createdAt: "2026-06-22T08:05:00.000Z",
  },
  {
    id: "notification-4",
    event: "TASK_OVERDUE_REMINDER",
    message: "Reminder: Accept or deny your assigned QA checklist.",
    taskId: "task-4",
    read: false,
    createdAt: "2026-06-22T09:05:00.000Z",
  },
];

export function findDemoUser(email: string, password: string): User | null {
  const normalizedEmail = email.trim().toLowerCase();
  const expectedPassword = demoPasswords[normalizedEmail];

  if (!expectedPassword || expectedPassword !== password) {
    return null;
  }

  return demoUsers.find((user) => user.email === normalizedEmail) ?? null;
}

export function createDemoToken(user: User): string {
  const header = encodeBase64Url({ alg: "none", typ: "JWT" });
  const payload = encodeBase64Url({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  });

  return `${header}.${payload}.demo`;
}

export function setMockTasks(nextTasks: Task[]): void {
  mockTasks = nextTasks;
}

export function setMockNotifications(nextNotifications: Notification[]): void {
  mockNotifications = nextNotifications;
}

function encodeBase64Url(value: unknown): string {
  const json = JSON.stringify(value);
  const base64 =
    typeof window === "undefined"
      ? Buffer.from(json).toString("base64")
      : window.btoa(json);

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}
