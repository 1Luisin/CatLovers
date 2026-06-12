import { useCallback, useEffect, useMemo, useState } from "react";
import { initialProfiles } from "../../../data/initialProfiles";
import { getProfiles } from "../../../services/apiClient";
import {
  loadActiveProfileId,
  loadCachedProfiles,
  saveActiveProfileId,
  saveCachedProfiles,
} from "../../../services/storageService";
import type { Profile } from "../../../types";
import { correctLegacyText } from "../../../utils/text";
import { persistProfile } from "../services/profileService";

export function useProfiles(onSyncError: () => void) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadCachedProfiles(), loadActiveProfileId()])
      .then(([cachedProfiles, cachedActiveProfile]) => {
        if (cachedProfiles?.length) {
          setProfiles(
            cachedProfiles.map((profile) => ({
              ...profile,
              name: correctLegacyText(profile.name),
              bio: correctLegacyText(profile.bio),
            })),
          );
        }
        if (cachedActiveProfile) setActiveProfileId(cachedActiveProfile);
      })
      .catch(() => undefined)
      .finally(() => {
        setLoaded(true);
        getProfiles()
          .then((remoteProfiles) => {
            if (!remoteProfiles.length) return;
            setProfiles(remoteProfiles);
            void saveCachedProfiles(remoteProfiles);
          })
          .catch(() => undefined);
      });
  }, []);

  useEffect(() => {
    if (loaded) void saveCachedProfiles(profiles);
  }, [loaded, profiles]);

  useEffect(() => {
    if (loaded) void saveActiveProfileId(activeProfileId);
  }, [activeProfileId, loaded]);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId),
    [activeProfileId, profiles],
  );

  const saveProfile = useCallback(
    async (updated: Profile, settingsOnly = false) => {
      setProfiles((current) =>
        current.map((profile) =>
          profile.id === updated.id ? updated : profile,
        ),
      );
      try {
        const saved = await persistProfile(updated, settingsOnly);
        setProfiles((current) =>
          current.map((profile) =>
            profile.id === saved.id ? saved : profile,
          ),
        );
      } catch {
        onSyncError();
      }
    },
    [onSyncError],
  );

  const clearActiveProfile = useCallback(() => setActiveProfileId(null), []);

  return {
    profiles,
    activeProfile,
    activeProfileId,
    profilesLoaded: loaded,
    selectProfile: setActiveProfileId,
    clearActiveProfile,
    saveProfile,
  };
}
