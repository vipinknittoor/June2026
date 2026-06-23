"use client";

import type { ReactNode } from "react";
import { AppShell, adminNavItems } from "@/components/layout/AppShell";
import { Spinner } from "@/components/ui/Spinner";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { allowed } = useRoleGuard("ADMIN");

  if (!allowed) {
    return <Spinner label="Checking access" />;
  }

  return (
    <AppShell navItems={adminNavItems} title="Admin Workspace">
      {children}
    </AppShell>
  );
}
