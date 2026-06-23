import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  goal: z.string().min(5, "Goal must be at least 5 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  acceptanceCriteria: z.string().min(10, "Acceptance criteria must be clear"),
  assigneeIds: z.array(z.string()),
  reviewingManagerId: z.string(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
