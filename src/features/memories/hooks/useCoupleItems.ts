import { useCallback, useEffect, useState } from "react";
import { initialItems } from "../../../data/constants";
import { getItems } from "../../../services/apiClient";
import {
  loadCachedItems,
  saveCachedItems,
} from "../../../services/storageService";
import type { CoupleItem } from "../../../types";
import { persistItem, persistPlanToggle } from "../services/itemService";
import { normalizeCachedItem } from "../utils/items";
import { togglePlanLocally } from "../../plans/services/planService";

export function useCoupleItems(onSyncError: () => void) {
  const [items, setItems] = useState<CoupleItem[]>(initialItems);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadCachedItems()
      .then((cachedItems) => {
        if (cachedItems) setItems(cachedItems.map(normalizeCachedItem));
      })
      .catch(() => undefined)
      .finally(() => {
        setLoaded(true);
        getItems()
          .then(setItems)
          .catch(() => undefined);
      });
  }, []);

  useEffect(() => {
    if (loaded) void saveCachedItems(items);
  }, [items, loaded]);

  const togglePlan = useCallback(
    async (id: string) => {
      const previous = items;
      setItems((current) =>
        current.map((item) =>
          item.id === id ? togglePlanLocally(item) : item,
        ),
      );
      try {
        const saved = await persistPlanToggle(id);
        setItems((current) =>
          current.map((item) => (item.id === id ? saved : item)),
        );
      } catch {
        setItems(previous);
        onSyncError();
      }
    },
    [items, onSyncError],
  );

  const saveItem = useCallback(
    async (
      item: CoupleItem,
      editing: boolean,
      createdByProfileId?: string,
    ) => {
      const optimistic = { ...item, createdByProfileId };
      setItems((current) =>
        editing
          ? current.map((currentItem) =>
              currentItem.id === optimistic.id ? optimistic : currentItem,
            )
          : [optimistic, ...current],
      );
      try {
        const saved = await persistItem(optimistic, editing);
        setItems((current) =>
          current
            .filter(
              (currentItem) => editing || currentItem.id !== optimistic.id,
            )
            .map((currentItem) =>
              currentItem.id === optimistic.id || currentItem.id === saved.id
                ? saved
                : currentItem,
            )
            .concat(
              current.some((currentItem) => currentItem.id === saved.id)
                ? []
                : [saved],
            ),
        );
      } catch {
        onSyncError();
      }
    },
    [onSyncError],
  );

  return {
    items,
    itemsLoaded: loaded,
    togglePlan,
    saveItem,
  };
}
