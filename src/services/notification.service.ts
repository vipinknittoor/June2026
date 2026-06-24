import { api, type ApiResponse, unwrapApiData } from "@/lib/axios";
import type { Notification } from "@/types/notification.types";
import { mockNotifications, setMockNotifications } from "./mockData";

export async function getNotifications(): Promise<Notification[]> {
  try {
    const response = await api.get<ApiResponse<Notification[]>>("/notifications");
    return unwrapApiData(response);
  } catch (error) {
    requireMockMode(error);
    return mockNotifications;
  }
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  try {
    const response = await api.patch<ApiResponse<Notification>>(
      `/notifications/${notificationId}/read`,
    );
    return unwrapApiData(response);
  } catch (error) {
    requireMockMode(error);
    const updatedNotifications = mockNotifications.map((notification) =>
      notification.id === notificationId ? { ...notification, read: true } : notification,
    );
    const updatedNotification = updatedNotifications.find(
      (notification) => notification.id === notificationId,
    );

    if (!updatedNotification) {
      throw new Error("Notification not found");
    }

    setMockNotifications(updatedNotifications);
    return updatedNotification;
  }
}

export async function markAllNotificationsRead(): Promise<{ count: number }> {
  try {
    const response = await api.patch<ApiResponse<{ count: number }>>(
      "/notifications/read",
    );
    return unwrapApiData(response);
  } catch (error) {
    requireMockMode(error);
    const count = mockNotifications.filter((notification) => !notification.read).length;
    setMockNotifications(
      mockNotifications.map((notification) => ({ ...notification, read: true })),
    );
    return { count };
  }
}

function requireMockMode(error: unknown): void {
  if (process.env.NEXT_PUBLIC_ENABLE_MOCKS !== "true") {
    throw error;
  }
}
