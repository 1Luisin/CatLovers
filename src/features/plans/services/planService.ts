import type { CoupleItem } from "../../../types";
import { toIsoDate } from "../../../utils/date";

export function togglePlanLocally(item: CoupleItem): CoupleItem {
  return item.done
    ? { ...item, done: false, completedOn: undefined }
    : { ...item, done: true, completedOn: toIsoDate(new Date()) };
}
