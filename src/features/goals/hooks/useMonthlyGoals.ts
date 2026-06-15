import { useCallback, useEffect, useState } from "react";
import { initialMonthlyGoals } from "../../../data/constants";
import { getMonthlyGoals } from "../../../services/apiClient";
import {
  loadCachedMonthlyGoals,
  saveCachedMonthlyGoals,
} from "../../../services/storageService";
import type { MonthlyGoal } from "../../../types";
import { persistMonthlyGoal } from "../services/goalService";

export function useMonthlyGoals(onSyncError: () => void) {
  const [monthlyGoals, setMonthlyGoals] =
    useState<Record<string, MonthlyGoal>>(initialMonthlyGoals);
  const [loaded, setLoaded] = useState(false);

  const refreshMonthlyGoals = useCallback(async () => {
    const goals = await getMonthlyGoals();
    const nextGoals = Object.fromEntries(
      goals.map((goal) => [goal.monthKey, goal]),
    );
    setMonthlyGoals(nextGoals);
    await saveCachedMonthlyGoals(nextGoals);
  }, []);

  useEffect(() => {
    loadCachedMonthlyGoals()
      .then((cachedGoals) => {
        if (cachedGoals) setMonthlyGoals(cachedGoals);
      })
      .catch(() => undefined)
      .finally(() => {
        setLoaded(true);
        void refreshMonthlyGoals().catch(() => undefined);
      });
  }, [refreshMonthlyGoals]);

  useEffect(() => {
    if (loaded) void saveCachedMonthlyGoals(monthlyGoals);
  }, [loaded, monthlyGoals]);

  const saveGoal = useCallback(
    async (goal: MonthlyGoal, createdByProfileId?: string) => {
      setMonthlyGoals((current) => ({
        ...current,
        [goal.monthKey]: goal,
      }));
      try {
        const saved = await persistMonthlyGoal(goal, createdByProfileId);
        setMonthlyGoals((current) => ({
          ...current,
          [saved.monthKey]: saved,
        }));
      } catch {
        onSyncError();
      }
    },
    [onSyncError],
  );

  return {
    monthlyGoals,
    goalsLoaded: loaded,
    refreshMonthlyGoals,
    saveGoal,
  };
}
