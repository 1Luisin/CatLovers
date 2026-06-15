import Constants, { ExecutionEnvironment } from "expo-constants";
import type * as ExpoNotifications from "expo-notifications";
import { Linking, Platform } from "react-native";
import {
  registerNotificationSubscription,
  unregisterNotificationSubscription,
} from "../../../services/apiClient";
import { getNotificationDeviceId } from "../../../services/storageService";
import type { NotificationPermissionState } from "../../../types";

const CHANNEL_ID = "catlovers";

type NotificationsModule = typeof ExpoNotifications;

let notificationsModule: NotificationsModule | undefined;
let notificationHandlerConfigured = false;

export const isExpoGoNotificationRuntime = () =>
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function getNotificationsModule() {
  if (isExpoGoNotificationRuntime()) {
    throw new Error("EXPO_GO_NOTIFICATIONS_UNSUPPORTED");
  }

  if (!notificationsModule) {
    notificationsModule =
      require("expo-notifications") as NotificationsModule;
  }

  if (!notificationHandlerConfigured) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return notificationsModule;
}

async function configureAndroidChannel() {
  if (Platform.OS !== "android") return;
  const Notifications = getNotificationsModule();
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "CatLovers",
    description: "Lembretes de planos, metas e memórias do casal.",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 180, 250],
    lightColor: "#C65D6C",
    sound: "default",
  });
}

function mapPermission(
  permission: ExpoNotifications.NotificationPermissionsStatus,
): NotificationPermissionState {
  if (permission.granted) return "granted";
  return permission.canAskAgain ? "prompt" : "blocked";
}

export async function getNativeNotificationPermission() {
  if (isExpoGoNotificationRuntime()) return "unsupported";
  const Notifications = getNotificationsModule();
  await configureAndroidChannel();
  return mapPermission(await Notifications.getPermissionsAsync());
}

async function getProjectId() {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error("Project ID do EAS não encontrado.");
  }
  return String(projectId);
}

export async function enableNativeNotifications(profileId: string) {
  if (isExpoGoNotificationRuntime()) return "unsupported";
  const Notifications = getNotificationsModule();
  await configureAndroidChannel();
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
  }
  const permissionState = mapPermission(permission);
  if (permissionState !== "granted") return permissionState;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: await getProjectId(),
  });
  await registerNotificationSubscription({
    deviceId: await getNotificationDeviceId(),
    profileId,
    platform: Platform.OS === "ios" ? "ios" : "android",
    expoPushToken: token.data,
  });
  return permissionState;
}

export async function disableNativeNotifications(profileId: string) {
  await unregisterNotificationSubscription(
    await getNotificationDeviceId(),
    profileId,
  );
}

export async function showNativeTestNotification() {
  const Notifications = getNotificationsModule();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "CatLovers",
      body: "Notificação ativa :3",
      sound: "default",
    },
    trigger: null,
  });
}

export const openNativeNotificationSettings = () => Linking.openSettings();
