import type { Profile } from "../../../types";

export const getProfileSettings = (
  profile: Profile,
): Pick<Profile, "theme" | "notifications" | "weeklyQuestion"> => ({
  theme: profile.theme,
  notifications: profile.notifications,
  weeklyQuestion: profile.weeklyQuestion,
});
