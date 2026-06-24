# Task Assign Dashboard API Documentation

This document describes the backend APIs required by the current frontend.

Frontend base URL:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

After login, the frontend sends this header on authenticated requests:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

For file upload, the request uses:

```http
Content-Type: multipart/form-data
```

## Roles

```ts
type Role = "ADMIN" | "EMPLOYEE";
```

Admin/manager screens can create, assign, edit, delete, approve, and reopen tasks.
Employee screens can view assigned tasks, accept, deny, log progress, upload attachments, and submit for review.

## Common Response Rules

Successful responses should return JSON unless the endpoint is `DELETE`.

Recommended error format:

```json
{
  "message": "Human readable error message",
  "code": "OPTIONAL_ERROR_CODE",
  "errors": {
    "fieldName": "Field specific message"
  }
}
```

Recommended status codes:

| Status | Meaning |
| --- | --- |
| `200` | Success |
| `201` | Created |
| `204` | Deleted successfully |
| `400` | Validation or invalid lifecycle transition |
| `401` | Missing/invalid token |
| `403` | User role not allowed |
| `404` | Resource not found |
| `409` | Duplicate email or conflict |
| `500` | Server error |

## Data Models

### User

```json
{
  "id": "employee-1",
  "name": "Meera Employee",
  "email": "employee@test.com",
  "role": "EMPLOYEE",
  "title": "Software Developer"
}
```

Allowed `role` values:

```ts
"ADMIN" | "EMPLOYEE"
```

Allowed `title` values:

```ts
 "Intern"
 "Software Developer"
| "Software Associate"
| "DevOps Engineer"
| "QA Engineer"
| "UI/UX Designer"
| "Product Manager"
| "Project Manager"
| "Business Analyst"
```

`title` is optional.

### Task

```json
{
  "id": "task-1",
  "title": "Prepare onboarding checklist",
  "description": "Create a practical onboarding checklist for new dashboard users.",
  "goal": "Managers can assign consistent onboarding tasks to every new employee.",
  "startDate": "2026-06-20",
  "endDate": "2026-06-28",
  "actualCompletionDate": "2026-06-28T10:30:00.000Z",
  "assignedBy": {
    "id": "admin-1",
    "name": "Aarav Manager",
    "email": "admin@test.com",
    "role": "ADMIN",
    "title": "Project Manager"
  },
  "reviewingManager": {
    "id": "admin-1",
    "name": "Aarav Manager",
    "email": "admin@test.com",
    "role": "ADMIN",
    "title": "Project Manager"
  },
  "assignees": [],
  "effortHours": 2,
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "acceptanceCriteria": "Checklist includes setup, task flow, review flow, and support contact.",
  "denialReason": "Optional denial reason",
  "createdAt": "2026-06-20T09:00:00.000Z",
  "comments": [],
  "attachments": [],
  "auditLogs": [],
  "effortLogs": []
}
```

Allowed `status` values:

```ts
"DRAFT" | "ASSIGNED" | "IN_PROGRESS" | "DENIED" | "SUBMITTED" | "APPROVED" | "REOPENED"
```

Allowed `priority` values:

```ts
"LOW" | "MEDIUM" | "HIGH"
```

Dates:

- `startDate` and `endDate`: `YYYY-MM-DD`
- `createdAt`, `actualCompletionDate`: ISO date-time string

### Comment

```json
{
  "id": "comment-1",
  "taskId": "task-1",
  "author": {},
  "type": "GENERAL",
  "text": "Keep the checklist short enough for day-one use.",
  "createdAt": "2026-06-20T10:00:00.000Z"
}
```

Allowed `type` values:

```ts
"REOPEN_COMMENT" | "REVIEW_NOTE" | "GENERAL"
```

### Attachment

```json
{
  "id": "attachment-1",
  "taskId": "task-1",
  "fileUrl": "https://cdn.example.com/files/progress.png",
  "uploadedBy": {},
  "createdAt": "2026-06-21T09:30:00.000Z"
}
```

`fileUrl` should be a downloadable or viewable URL. The current UI displays it as the attachment name/link.

