import { randomUUID } from "node:crypto";
import webpush, { type PushSubscription } from "web-push";
import { query } from "../db.js";

type NotificationPlatform = "android" | "ios" | "web";

type SubscriptionRow = {
  id: string;
  profile_id: string;
  platform: NotificationPlatform;
  expo_push_token: string | null;
  web_push_subscription: PushSubscription | null;
};

type ExpoPushTicket = {
  status: "ok" | "error";
  details?: { error?: string };
};

type NotificationMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

type ItemNotification = {
  id: string;
  title: string;
  category: string;
  planned_for: string | null;
  created_by_profile_id: string | null;
};

const PLAN_TIME_ZONE = "America/Sao_Paulo";
const PLAN_REMINDER_INTERVAL_MS = 60_000;

let infrastructurePromise: Promise<void> | undefined;

async function initializeInfrastructure() {
  await query(`
    CREATE TABLE IF NOT EXISTS notification_subscriptions (
      id UUID PRIMARY KEY,
      device_id TEXT NOT NULL,
      profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
      expo_push_token TEXT,
      web_push_subscription JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (device_id, profile_id)
    );

    CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_profile
      ON notification_subscriptions(profile_id);

    CREATE TABLE IF NOT EXISTS notification_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notification_deliveries (
      delivery_key TEXT PRIMARY KEY,
      delivered_at TIMESTAMPTZ
    );
  `);

  const keys = await query<{ key: string; value: string }>(
    `SELECT key, value
     FROM notification_config
     WHERE key IN ('vapid_public_key', 'vapid_private_key')`,
  );
  const stored = Object.fromEntries(keys.rows.map((row) => [row.key, row.value]));

  if (!stored.vapid_public_key || !stored.vapid_private_key) {
    const generated = webpush.generateVAPIDKeys();
    await query(
      `INSERT INTO notification_config (key, value)
       VALUES ('vapid_public_key', $1), ('vapid_private_key', $2)
       ON CONFLICT (key) DO NOTHING`,
      [generated.publicKey, generated.privateKey],
    );
  }

  const configuredKeys = await query<{ key: string; value: string }>(
    `SELECT key, value
     FROM notification_config
     WHERE key IN ('vapid_public_key', 'vapid_private_key')`,
  );
  const configured = Object.fromEntries(
    configuredKeys.rows.map((row) => [row.key, row.value]),
  );
  if (!configured.vapid_public_key || !configured.vapid_private_key) {
    throw new Error("Não foi possível configurar as chaves Web Push.");
  }
  webpush.setVapidDetails(
    "mailto:catlovers@localhost",
    configured.vapid_public_key,
    configured.vapid_private_key,
  );
}

export function ensureNotificationInfrastructure() {
  infrastructurePromise ??= initializeInfrastructure();
  return infrastructurePromise;
}

export async function getWebPushPublicKey() {
  await ensureNotificationInfrastructure();
  return (
    await query<{ value: string }>(
      "SELECT value FROM notification_config WHERE key = 'vapid_public_key'",
    )
  ).rows[0]?.value;
}

export async function registerNotificationSubscription(body: {
  deviceId: string;
  profileId: string;
  platform: NotificationPlatform;
  expoPushToken?: string;
  webPushSubscription?: PushSubscription;
}) {
  await ensureNotificationInfrastructure();
  return (
    await query<SubscriptionRow>(
      `INSERT INTO notification_subscriptions (
        id, device_id, profile_id, platform, expo_push_token,
        web_push_subscription
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (device_id, profile_id) DO UPDATE SET
        platform = EXCLUDED.platform,
        expo_push_token = EXCLUDED.expo_push_token,
        web_push_subscription = EXCLUDED.web_push_subscription,
        updated_at = NOW()
      RETURNING id, profile_id, platform, expo_push_token, web_push_subscription`,
      [
        randomUUID(),
        body.deviceId,
        body.profileId,
        body.platform,
        body.expoPushToken ?? null,
        body.webPushSubscription
          ? JSON.stringify(body.webPushSubscription)
          : null,
      ],
    )
  ).rows[0];
}

export async function unregisterNotificationSubscription(
  deviceId: string,
  profileId: string,
) {
  await ensureNotificationInfrastructure();
  await query(
    `DELETE FROM notification_subscriptions
     WHERE device_id = $1 AND profile_id = $2`,
    [deviceId, profileId],
  );
}

async function listSubscriptions(excludeProfileId?: string) {
  await ensureNotificationInfrastructure();
  const values = excludeProfileId ? [excludeProfileId] : [];
  return (
    await query<SubscriptionRow>(
      `SELECT
        subscriptions.id,
        subscriptions.profile_id,
        subscriptions.platform,
        subscriptions.expo_push_token,
        subscriptions.web_push_subscription
       FROM notification_subscriptions subscriptions
       INNER JOIN profiles ON profiles.id = subscriptions.profile_id
       WHERE profiles.notifications = TRUE
       ${
         excludeProfileId
           ? "AND subscriptions.profile_id::text <> $1"
           : ""
       }`,
      values,
    )
  ).rows;
}

async function removeSubscription(id: string) {
  await query("DELETE FROM notification_subscriptions WHERE id = $1", [id]);
}

