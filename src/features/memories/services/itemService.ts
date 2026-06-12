import {
  createItem,
  toggleItemDone,
  updateItem,
  uploadItemPhoto,
} from "../../../services/apiClient";
import type { CoupleItem } from "../../../types";
import { isRemoteImage, toUploadFile } from "../../../utils/image";

export async function persistItem(item: CoupleItem, editing: boolean) {
  let saved = editing
    ? await updateItem(item.id, item)
    : await createItem(item);
  if (item.photoUri && !isRemoteImage(item.photoUri)) {
    saved = await uploadItemPhoto(saved.id, toUploadFile(item.photoUri));
  }
  return saved;
}

export const persistPlanToggle = toggleItemDone;