### AuditLog

```json
{
  "id": "audit-1",
  "taskId": "task-1",
  "actor": {},
  "action": "Employee accepted task",
  "createdAt": "2026-06-20T11:00:00.000Z"
}
```

### EffortLog

```json
{
  "id": "effort-1",
  "taskId": "task-1",
  "actor": {},
  "hours": 2,
  "note": "Initial checklist draft",
  "createdAt": "2026-06-21T09:30:00.000Z"
}
```

### Notification

```json
{
  "id": "notification-1",
  "event": "TASK_SUBMITTED",
  "message": "Fix submitted task review copy is ready for review.",
  "taskId": "task-2",
  "read": false,
  "createdAt": "2026-06-21T13:05:00.000Z"
}
```

Allowed `event` values:

```ts
"TASK_ASSIGNED"
| "TASK_DENIED"
| "TASK_OVERDUE_REMINDER"
| "TASK_OVERDUE_FLAG"
| "TASK_SUBMITTED"
| "TASK_APPROVED"
| "TASK_REOPENED"
```

## Auth APIs

### 1. Login

```http
POST /auth/login
```

Request:

```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

Validation:

- `email`: required, valid email
- `password`: required, minimum 6 characters

Response:

```json
{
  "token": "jwt_token_here"
}
```

Important: the frontend decodes the JWT and expects these fields inside the token payload:

```json
{
  "userId": "admin-1",
  "name": "Aarav Manager",
  "email": "admin@test.com",
  "role": "ADMIN",
  "exp": 1782200000
}
```

The decoded `role` must be either `ADMIN` or `EMPLOYEE`.

## User APIs

### 2. Get Users by Role

Used by:

- admin dashboard
- employees/team page
- task create/edit forms

```http
GET /users?role=EMPLOYEE
GET /users?role=ADMIN
```

Query params:

| Name | Required | Values |
| --- | --- | --- |
| `role` | Yes | `EMPLOYEE`, `ADMIN` |

Response:

```json
[
  {
    "id": "employee-1",
    "name": "Meera Employee",
    "email": "employee@test.com",
    "role": "EMPLOYEE",
    "title": "Software Developer"
  }
]
```

### 3. Create User / Add Team Member

```http
POST /users
```

Request:

```json
{
  "name": "Kabir Employee",
  "email": "kabir@test.com",
  "password": "secret123",
  "role": "EMPLOYEE",
  "title": "DevOps Engineer"
}
```

Validation:

- `name`: required, minimum 2 characters
- `email`: required, valid email, unique
- `password`: required in current frontend form, minimum 6 characters
- `role`: `EMPLOYEE` or `ADMIN`
- `title`: optional, must be one of the allowed titles

Response:

```json
{
  "id": "employee-2",
  "name": "Kabir Employee",
  "email": "kabir@test.com",
  "role": "EMPLOYEE",
  "title": "DevOps Engineer"
}
```

Do not return the password.

## Task APIs

### 4. Get All Tasks

Used by admin task list, admin dashboard, and team activity indicators.

```http
GET /tasks
```

Optional query params:

| Name | Values | Notes |
| --- | --- | --- |
| `status` | `ALL`, `DRAFT`, `ASSIGNED`, `IN_PROGRESS`, `DENIED`, `SUBMITTED`, `APPROVED`, `REOPENED` | If `ALL` or missing, return all statuses |
| `priority` | `ALL`, `LOW`, `MEDIUM`, `HIGH` | If `ALL` or missing, return all priorities |
| `employeeId` | user id | Return tasks where this user is an assignee |
| `dateFrom` | `YYYY-MM-DD` | Filter by `endDate >= dateFrom` |
| `dateTo` | `YYYY-MM-DD` | Filter by `endDate <= dateTo` |

Example:

```http
GET /tasks?status=IN_PROGRESS&priority=HIGH&employeeId=employee-1&dateFrom=2026-06-01&dateTo=2026-06-30
```

Response:

```json
[
  {
    "id": "task-1",
    "title": "Prepare onboarding checklist",
    "description": "Create a practical onboarding checklist for new dashboard users.",
    "goal": "Managers can assign consistent onboarding tasks to every new employee.",
    "startDate": "2026-06-20",
    "endDate": "2026-06-28",
    "assignedBy": {},
    "reviewingManager": {},
    "assignees": [],
    "effortHours": 2,
    "priority": "HIGH",
    "status": "IN_PROGRESS",
    "acceptanceCriteria": "Checklist includes account setup, first task flow, review flow, and support contact.",
    "createdAt": "2026-06-20T09:00:00.000Z",
    "comments": [],
    "attachments": [],
    "auditLogs": [],
    "effortLogs": []
  }
]
```

### 5. Get My Tasks

Used by employee dashboard and employee task board.

```http
GET /tasks/my
```

Backend should identify the employee from the bearer token and return only tasks assigned to that employee. Do not return `DRAFT` tasks to employees.

Response:

```json
[
  {
    "id": "task-4",
    "title": "Accept assigned QA checklist",
    "status": "ASSIGNED",
    "priority": "MEDIUM",
    "startDate": "2026-06-22",
    "endDate": "2026-06-30",
    "assignedBy": {},
    "reviewingManager": {},
    "assignees": [],
    "description": "Go through the QA checklist and accept or deny the task.",
    "goal": "Employee can confirm ownership before work begins.",
    "acceptanceCriteria": "Employee accepts the task and records first progress notes.",
    "createdAt": "2026-06-22T07:00:00.000Z",
    "comments": [],
    "attachments": [],
    "auditLogs": [],
    "effortLogs": []
  }
]
```

### 6. Get Task by ID

```http
GET /tasks/{taskId}
```

Response:

```json
{
  "id": "task-1",
  "title": "Prepare onboarding checklist",
  "description": "Create a practical onboarding checklist for new dashboard users.",
  "goal": "Managers can assign consistent onboarding tasks to every new employee.",
  "startDate": "2026-06-20",
  "endDate": "2026-06-28",
  "assignedBy": {},
  "reviewingManager": {},
  "assignees": [],
  "effortHours": 2,
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "acceptanceCriteria": "Checklist includes account setup, first task flow, review flow, and support contact.",
  "createdAt": "2026-06-20T09:00:00.000Z",
  "comments": [],
  "attachments": [],
  "auditLogs": [],
  "effortLogs": []
}
```

Authorization:

- `ADMIN`: can view all tasks
- `EMPLOYEE`: should only view tasks assigned to them

### 7. Create Task

```http
POST /tasks
```

Request for assigned task:

```json
{
  "title": "Prepare onboarding checklist",
  "description": "Create a practical onboarding checklist for new dashboard users.",
  "goal": "Managers can assign consistent onboarding tasks to every new employee.",
  "startDate": "2026-06-20",
  "endDate": "2026-06-28",
  "priority": "HIGH",
  "acceptanceCriteria": "Checklist includes account setup, first task flow, review flow, and support contact.",
  "assigneeIds": ["employee-1", "employee-2"],
  "reviewingManagerId": "admin-1",
  "status": "ASSIGNED"
}
```

Request for draft:

```json
{
  "title": "Draft quarterly task plan",
  "description": "Outline the next set of assignments before publishing them.",
  "goal": "Managers can prepare tasks before assigning them.",
  "startDate": "2026-06-22",
  "endDate": "2026-07-05",
  "priority": "LOW",
  "acceptanceCriteria": "Draft includes title, goal, assignees, priority, and review owner.",
  "assigneeIds": [],
  "reviewingManagerId": "",
  "status": "DRAFT"
}
```

Validation:

- `title`: minimum 3 characters
- `description`: minimum 10 characters
- `goal`: minimum 5 characters
- `startDate`: required
- `endDate`: required
- `priority`: `LOW`, `MEDIUM`, `HIGH`
- `acceptanceCriteria`: minimum 10 characters
- `assigneeIds`: array of user ids
- `reviewingManagerId`: user id
- `status`: `DRAFT` or `ASSIGNED`
- If `status` is `ASSIGNED`, `assigneeIds` must contain at least one employee and `reviewingManagerId` is required.

Response: created `Task`.

Expected backend side effects:

- Set `assignedBy` from current admin token.
- Create an audit log.
- If status is `ASSIGNED`, create task assignment notification(s).

### 8. Update Task

```http
PUT /tasks/{taskId}
```

Request:

```json
{
  "title": "Prepare onboarding checklist",
  "description": "Create a practical onboarding checklist for new dashboard users.",
  "goal": "Managers can assign consistent onboarding tasks to every new employee.",
  "startDate": "2026-06-20",
  "endDate": "2026-06-28",
  "priority": "HIGH",
  "acceptanceCriteria": "Checklist includes account setup, first task flow, review flow, and support contact.",
  "assigneeIds": ["employee-1"],
  "reviewingManagerId": "admin-1"
}
```

Response: updated `Task`.

Expected backend side effects:

- Update task fields.
- Replace assignees from `assigneeIds`.
- Replace reviewing manager from `reviewingManagerId`.
- Add audit log: `Edited task details`.

### 9. Delete Task

```http
DELETE /tasks/{taskId}
```

Rules:

- Only admin can delete.
- Current frontend enables delete only for `DRAFT` and `ASSIGNED`.
- Backend should reject deleting tasks after work has started.

Response:

```http
204 No Content
```

### 10. Update Task Status

```http
PATCH /tasks/{taskId}/status
```

Request:

```json
{
  "status": "IN_PROGRESS",
  "note": "Optional note"
}
```

`note` is required when changing to `REOPENED`.

Allowed transitions:

| From | To |
| --- | --- |
| `DRAFT` | `ASSIGNED` |
| `ASSIGNED` | `IN_PROGRESS`, `DENIED` |
| `IN_PROGRESS` | `SUBMITTED` |
| `SUBMITTED` | `APPROVED`, `REOPENED` |
| `REOPENED` | `SUBMITTED` |
| `DENIED` | No next status in current UI |
| `APPROVED` | No next status in current UI |

Frontend actions using this endpoint:

| Screen | Action | Request |
| --- | --- | --- |
| Admin task detail | Assign draft | `{ "status": "ASSIGNED" }` |
| Admin task detail | Approve submitted task | `{ "status": "APPROVED" }` |
| Admin task detail | Reopen submitted task | `{ "status": "REOPENED", "note": "Please add mobile screenshot." }` |
| Employee task detail/board | Accept assigned task | `{ "status": "IN_PROGRESS" }` |
| Employee task detail/board | Submit for review | `{ "status": "SUBMITTED" }` |

Response: updated `Task`.

Expected backend side effects:

- Add audit log for every status change.
- If status is `REOPENED`, add a comment with type `REOPEN_COMMENT` using `note`.
- If status is `APPROVED`, set `actualCompletionDate`.
- Create notifications for important events: submitted, reopened, approved, assigned.

### 11. Deny Task

```http
PATCH /tasks/{taskId}/deny
```

Request:

```json
{
  "reason": "The requirements are unclear and need manager clarification."
}
```

Validation:

- `reason`: required, minimum 10 characters
- Task should currently be `ASSIGNED`
- Only an assigned employee should deny

Response: updated `Task` with:

```json
{
  "status": "DENIED",
  "denialReason": "The requirements are unclear and need manager clarification."
}
```

Expected backend side effects:

- Set task status to `DENIED`.
- Save `denialReason`.
- Add audit log.
- Add notification with event `TASK_DENIED`.

### 12. Save Progress / EOD Update

```http
PATCH /tasks/{taskId}/progress
```

Request:

```json
{
  "notes": "Completed the checklist draft and reviewed the first flow.",
  "effortHours": 2.5
}
```

Validation:

- `notes`: string, recommended required
- `effortHours`: number, minimum `0`, supports decimals such as `0.25`
- Task should be `IN_PROGRESS` or `REOPENED`
- Only assigned employee should save progress

Response: updated `Task`.

Expected backend side effects:

- Add an `EffortLog`.
- Update task-level `effortHours`. The frontend currently displays this as total/logged hours. Prefer storing cumulative total.
- Add audit log like `Logged 2.5 effort hours`.

### 13. Upload Attachment

```http
POST /tasks/{taskId}/attachments
```

Request:

```http
Content-Type: multipart/form-data
```

Form fields:

| Field | Type | Required |
| --- | --- | --- |
| `file` | File | Yes |

Response: updated `Task`.

Expected backend side effects:

- Store file.
- Add attachment record to task.
- `fileUrl` should be a usable URL or stable file path/name.
- Set `uploadedBy` from current user token.

## Notification APIs

### 14. Get Notifications

The notification drawer refetches every 30 seconds.

```http
GET /notifications
```

Response:

```json
[
  {
    "id": "notification-1",
    "event": "TASK_SUBMITTED",
    "message": "Fix submitted task review copy is ready for review.",
    "taskId": "task-2",
    "read": false,
    "createdAt": "2026-06-21T13:05:00.000Z"
  }
]
```

Backend should return notifications relevant to the logged-in user.

### 15. Mark Notification Read

```http
PATCH /notifications/{notificationId}/read
```

Request body: none.

Response:

```json
{
  "id": "notification-1",
  "event": "TASK_SUBMITTED",
  "message": "Fix submitted task review copy is ready for review.",
  "taskId": "task-2",
  "read": true,
  "createdAt": "2026-06-21T13:05:00.000Z"
}
```

## Dashboard APIs

No separate dashboard endpoints are required for the current frontend.

The admin dashboard calculates counts from:

- `GET /tasks`
- `GET /users?role=EMPLOYEE`
- `GET /users?role=ADMIN`

The employee dashboard calculates counts from:

- `GET /tasks/my`

Optional future optimization:

```http
GET /dashboard/admin/summary
GET /dashboard/employee/summary
```

These are not required unless task volume becomes large.

## Full Required Endpoint List

| Method | Endpoint | Auth | Used For |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Login |
| `GET` | `/users?role=EMPLOYEE` | Admin | Employee list and task assignment |
| `GET` | `/users?role=ADMIN` | Admin | Manager list and review owner selection |
| `POST` | `/users` | Admin | Add team member |
| `GET` | `/tasks` | Admin | Task list, dashboard, team activity |
| `GET` | `/tasks/my` | Employee | Employee dashboard and task board |
| `GET` | `/tasks/{taskId}` | Admin/assigned employee | Task detail |
| `POST` | `/tasks` | Admin | Create draft or assigned task |
| `PUT` | `/tasks/{taskId}` | Admin | Edit task |
| `DELETE` | `/tasks/{taskId}` | Admin | Delete draft/assigned task |
| `PATCH` | `/tasks/{taskId}/status` | Admin/employee based on action | Assign, accept, submit, approve, reopen |
| `PATCH` | `/tasks/{taskId}/deny` | Assigned employee | Deny assigned task |
| `PATCH` | `/tasks/{taskId}/progress` | Assigned employee | Save daily progress |
| `POST` | `/tasks/{taskId}/attachments` | Assigned employee | Upload progress attachment |
| `GET` | `/notifications` | Authenticated | Notification drawer |
| `PATCH` | `/notifications/{notificationId}/read` | Authenticated | Mark notification read |

## Backend Implementation Notes

- JWT must contain `userId`, `name`, `email`, `role`, and `exp` because the frontend decodes these after login.
- Return full nested `User` objects in `Task.assignedBy`, `Task.reviewingManager`, `Task.assignees`, `comments.author`, `attachments.uploadedBy`, `auditLogs.actor`, and `effortLogs.actor`.
- Keep date strings consistent. Use `YYYY-MM-DD` for task dates and ISO strings for event timestamps.
- Enforce role permissions on the backend. The frontend hides actions, but the API must still validate them.
- The frontend currently has mock fallback data. Once the backend is connected and `NEXT_PUBLIC_API_URL` is set, successful API responses will be used.
