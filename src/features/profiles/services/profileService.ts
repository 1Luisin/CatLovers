import {
  updateProfile,
  updateProfileSettings,
  uploadProfilePhoto,
} from "../../../services/apiClient";
import type { Profile } from "../../../types";
import { isRemoteImage, toUploadFile } from "../../../utils/image";

export async function persistProfile(
  profile: Profile,
  settingsOnly: boolean,
) {
  const saved = settingsOnly
    ? await updateProfileSettings(profile.id, profile)
    : await updateProfile(profile.id, profile);
  if (profile.photoUri && !isRemoteImage(profile.photoUri)) {
    return uploadProfilePhoto(profile.id, toUploadFile(profile.photoUri));
  }
  return saved;
}
