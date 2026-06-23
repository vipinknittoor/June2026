export type Role = "ADMIN" | "EMPLOYEE";

export type UserTitle =
  | "Software Developer"
  | "Software Associate"
  | "DevOps Engineer"
  | "QA Engineer"
  | "UI/UX Designer"
  | "Product Manager"
  | "Project Manager"
  | "Business Analyst";

export const USER_TITLES: UserTitle[] = [
  "Software Developer",
  "Software Associate",
  "DevOps Engineer",
  "QA Engineer",
  "UI/UX Designer",
  "Product Manager",
  "Project Manager",
  "Business Analyst",
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title?: UserTitle;
}
