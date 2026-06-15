import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import type {
  NotificationPermissionState,
  NotificationUiState,
  Profile,
} from "../../../types";
import {
  disableNativeNotifications,
  enableNativeNotifications,
  getNativeNotificationPermission,
  openNativeNotificationSettings,
  showNativeTestNotification,
} from "../services/nativeNotificationService";

export function useNativeNotifications(
  profile: Profile | undefined,
  saveProfile: (profile: Profile, settingsOnly?: boolean) => Promise<void>,
): NotificationUiState {
  const [permissionState, setPermissionState] =
    useState<NotificationPermissionState>("loading");
  const [busy, setBusy] = useState(false);
  const [activationAttempted, setActivationAttempted] = useState(false);

  const refreshPermission = useCallback(async () => {
    const next = await getNativeNotificationPermission();
    setPermissionState(next);
    if (next === "granted" && profile?.notifications) {
      void enableNativeNotifications(profile.id).catch(() => undefined);
    }
    return next;
  }, [profile?.id, profile?.notifications]);

  useEffect(() => {
    void refreshPermission().catch(() => setPermissionState("unsupported"));
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshPermission().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      if (!profile || busy) return;
      setBusy(true);
      try {
        if (!enabled) {
          setActivationAttempted(false);
          await disableNativeNotifications(profile.id);
          await saveProfile({ ...profile, notifications: false }, true);
          return;
        }

        setActivationAttempted(true);
        const next = await enableNativeNotifications(profile.id);
        setPermissionState(next);
        if (next !== "granted") {
          Alert.alert(
            "Permissão necessária",
            `Ative as notificações nas configurações ${
              Platform.OS === "ios" ? "do iPhone" : "do Android"
            }.`,
            [
              { text: "Agora não", style: "cancel" },
              {
                text: "Abrir configurações",
                onPress: () => void openNativeNotificationSettings(),
              },
            ],
          );
          return;
        }

        await saveProfile({ ...profile, notifications: true }, true);
        await showNativeTestNotification();
      } catch {
        Alert.alert(
          "Não foi possível ativar",
          "Confira a conexão com a API e tente novamente.",
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, profile, saveProfile],
  );

  const handlePermissionAction = useCallback(async () => {
    if (permissionState === "blocked") {
      await openNativeNotificationSettings();
      return;
    }
    await setEnabled(true);
  }, [permissionState, setEnabled]);

  return useMemo(() => {
    if (
      (!profile?.notifications && !activationAttempted) ||
      permissionState === "granted"
    ) {
      return {
        permissionState,
        enabled: Boolean(
          profile?.notifications && permissionState === "granted",
        ),
        busy,
        setEnabled,
        handlePermissionAction,
      };
    }
    const systemName = Platform.OS === "ios" ? "iPhone" : "Android";
    return {
      permissionState,
      enabled: false,
      busy,
      message:
        permissionState === "blocked"
          ? `As notificações estão bloqueadas no ${systemName}. Abra as configurações do sistema para ativá-las.`
          : `Permita notificações no ${systemName} para receber novidades e lembretes do casal.`,
      actionLabel:
        permissionState === "blocked"
          ? "Abrir configurações"
          : "Permitir notificações",
      setEnabled,
      handlePermissionAction,
    };
  }, [
    busy,
    activationAttempted,
    handlePermissionAction,
    permissionState,
    profile?.notifications,
    setEnabled,
  ]);
}
