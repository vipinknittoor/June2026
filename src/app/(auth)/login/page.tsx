"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { jwtDecode } from "jwt-decode";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { login } from "@/services/auth.service";
import { setCredentials } from "@/store/authSlice";
import { loginSchema, type LoginFormValues } from "@/schemas/login.schema";
import type { Role, User } from "@/types/user.types";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface DecodedToken {
  userId: string;
  name?: string;
  email?: string;
  role: Role;
  exp: number;
}

export default function LoginPage() {
  const router = useRouter();
  const { dispatch } = useAuth();
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "EMPLOYEE">("ADMIN");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@test.com",
      password: "admin123",
    },
  });

  const handleRoleChange = (role: "ADMIN" | "EMPLOYEE") => {
    setError("");
    setSelectedRole(role);
    if (role === "ADMIN") {
      setValue("email", "admin@test.com");
      setValue("password", "admin123");
    } else {
      setValue("email", "employee@test.com");
      setValue("password", "employee123");
    }
  };

  async function onSubmit(values: LoginFormValues) {
    setError("");

    try {
      const response = await login(values);
      const decoded = jwtDecode<DecodedToken>(response.token);

      if (decoded.role !== selectedRole) {
        setError(
          `This account is not registered as ${
            selectedRole === "ADMIN" ? "an Admin/Manager" : "an Employee"
          }.`
        );
        return;
      }

      const user: User = {
        id: decoded.userId,
        name: decoded.name ?? values.email.split("@")[0],
        email: decoded.email ?? values.email,
        role: decoded.role,
      };

      dispatch(setCredentials({ token: response.token, user, role: decoded.role }));
      router.replace(decoded.role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard");
    } catch {
      setError("Unable to sign in. Check your email and password.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
      >
        <Card>
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">
              Task Assign Dashboard
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Sign in</h1>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleRoleChange("ADMIN")}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                selectedRole === "ADMIN"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Admin / Manager
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("EMPLOYEE")}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                selectedRole === "EMPLOYEE"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Employee
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <Input
              autoComplete="email"
              error={errors.email?.message}
              label="Email"
              type="email"
              {...register("email")}
            />
            <Input
              autoComplete="current-password"
              error={errors.password?.message}
              label="Password"
              type="password"
              {...register("password")}
            />
            {error ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}
            <Button
              className="w-full"
              icon={<LogIn className="h-4 w-4" />}
              isLoading={isSubmitting}
              type="submit"
            >
              Sign in as {selectedRole === "ADMIN" ? "Admin" : "Employee"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </main>
  );
}
