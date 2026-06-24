"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ClipboardList,
  Home,
  LogOut,
  Menu,
  PlusCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import { PushNotificationButton } from "@/components/notifications/PushNotificationButton";
import { clearAuth } from "@/store/authSlice";
import { setSidebarOpen } from "@/store/uiSlice";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth.service";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export function AppShell({
  children,
  navItems,
  title,
}: {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { dispatch, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      dispatch(clearAuth());
      router.replace("/login");
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 lg:block">
        <div className="text-lg font-bold text-primary">Task Assign</div>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-slate-100",
                pathname === item.href ? "bg-primary text-white" : "text-slate-700",
              )}
              href={item.href}
              key={item.href}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              aria-label="Open navigation"
              className="h-10 w-10 px-0 lg:hidden"
              icon={<Menu className="h-5 w-5" />}
              onClick={() => dispatch(setSidebarOpen(true))}
              type="button"
              variant="ghost"
            />
            <div>
              <h1 className="text-base font-semibold text-slate-950 sm:text-lg">{title}</h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                {user?.name}
                {user?.title ? (
                  <span className="ml-1 text-slate-400">· {user.title}</span>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PushNotificationButton />
            <NotificationDrawer />
            <Button
              aria-label="Logout"
              className="h-10 w-10 px-0"
              icon={<LogOut className="h-5 w-5" />}
              isLoading={isLoggingOut}
              onClick={handleLogout}
              type="button"
              variant="ghost"
            />
          </div>
        </header>
        <main className="px-4 py-6 pb-24 sm:px-6 lg:pb-6">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
        {navItems.slice(0, 4).map((item) => (
          <Link
            className={cn(
              "flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-semibold",
              pathname === item.href ? "text-primary" : "text-slate-500",
            )}
            href={item.href}
            key={item.href}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Home", icon: <Home className="h-4 w-4" /> },
  { href: "/admin/tasks", label: "Tasks", icon: <ClipboardList className="h-4 w-4" /> },
  { href: "/admin/tasks/create", label: "Create", icon: <PlusCircle className="h-4 w-4" /> },
  { href: "/admin/employees", label: "Team", icon: <Users className="h-4 w-4" /> },
];

export const employeeNavItems: NavItem[] = [
  { href: "/employee/dashboard", label: "Home", icon: <Home className="h-4 w-4" /> },
  { href: "/employee/tasks", label: "Tasks", icon: <ClipboardList className="h-4 w-4" /> },
];
