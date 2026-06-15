import { Router } from "express";
import {
  getWebPushPublicKey,
  registerNotificationSubscription,
  unregisterNotificationSubscription,
} from "../services/notificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireFields } from "../utils/http.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/web-push-public-key",
  asyncHandler(async (_request, response) => {
    response.json({ publicKey: await getWebPushPublicKey() });
  }),
);

notificationsRouter.post(
  "/subscriptions",
  asyncHandler(async (request, response) => {
    if (
      !requireFields(
        request.body,
        ["deviceId", "profileId", "platform"],
        response,
      )
    ) {
      return;
    }
    const platform = String(request.body.platform);
    if (!["android", "ios", "web"].includes(platform)) {
      return response.status(400).json({ error: "Plataforma inválida." });
    }
    if (
      platform === "web" &&
      !request.body.webPushSubscription?.endpoint
    ) {
      return response
        .status(400)
        .json({ error: "Assinatura Web Push inválida." });
    }
    if (platform !== "web" && !request.body.expoPushToken) {
      return response
        .status(400)
        .json({ error: "Expo Push Token obrigatório." });
    }

    response.status(201).json(
      await registerNotificationSubscription({
        deviceId: String(request.body.deviceId),
        profileId: String(request.body.profileId),
        platform: platform as "android" | "ios" | "web",
        expoPushToken: request.body.expoPushToken
          ? String(request.body.expoPushToken)
          : undefined,
        webPushSubscription: request.body.webPushSubscription,
      }),
    );
  }),
);

notificationsRouter.delete(
  "/subscriptions",
  asyncHandler(async (request, response) => {
    if (
      !requireFields(request.body, ["deviceId", "profileId"], response)
    ) {
      return;
    }
    await unregisterNotificationSubscription(
      String(request.body.deviceId),
      String(request.body.profileId),
    );
    response.status(204).send();
  }),
);
