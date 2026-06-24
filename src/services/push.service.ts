import { api } from "@/lib/axios";

export interface WebPushSubscriptionPayload {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export async function subscribeToPush(
  subscription: WebPushSubscriptionPayload,
): Promise<void> {
  await api.post("/push/subscribe", subscription);
}

export async function unsubscribeFromPush(): Promise<void> {
  await api.delete("/push/subscribe");
}
