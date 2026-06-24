import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CoupleItem, MonthlyGoal, Profile } from "../types";
import { normalizeThemeName } from "../theme/themes";

const KEYS = {
  items: "@catlovers/items",
  profiles: "@catlovers/profiles",
  monthlyGoals: "@catlovers/monthly-goals",
  rouletteOptions: "@catlovers/roulette-options",
  activeProfile: "@catlovers/active-profile",
} as const;
const NOTIFICATION_DEVICE_KEY = "@catlovers/notification-device";

async function loadJson<T>(key: string): Promise<T | null> {
  const value = await AsyncStorage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

const saveJson = (key: string, value: unknown) =>
  AsyncStorage.setItem(key, JSON.stringify(value));

type CachedProfile = Partial<Profile> & {
  id?: string;
  code?: string;
};

function sanitizeProfile(profile: CachedProfile): Profile | null {
  if (!profile.id || !profile.name) return null;
  const photoUri = profile.photoUri ?? profile.photoUrl;
  return {
    id: profile.id,
    code: profile.code ?? profile.id,
    name: profile.name,
    birthDate: profile.birthDate ?? "",
    bio: profile.bio ?? "",
    ...(photoUri ? { photoUri, photoUrl: profile.photoUrl } : {}),
    color: profile.color ?? "#C65D6C",
    theme: normalizeThemeName(profile.theme),
    notifications: profile.notifications ?? true,
    weeklyQuestion: profile.weeklyQuestion ?? false,
  };
}

export async function loadCachedProfiles() {
  const profiles = await loadJson<CachedProfile[]>(KEYS.profiles);
  return profiles
    ? profiles
        .map(sanitizeProfile)
        .filter((profile): profile is Profile => profile !== null)
    : null;
}

export const saveCachedProfiles = (profiles: Profile[]) =>
  saveJson(
    KEYS.profiles,
    profiles
      .map(sanitizeProfile)
      .filter((profile): profile is Profile => profile !== null),
  );
export const loadCachedItems = () => loadJson<CoupleItem[]>(KEYS.items);
export const saveCachedItems = (items: CoupleItem[]) =>
  saveJson(KEYS.items, items);
export const loadCachedMonthlyGoals = () =>
  loadJson<Record<string, MonthlyGoal>>(KEYS.monthlyGoals);
export const saveCachedMonthlyGoals = (
  goals: Record<string, MonthlyGoal>,
) => saveJson(KEYS.monthlyGoals, goals);
export const loadRouletteOptions = () =>
  loadJson<string[]>(KEYS.rouletteOptions);
export const saveRouletteOptions = (options: string[]) =>
  saveJson(KEYS.rouletteOptions, options);
export const loadActiveProfileId = () =>
  AsyncStorage.getItem(KEYS.activeProfile);
export const saveActiveProfileId = (profileId: string | null) =>
  profileId
    ? AsyncStorage.setItem(KEYS.activeProfile, profileId)
    : AsyncStorage.removeItem(KEYS.activeProfile);

export async function getNotificationDeviceId() {
  const stored = await AsyncStorage.getItem(NOTIFICATION_DEVICE_KEY);
  if (stored) return stored;
  const created = `catlovers-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
  await AsyncStorage.setItem(NOTIFICATION_DEVICE_KEY, created);
  return created;
}

export const clearLocalCache = () =>
  AsyncStorage.multiRemove(Object.values(KEYS));
