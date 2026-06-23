"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Role } from "@/types/user.types";
import { useAuth } from "./useAuth";

export function useRoleGuard(requiredRole: Role) {
  const router = useRouter();
  const { role, token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    if (role && role !== requiredRole) {
      router.replace(role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard");
    }
  }, [requiredRole, role, router, token]);

  return { allowed: Boolean(token && role === requiredRole) };
}
