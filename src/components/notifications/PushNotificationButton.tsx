"use client";

import { BellRing, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  subscribeToPush,
  unsubscribeFromPush,
  type WebPushSubscriptionPayload,
} from "@/services/push.service";

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bytes = window.atob(base64);
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

export function PushNotificationButton() {
  const [subscribed, setSubscribed] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    if (!supported) {
      return;
    }

    void navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => setSubscribed(Boolean(subscription)));
  }, [supported]);

  async function togglePush() {
    if (!supported) {
      return;
    }

    setIsPending(true);
    try {
      const registration =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js"));
      const currentSubscription =
        await registration.pushManager.getSubscription();

      if (currentSubscription) {
        await unsubscribeFromPush();
        await currentSubscription.unsubscribe();
        setSubscribed(false);
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await subscribeToPush(
        subscription.toJSON() as WebPushSubscriptionPayload,
      );
      setSubscribed(true);
    } finally {
      setIsPending(false);
    }
  }

  if (!supported || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return null;
  }

  return (
    <Button
      aria-label={
        subscribed ? "Disable push notifications" : "Enable push notifications"
      }
      className="h-10 w-10 px-0"
      icon={
        subscribed ? (
          <BellOff className="h-5 w-5" />
        ) : (
          <BellRing className="h-5 w-5" />
        )
      }
      isLoading={isPending}
      onClick={togglePush}
      title={subscribed ? "Disable push notifications" : "Enable push notifications"}
      type="button"
      variant="ghost"
    />
  );
}
