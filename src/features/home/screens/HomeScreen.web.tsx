import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  calendarWeekdayLabels,
  categoryMeta,
  defaultCollectionFilters,
  ideaTypeMeta,
  ideaTypes,
  memoryCategories,
  monthNames,
  weekdayLabels,
} from "../../../data/uiConstants";
import {
  formatCardDate,
  formatFullDate,
  fromIsoDate,
  toIsoDate,
} from "../../../utils/date";
import {
  getItemDate,
  getMonthGroup,
  getPlanCalendarDate,
} from "../../../features/memories/utils/items";
import { characterImages, palette, themes } from "../../../theme/themes";
import type {
  AddMode,
  Category,
  CategoryFilter,
  CollectionFilters,
  CoupleItem,
  IdeaType,
  MemoryCategory,
  MonthlyGoal,
  Profile,
  RatingFilter,
  ThemeName,
  ThemePalette as AppTheme,
} from "../../../types";
import { AppHeader, MemoryCard, ProfileAvatar } from "../../../components/common/AppComponents.web";
import styles from "../../../platforms/web/styles";

export function HomeScreen({
  items,
  profile,
  profiles,
  onViewAll,
  theme,
}: {
  items: CoupleItem[];
  profile: Profile;
  profiles: Profile[];
  onViewAll: () => void;
  theme: AppTheme;
}) {
  const completed = items.filter((item) => item.done).length;
  const nextPlan = items.find((item) => !item.done);
  const memories = items.filter((item) => item.category !== "Plano");

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader
        eyebrow="SEGUNDA, 8 DE JUNHO"
        title={`Oi, ${profile.name}`}
        theme={theme}
      />

      <LinearGradient
        colors={theme.heroColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, { shadowColor: theme.accent }]}
      >
        <View style={styles.heroDecorationOne} />
        <View style={styles.heroDecorationTwo} />
        <Text style={styles.heroKicker}>NOSSO PRÓXIMO MOMENTO</Text>
        <Text style={styles.heroTitle}>{nextPlan?.title ?? "Criar um novo plano"}</Text>
        <Text style={styles.heroNote}>
          {nextPlan?.note ?? "Uma ideia simples pode virar uma memória favorita."}
        </Text>
        <View style={styles.heroFooter}>
          <View style={styles.avatarStack}>
            {profiles.slice(0, 2).map((coupleProfile, index) => (
              <View
                key={coupleProfile.id}
                style={index > 0 ? styles.avatarOverlap : undefined}
              >
                <ProfileAvatar
                  profile={coupleProfile}
                  size={38}
                  border
                  borderWidth={2}
                  initialLength={2}
                />
              </View>
            ))}
          </View>
          <View style={styles.heroDate}>
            <Ionicons name="calendar-clear-outline" size={15} color="#FFF" />
            <Text style={styles.heroDateText}>{nextPlan?.date ?? "EM BREVE"}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionEyebrow, { color: theme.accent }]}>
            JUNHO
          </Text>
          <Text style={[styles.sectionTitle, { color: theme.title }]}>
            Nosso mês
          </Text>
        </View>
        <View
          style={[styles.progressBadge, { backgroundColor: theme.accentSoft }]}
        >
          <Text style={[styles.progressText, { color: theme.accent }]}>
            {completed} feitos
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="sparkles-outline" size={20} color={theme.accent} />
          <Text style={[styles.statValue, { color: theme.title }]}>
            {memories.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>
            momentos salvos
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="time-outline" size={21} color={theme.accent} />
          <Text style={[styles.statValue, { color: theme.title }]}>
            {items.filter((item) => !item.done).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>
            ideias esperando
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.title }]}>
          Últimas memórias
        </Text>
        <Pressable onPress={onViewAll}>
          <Text style={[styles.linkText, { color: theme.accent }]}>
            Ver todas
          </Text>
        </Pressable>
      </View>
      {memories.slice(0, 3).map((item) => (
        <MemoryCard key={item.id} item={item} theme={theme} />
      ))}
    </ScrollView>
  );
}
