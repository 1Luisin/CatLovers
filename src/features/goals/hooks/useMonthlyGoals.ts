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

  useEffect(() => {
    loadCachedMonthlyGoals()
      .then((cachedGoals) => {
        if (cachedGoals) setMonthlyGoals(cachedGoals);
      })
      .catch(() => undefined)
      .finally(() => {
        setLoaded(true);
        getMonthlyGoals()
          .then((goals) =>
            setMonthlyGoals(
              Object.fromEntries(goals.map((goal) => [goal.monthKey, goal])),
            ),
          )
          .catch(() => undefined);
      });
  }, []);

  useEffect(() => {
    if (loaded) void saveCachedMonthlyGoals(monthlyGoals);
  }, [loaded, monthlyGoals]);

  const saveGoal = useCallback(
    async (goal: MonthlyGoal) => {
      setMonthlyGoals((current) => ({
        ...current,
        [goal.monthKey]: goal,
      }));
      try {
        const saved = await persistMonthlyGoal(goal);
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
    saveGoal,
  };
}
