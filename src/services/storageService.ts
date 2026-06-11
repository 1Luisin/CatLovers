import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CoupleItem, MonthlyGoal, Profile } from "../types";

const KEYS = {
  items: "@catlovers/items",
  profiles: "@catlovers/profiles",
  monthlyGoals: "@catlovers/monthly-goals",
  activeProfile: "@catlovers/active-profile",
} as const;

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

export const loadCachedProfiles = () => loadJson<Profile[]>(KEYS.profiles);
export const saveCachedProfiles = (profiles: Profile[]) =>
  saveJson(KEYS.profiles, profiles);
export const loadCachedItems = () => loadJson<CoupleItem[]>(KEYS.items);
export const saveCachedItems = (items: CoupleItem[]) =>
  saveJson(KEYS.items, items);
export const loadCachedMonthlyGoals = () =>
  loadJson<Record<string, MonthlyGoal>>(KEYS.monthlyGoals);
export const saveCachedMonthlyGoals = (
  goals: Record<string, MonthlyGoal>,
) => saveJson(KEYS.monthlyGoals, goals);
export const loadActiveProfileId = () =>
  AsyncStorage.getItem(KEYS.activeProfile);
export const saveActiveProfileId = (profileId: string | null) =>
  profileId
    ? AsyncStorage.setItem(KEYS.activeProfile, profileId)
    : AsyncStorage.removeItem(KEYS.activeProfile);
export const clearLocalCache = () =>
  AsyncStorage.multiRemove(Object.values(KEYS));
