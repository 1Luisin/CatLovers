import type {
  CoupleItem,
  MonthlyGoal,
  Profile,
  ThemeName,
  UploadFile,
} from "../types";
import { normalizeThemeName } from "../theme/themes";
import { Platform } from "react-native";

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3333")
  .replace(/\/+$/, "");
const TIMEOUT_MS = 10000;

type ApiProfile = {
  id: string;
  code: string;
  name: string;
  birth_date: string | null;
  bio: string | null;
  photo_url: string | null;
  color: string | null;
  theme: string;
  notifications: boolean;
  weekly_question: boolean;
};

type ApiItem = {
  id: string;
  title: string;
  category: CoupleItem["category"];
  idea_type: CoupleItem["ideaType"] | null;
  note: string | null;
  display_date: string | null;
  occurred_on: string | null;
  planned_for: string | null;
  completed_on: string | null;
  done: boolean;
  rating: number | null;
  color: string | null;
  created_by_profile_id: string | null;
  photo_url?: string | null;
};

type ApiGoal = {
  month_key: string;
  title: string;
  description: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...init.headers,
        "ngrok-skip-browser-warning": "true",
      },
    });
    const text = await response.text();
    let body: unknown = undefined;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        throw new ApiError("A API retornou JSON inválido.", response.status);
      }
    }
    if (!response.ok) {
      const message =
        body && typeof body === "object" && "error" in body
          ? String(body.error)
          : `Erro HTTP ${response.status}`;
      throw new ApiError(message, response.status);
    }
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Tempo limite da API excedido.");
    }
    throw new ApiError("Não foi possível conectar à API.");
  } finally {
    clearTimeout(timeout);
  }
}

const dateOnly = (value: string | null) => value?.slice(0, 10) || undefined;
const toDisplayDate = (value: string | null) => {
  const iso = dateOnly(value);
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
};
const toApiDate = (value?: string) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

const mapProfile = (profile: ApiProfile): Profile => ({
  id: profile.id,
  code: profile.code,
  name: profile.name,
  birthDate: toDisplayDate(profile.birth_date),
  bio: profile.bio ?? "",
  photoUri: profile.photo_url ?? undefined,
  photoUrl: profile.photo_url ?? undefined,
  color: profile.color ?? "#C65D6C",
  theme: normalizeThemeName(profile.theme),
  notifications: profile.notifications,
  weeklyQuestion: profile.weekly_question,
});

const mapItem = (item: ApiItem): CoupleItem => ({
  id: item.id,
  title: item.title,
  category: item.category,
  ideaType: item.idea_type ?? undefined,
  note: item.note ?? "",
  date: item.display_date ?? "SEM DATA",
  occurredOn: dateOnly(item.occurred_on),
  plannedFor: dateOnly(item.planned_for),
  completedOn: dateOnly(item.completed_on),
  photoUri: item.photo_url ?? undefined,
  done: item.category === "Plano" ? item.done : true,
  rating: item.rating ?? undefined,
  color: item.color ?? "#C65D6C",
  createdByProfileId: item.created_by_profile_id ?? undefined,
});

const mapGoal = (goal: ApiGoal): MonthlyGoal => ({
  monthKey: goal.month_key,
  title: goal.title,
  description: goal.description,
});

const profilePayload = (profile: Partial<Profile>) => ({
  name: profile.name,
  birth_date: toApiDate(profile.birthDate),
  bio: profile.bio,
  color: profile.color,
  theme: normalizeThemeName(profile.theme),
  notifications: profile.notifications,
  weekly_question: profile.weeklyQuestion,
});

const itemPayload = (item: Partial<CoupleItem>) => ({
  title: item.title,
  category: item.category,
  idea_type: item.ideaType ?? null,
  note: item.note,
  display_date: item.date,
  occurred_on: item.occurredOn ?? null,
  planned_for: item.plannedFor ?? null,
  rating: item.rating ?? null,
  color: item.color,
  created_by_profile_id: item.createdByProfileId ?? null,
});

async function uploadBody(file: UploadFile) {
  const body = new FormData();
  const name = file.name ?? `photo-${Date.now()}.jpg`;
  if (Platform.OS === "web") {
    const blob = await fetch(file.uri).then((response) => response.blob());
    body.append("photo", blob, name);
  } else {
    body.append("photo", {
      uri: file.uri,
      name,
      type: file.type ?? "image/jpeg",
    } as unknown as Blob);
  }
  return body;
}

export const getProfiles = async () =>
  (await request<ApiProfile[]>("/profiles")).map(mapProfile);
export const getProfile = async (id: string) =>
  mapProfile(await request<ApiProfile>(`/profiles/${id}`));
export const updateProfile = async (id: string, payload: Partial<Profile>) =>
  mapProfile(
    await request<ApiProfile>(`/profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(profilePayload(payload)),
    }),
  );
export const updateProfileSettings = async (
  id: string,
  payload: {
    theme?: ThemeName;
    notifications?: boolean;
    weeklyQuestion?: boolean;
  },
) =>
  mapProfile(
    await request<ApiProfile>(`/profiles/${id}/settings`, {
      method: "PATCH",
      body: JSON.stringify(profilePayload(payload)),
    }),
  );
export const uploadProfilePhoto = async (id: string, file: UploadFile) =>
  mapProfile(
    await request<ApiProfile>(`/profiles/${id}/photo`, {
      method: "POST",
      body: await uploadBody(file),
    }),
  );

export const getItems = async () =>
  (await request<ApiItem[]>("/items")).map(mapItem);
export const getItem = async (id: string) =>
  mapItem(await request<ApiItem>(`/items/${id}`));
export const createItem = async (payload: Partial<CoupleItem>) =>
  mapItem(
    await request<ApiItem>("/items", {
      method: "POST",
      body: JSON.stringify(itemPayload(payload)),
    }),
  );
export const updateItem = async (id: string, payload: Partial<CoupleItem>) =>
  mapItem(
    await request<ApiItem>(`/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(itemPayload(payload)),
    }),
  );
export const deleteItem = (id: string) =>
  request<void>(`/items/${id}`, { method: "DELETE" });
export const toggleItemDone = async (id: string) =>
  mapItem(
    await request<ApiItem>(`/items/${id}/toggle-done`, { method: "PATCH" }),
  );
export const uploadItemPhoto = async (id: string, file: UploadFile) =>
  mapItem(
    await request<ApiItem>(`/items/${id}/photo`, {
      method: "POST",
      body: await uploadBody(file),
    }),
  );

export const getMonthlyGoals = async () =>
  (await request<ApiGoal[]>("/monthly-goals")).map(mapGoal);
export const getMonthlyGoal = async (monthKey: string) =>
  mapGoal(await request<ApiGoal>(`/monthly-goals/${monthKey}`));
export const upsertMonthlyGoal = async (
  monthKey: string,
  payload: Pick<MonthlyGoal, "title" | "description">,
) =>
  mapGoal(
    await request<ApiGoal>(`/monthly-goals/${monthKey}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  );
