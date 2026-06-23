import { z } from "zod";

export const denialSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

export const reopenSchema = z.object({
  comment: z.string().min(10, "Comment must be at least 10 characters"),
});

export type DenialFormValues = z.infer<typeof denialSchema>;
export type ReopenFormValues = z.infer<typeof reopenSchema>;
