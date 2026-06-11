import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ThemePalette } from "../types";

export function EmptyState({
  title,
  description,
  theme,
}: {
  title: string;
  description: string;
  theme: ThemePalette;
}) {
  return (
    <View style={styles.container}>
      <Ionicons name="heart-outline" size={30} color={theme.accent} />
      <Text style={[styles.title, { color: theme.title }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.muted }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 28 },
  title: { marginTop: 10, fontWeight: "800", fontSize: 16 },
  description: { marginTop: 5, textAlign: "center", lineHeight: 19 },
});
