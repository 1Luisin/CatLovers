import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import type {
  NotificationPermissionState,
  NotificationUiState,
  Profile,
} from "../../../types";
import {
  disableWebNotifications,
  enableWebNotifications,
  explainWebNotificationSettings,
  getWebNotificationPermission,
  showWebTestNotification,
} from "../services/webNotificationService";

export function useWebNotifications(
  profile: Profile | undefined,
  saveProfile: (profile: Profile, settingsOnly?: boolean) => Promise<void>,
): NotificationUiState {
  const [permissionState, setPermissionState] =
    useState<NotificationPermissionState>("loading");
  const [busy, setBusy] = useState(false);
  const [activationAttempted, setActivationAttempted] = useState(false);

  const refreshPermission = useCallback(async () => {
    const next = await getWebNotificationPermission();
    setPermissionState(next);
    if (next === "granted" && profile?.notifications) {
      void enableWebNotifications(profile.id).catch(() => undefined);
    }
  }, [profile?.id, profile?.notifications]);

  useEffect(() => {
    void refreshPermission().catch(() => setPermissionState("unsupported"));
    const onFocus = () => void refreshPermission().catch(() => undefined);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshPermission]);

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      if (!profile || busy) return;
      setBusy(true);
      try {
        if (!enabled) {
          setActivationAttempted(false);
          await disableWebNotifications(profile.id);
          await saveProfile({ ...profile, notifications: false }, true);
          return;
        }
        setActivationAttempted(true);
        const next = await enableWebNotifications(profile.id);
        setPermissionState(next);
        if (next !== "granted") {
          if (next === "blocked") explainWebNotificationSettings();
          return;
        }
        await saveProfile({ ...profile, notifications: true }, true);
        await showWebTestNotification();
      } catch {
        Alert.alert(
          "Não foi possível ativar",
          "Confira se o site está em HTTPS e se a API está disponível.",
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, profile, saveProfile],
  );

  const handlePermissionAction = useCallback(async () => {
    if (permissionState === "blocked") {
      explainWebNotificationSettings();
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
    return {
      permissionState,
      enabled: false,
      busy,
      message:
        permissionState === "unsupported"
          ? "Este navegador não oferece notificações Web Push neste modo."
          : permissionState === "blocked"
            ? "As notificações estão bloqueadas neste navegador. Libere a permissão nas configurações do site."
            : "Permita notificações no navegador para receber novidades e lembretes do casal.",
      actionLabel:
        permissionState === "blocked"
          ? "Ver como ativar"
          : permissionState === "unsupported"
            ? undefined
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
