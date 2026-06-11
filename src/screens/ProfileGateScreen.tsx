import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ProfileAvatar } from "../components/ProfileAvatar";
import type { Profile, ThemePalette } from "../types";

export function ProfileGateScreen({
  profiles,
  theme,
  onSelect,
}: {
  profiles: Profile[];
  theme: ThemePalette;
  onSelect: (profile: Profile) => void;
}) {
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.title }]}>Quem está entrando?</Text>
      <View style={styles.choices}>
        {profiles.map((profile) => (
          <Pressable key={profile.id} onPress={() => onSelect(profile)} style={styles.choice}>
            <ProfileAvatar profile={profile} size={84} />
            <Text style={[styles.name, { color: theme.title }]}>{profile.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 27, fontWeight: "900", textAlign: "center" },
  choices: { flexDirection: "row", gap: 14, marginTop: 30 },
  choice: { flex: 1, alignItems: "center", padding: 20 },
  name: { marginTop: 12, fontSize: 17, fontWeight: "800" },
});