async function sendNativeNotifications(
  subscriptions: SubscriptionRow[],
  message: NotificationMessage,
) {
  const eligible = subscriptions.filter(
    (subscription) =>
      subscription.platform !== "web" && subscription.expo_push_token,
  );
  if (!eligible.length) return 0;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      eligible.map((subscription) => ({
        to: subscription.expo_push_token,
        title: message.title,
        body: message.body,
        data: message.data,
        sound: "default",
        channelId: "catlovers",
        priority: "high",
      })),
    ),
  });
  if (!response.ok) {
    throw new Error(`Expo Push respondeu com HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as {
    data?: ExpoPushTicket | ExpoPushTicket[];
  };
  const tickets = Array.isArray(payload.data)
    ? payload.data
    : payload.data
      ? [payload.data]
      : [];
  await Promise.all(
    tickets.map((ticket, index) =>
      ticket.status === "error" &&
      ticket.details?.error === "DeviceNotRegistered" &&
      eligible[index]
        ? removeSubscription(eligible[index].id)
        : Promise.resolve(),
    ),
  );
  return eligible.length;
}

async function sendWebNotifications(
  subscriptions: SubscriptionRow[],
  message: NotificationMessage,
) {
  const eligible = subscriptions.filter(
    (subscription) =>
      subscription.platform === "web" &&
      subscription.web_push_subscription?.endpoint,
  );
  await Promise.all(
    eligible.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          subscription.web_push_subscription!,
          JSON.stringify({
            ...message,
            icon: "/favicon.ico",
            url: "/",
          }),
        );
      } catch (error) {
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? Number(error.statusCode)
            : undefined;
        if (statusCode === 404 || statusCode === 410) {
          await removeSubscription(subscription.id);
          return;
        }
        throw error;
      }
    }),
  );
  return eligible.length;
}

export async function sendCoupleNotification(
  message: NotificationMessage,
  excludeProfileId?: string,
) {
  const subscriptions = await listSubscriptions(excludeProfileId);
  const [nativeCount, webCount] = await Promise.all([
    sendNativeNotifications(subscriptions, message),
    sendWebNotifications(subscriptions, message),
  ]);
  return nativeCount + webCount;
}

async function creatorName(profileId: string | null) {
  if (!profileId) return "Alguém";
  return (
    await query<{ name: string }>(
      "SELECT name FROM profiles WHERE id::text = $1",
      [profileId],
    )
  ).rows[0]?.name ?? "Alguém";
}

export async function notifyItemCreated(item: ItemNotification) {
  const author = await creatorName(item.created_by_profile_id);
  const isPlan = item.category === "Plano";
  await sendCoupleNotification(
    {
      title: isPlan ? "Novo plano na lista do casal" : "Nova lembrança guardada",
      body: `${author} adicionou “${item.title}”.`,
      data: {
        type: isPlan ? "plan-created" : "memory-created",
        itemId: item.id,
        tab: isPlan ? "planos" : "colecao",
      },
    },
    item.created_by_profile_id ?? undefined,
  );
}

export async function notifyMonthlyGoalCreated(
  title: string,
  monthKey: string,
  createdByProfileId?: string,
) {
  const author = await creatorName(createdByProfileId ?? null);
  await sendCoupleNotification(
    {
      title: "Nova meta mensal",
      body: `${author} criou a meta “${title}”.`,
      data: { type: "monthly-goal-created", monthKey, tab: "planos" },
    },
    createdByProfileId,
  );
}

async function claimDelivery(deliveryKey: string) {
  return Boolean(
    (
      await query<{ delivery_key: string }>(
        `INSERT INTO notification_deliveries (delivery_key)
         VALUES ($1)
         ON CONFLICT (delivery_key) DO NOTHING
         RETURNING delivery_key`,
        [deliveryKey],
      )
    ).rows[0],
  );
}

async function releaseDelivery(deliveryKey: string) {
  await query(
    "DELETE FROM notification_deliveries WHERE delivery_key = $1",
    [deliveryKey],
  );
}

async function completeDelivery(deliveryKey: string) {
  await query(
    `UPDATE notification_deliveries
     SET delivered_at = NOW()
     WHERE delivery_key = $1`,
    [deliveryKey],
  );
}

export async function processPlanReminders() {
  await ensureNotificationInfrastructure();
  const plans = (
    await query<ItemNotification>(
      `SELECT id, title, category, planned_for, created_by_profile_id
       FROM couple_items
       WHERE category = 'Plano'
         AND done = FALSE
         AND planned_for = (
           (NOW() AT TIME ZONE '${PLAN_TIME_ZONE}')::date + 1
         )
         AND EXTRACT(
           HOUR FROM NOW() AT TIME ZONE '${PLAN_TIME_ZONE}'
         ) >= 9`,
    )
  ).rows;

  for (const plan of plans) {
    const deliveryKey = `plan-reminder:${plan.id}:${plan.planned_for}`;
    if (!(await claimDelivery(deliveryKey))) continue;
    try {
      const sent = await sendCoupleNotification({
        title: "Plano amanhã",
        body: `Faltam 24 horas para “${plan.title}”.`,
        data: { type: "plan-reminder", itemId: plan.id, tab: "planos" },
      });
      if (!sent) {
        await releaseDelivery(deliveryKey);
        continue;
      }
      await completeDelivery(deliveryKey);
    } catch (error) {
      await releaseDelivery(deliveryKey);
      throw error;
    }
  }
}

export function startPlanReminderScheduler() {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await processPlanReminders();
    } catch (error) {
      console.error("Falha ao processar lembretes de planos.", error);
    } finally {
      running = false;
    }
  };
  void run();
  const interval = setInterval(() => void run(), PLAN_REMINDER_INTERVAL_MS);
  interval.unref();
  return () => clearInterval(interval);
}
