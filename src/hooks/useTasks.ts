"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addEmployee,
  createTask,
  deleteTask,
  denyTask,
  getEmployees,
  getManagers,
  getMyTasks,
  getTask,
  getTasks,
  saveProgress,
  updateTask,
  updateTaskStatus,
  uploadAttachment,
  type CreateTaskPayload,
  type ProgressPayload,
  type TaskFilters,
} from "@/services/task.service";
import type { TaskStatus } from "@/types/task.types";
import type { TaskFormValues } from "@/schemas/task.schema";

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => getTasks(filters),
  });
}

export function useMyTasks() {
  return useQuery({
    queryKey: ["tasks", "my"],
    queryFn: getMyTasks,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(taskId),
    enabled: Boolean(taskId),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TaskFormValues) => updateTask(taskId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useTaskStatusMutation(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ status, note }: { status: TaskStatus; note?: string }) =>
      updateTaskStatus(taskId, status, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDenyTask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason: string) => denyTask(taskId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useSaveProgress(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProgressPayload) => saveProgress(taskId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });
}

export function useUploadAttachment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadAttachment(taskId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });
}

export function useEmployees() {
  return useQuery({
    queryKey: ["users", "employees"],
    queryFn: getEmployees,
  });
}

export function useManagers() {
  return useQuery({
    queryKey: ["users", "managers"],
    queryFn: getManagers,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; email: string; role: "EMPLOYEE" | "ADMIN"; password?: string }) =>
      addEmployee(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users", "employees"] });
      void queryClient.invalidateQueries({ queryKey: ["users", "managers"] });
    },
  });
}
