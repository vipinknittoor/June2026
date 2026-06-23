"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { role, token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    router.replace(role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard");
  }, [role, router, token]);

  return <Spinner label="Opening dashboard" />;
}
