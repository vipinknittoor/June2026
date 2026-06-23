import { api } from "@/lib/axios";
import type { Notification } from "@/types/notification.types";
import { mockNotifications, setMockNotifications } from "./mockData";

export async function getNotifications(): Promise<Notification[]> {
  try {
    const response = await api.get<Notification[]>("/notifications");
    return response.data;
  } catch {
    return mockNotifications;
  }
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  try {
    const response = await api.patch<Notification>(`/notifications/${notificationId}/read`);
    return response.data;
  } catch {
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
