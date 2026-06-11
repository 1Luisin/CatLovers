import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { Profile } from "../types";

export function ProfileAvatar({
  profile,
  size = 56,
}: {
  profile: Pick<Profile, "name" | "photoUri" | "color">;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: profile.color,
        },
      ]}
    >
      {profile.photoUri ? (
        <Image source={{ uri: profile.photoUri }} style={styles.image} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.36 }]}>
          {profile.name.trim().charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { overflow: "hidden", alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  initial: { color: "#FFFFFF", fontWeight: "900" },
});
