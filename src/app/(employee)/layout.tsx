"use client";

import type { ReactNode } from "react";
import { AppShell, employeeNavItems } from "@/components/layout/AppShell";
import { Spinner } from "@/components/ui/Spinner";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const { allowed } = useRoleGuard("EMPLOYEE");

  if (!allowed) {
    return <Spinner label="Checking access" />;
  }

  return (
    <AppShell navItems={employeeNavItems} title="Employee Workspace">
      {children}
    </AppShell>
  );
}
