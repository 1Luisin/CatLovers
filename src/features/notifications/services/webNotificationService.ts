import {
  getWebPushPublicKey,
  registerNotificationSubscription,
  unregisterNotificationSubscription,
} from "../../../services/apiClient";
import { getNotificationDeviceId } from "../../../services/storageService";
import type { NotificationPermissionState } from "../../../types";

function supported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function permissionState(): NotificationPermissionState {
  if (!supported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "blocked";
  return "prompt";
}

function decodeApplicationServerKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = window.atob(normalized);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

async function serviceWorkerRegistration() {
  const registration = await navigator.serviceWorker.register(
    "/notification-sw.js",
  );
  await navigator.serviceWorker.ready;
  return registration;
}

export async function getWebNotificationPermission() {
  return permissionState();
}

export async function enableWebNotifications(profileId: string) {
  if (!supported()) return "unsupported" as const;
  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return permissionState();

  const registration = await serviceWorkerRegistration();
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeApplicationServerKey(
        await getWebPushPublicKey(),
      ),
    }));
  const serialized = subscription.toJSON();
  await registerNotificationSubscription({
    deviceId: await getNotificationDeviceId(),
    profileId,
    platform: "web",
    webPushSubscription: {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: serialized.keys,
    },
  });
  return "granted" as const;
}

export async function disableWebNotifications(profileId: string) {
  await unregisterNotificationSubscription(
    await getNotificationDeviceId(),
    profileId,
  );
}

export async function showWebTestNotification() {
  if (Notification.permission !== "granted") return;
  const registration = await serviceWorkerRegistration();
  await registration.showNotification("CatLovers", {
    body: "Notificação ativa :3",
    icon: "/favicon.ico",
  });
}

export function explainWebNotificationSettings() {
  window.alert(
    "Abra as configurações deste site no navegador e permita Notificações. " +
      "Normalmente essa opção fica no ícone ao lado do endereço da página.",
  );
}
