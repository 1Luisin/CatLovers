import { monthAbbreviations, monthNames } from "../../../data/uiConstants";
import type { CoupleItem } from "../../../types";
import { fromIsoDate, toIsoDate } from "../../../utils/date";
import { correctLegacyText } from "../../../utils/text";

export function getLegacyCardDate(item: CoupleItem) {
  const [dayText, monthText] = item.date.toUpperCase().split(" ");
  const month = monthAbbreviations.indexOf(monthText);
  const day = Number(dayText);
  if (month < 0 || !day) return undefined;
  return toIsoDate(new Date(new Date().getFullYear(), month, day));
}

export function getPlanCalendarDate(item: CoupleItem) {
  if (item.category !== "Plano") return undefined;
  const plannedFor = item.plannedFor ?? getLegacyCardDate(item);
  return item.done ? item.completedOn ?? plannedFor : plannedFor;
}

export function getItemDate(item: CoupleItem) {
  if (item.occurredOn) return fromIsoDate(item.occurredOn);
  const legacyDate = getLegacyCardDate(item);
  return legacyDate ? fromIsoDate(legacyDate) : new Date(0);
}

export function getMonthGroup(item: CoupleItem) {
  const date = getItemDate(item);
  if (date.getTime() === 0) return { key: "sem-data", label: "Sem data" };
  return {
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
  };
}

export function normalizeCachedItem(item: CoupleItem): CoupleItem {
  const plannedFor =
    item.category === "Plano"
      ? item.plannedFor ?? getLegacyCardDate(item)
      : undefined;
  return {
    ...item,
    title: correctLegacyText(item.title),
    note: correctLegacyText(item.note),
    done: item.category === "Plano" ? item.done : true,
    plannedFor,
    completedOn:
      item.category === "Plano" && item.done
        ? item.completedOn ?? plannedFor
        : undefined,
  };
}
