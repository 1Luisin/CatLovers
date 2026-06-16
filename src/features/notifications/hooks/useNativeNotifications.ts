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
  isExpoGoNotificationRuntime,
  openNativeNotificationSettings,
  showNativeTestNotification,
} from "../services/nativeNotificationService";

function getNativeActivationErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const missingAndroidFirebase =
    Platform.OS === "android" &&
    (message.includes("Default FirebaseApp is not initialized") ||
      message.includes("fcm-credentials") ||
      message.includes("FirebaseApp.initializeApp"));

  if (missingAndroidFirebase) {
    return "Este APK foi gerado sem o Firebase/FCM do Android. Coloque o google-services.json do pacote com.catlovers.app na raiz do projeto, cadastre a service account FCM V1 no EAS e gere um novo APK.";
  }

  return "Não foi possível registrar este aparelho. Confira a conexão com a API e as credenciais de notificações do build.";
}

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

      if (enabled && isExpoGoNotificationRuntime()) {
        setActivationAttempted(true);
        setPermissionState("unsupported");
        Alert.alert(
          "Use um build do CatLovers",
          "O Expo Go não oferece notificações push no Android desde o Expo SDK 53. Instale um development build ou o APK preview do CatLovers para ativá-las.",
        );
        return;
      }

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
      } catch (error) {
        console.warn("Falha ao ativar notificações nativas:", error);
        Alert.alert(
          "Não foi possível ativar",
          getNativeActivationErrorMessage(error),
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, profile, saveProfile],
  );

  const handlePermissionAction = useCallback(async () => {
    if (permissionState === "unsupported") {
      Alert.alert(
        "Notificações no Expo Go",
        "Para testar notificações no Android, instale um development build com `eas build --platform android --profile development` ou o APK gerado pelo perfil preview.",
      );
      return;
    }
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
        permissionState === "unsupported"
          ? "O Expo Go não suporta notificações push neste ambiente. Use um development build ou o APK preview do CatLovers."
          : permissionState === "blocked"
          ? `As notificações estão bloqueadas no ${systemName}. Abra as configurações do sistema para ativá-las.`
          : `Permita notificações no ${systemName} para receber novidades e lembretes do casal.`,
      actionLabel:
        permissionState === "unsupported"
          ? "Como testar"
          : permissionState === "blocked"
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
