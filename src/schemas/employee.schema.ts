import { z } from "zod";
import { USER_TITLES } from "@/types/user.types";

export const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["EMPLOYEE", "ADMIN"]),
  title: z.enum(USER_TITLES as [string, ...string[]]).optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

