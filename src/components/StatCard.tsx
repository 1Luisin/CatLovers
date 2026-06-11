import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ThemePalette } from "../types";

export function StatCard({
  value,
  label,
  theme,
}: {
  value: string | number;
  label: string;
  theme: ThemePalette;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.value, { color: theme.title }]}>{value}</Text>
      <Text style={{ color: theme.muted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16, alignItems: "center" },
  value: { fontSize: 20, fontWeight: "900", marginBottom: 3 },
});
