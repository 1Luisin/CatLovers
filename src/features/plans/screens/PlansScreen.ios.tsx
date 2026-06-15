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
  RefreshControl,
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
import { AppHeader, MemoryCard, ProfileAvatar } from "../../../components/common/AppComponents.ios";
import styles from "../../../platforms/ios/styles";

export function PlansScreen({
  items,
  monthlyGoal,
  onConfigureGoal,
  onAddIdea,
  onToggle,
  refreshing,
  onRefresh,
  theme,
}: {
  items: CoupleItem[];
  monthlyGoal?: MonthlyGoal;
  onConfigureGoal: () => void;
  onAddIdea: () => void;
  onToggle: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  theme: AppTheme;
}) {
  const today = new Date();
  const todayIso = toIsoDate(today);
  const plans = useMemo(
    () => items.filter((item) => item.category === "Plano"),
    [items],
  );
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const done = plans.filter((item) => item.done).length;
  const progress = plans.length ? done / plans.length : 0;
  const calendarYear = visibleMonth.getFullYear();
  const calendarMonth = visibleMonth.getMonth();
  const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const plansByDate = useMemo(
    () =>
      plans.reduce<Record<string, CoupleItem[]>>((groups, item) => {
        const date = getPlanCalendarDate(item);
        if (!date) return groups;
        groups[date] = [...(groups[date] ?? []), item];
        return groups;
      }, {}),
    [plans],
  );
  const selectedPlans = plansByDate[selectedDate] ?? [];
  const selectedDateValue = fromIsoDate(selectedDate);
  const selectedDateLabel = `${selectedDateValue.getDate()} de ${
    monthNames[selectedDateValue.getMonth()].toLocaleLowerCase("pt-BR")
  } de ${selectedDateValue.getFullYear()}`;

  const changeCalendarMonth = (offset: number) => {
    const nextMonth = new Date(calendarYear, calendarMonth + offset, 1);
    const selectedDay = fromIsoDate(selectedDate).getDate();
    const nextMonthDays = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth() + 1,
      0,
    ).getDate();
    const nextSelectedDate = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      Math.min(selectedDay, nextMonthDays),
    );
    setVisibleMonth(nextMonth);
    setSelectedDate(toIsoDate(nextSelectedDate));
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.accent}
          colors={[theme.accent]}
          progressBackgroundColor={theme.surface}
        />
      }
    >
      <AppHeader
        eyebrow="TEMPO DE QUALIDADE"
        title="Planos de junho"
        onAdd={onConfigureGoal}
        addAccessibilityLabel="Configurar meta mensal"
        theme={theme}
      />
      <LinearGradient colors={theme.heroColors} style={styles.monthCard}>
        <View style={styles.monthTop}>
          <View style={styles.monthGoalContent}>
            <Text style={styles.monthLabel}>META DO MÊS</Text>
            <Text style={styles.monthTitle}>
              {monthlyGoal?.title ?? "Defina a meta do mês"}
            </Text>
          </View>
          <Text style={styles.monthProgress}>
            {done}/{plans.length}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor:
                  theme.character === "Cinnamoroll"
                    ? palette.paper
                    : theme.accent,
              },
            ]}
          />
        </View>
        <Text style={styles.monthHint}>
          {monthlyGoal?.description ??
            "Use o botão acima para escolher um objetivo para este mês."}
        </Text>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.title }]}>
          Calendário do casal
        </Text>
        <Ionicons name="calendar" size={18} color={theme.accent} />
      </View>
      <View
        style={[
          styles.plansCalendarCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.plansCalendarHeader}>
          <Pressable
            onPress={() => changeCalendarMonth(-1)}
            style={[
              styles.plansCalendarNav,
              { backgroundColor: theme.accentSoft },
            ]}
            accessibilityLabel="Mês anterior"
          >
            <Ionicons name="chevron-back" size={18} color={theme.accent} />
          </Pressable>
          <View style={styles.plansCalendarHeading}>
            <Text style={[styles.plansCalendarMonth, { color: theme.title }]}>
              {monthNames[calendarMonth]} {calendarYear}
            </Text>
            <Text
              style={[styles.plansCalendarSubtitle, { color: theme.muted }]}
            >
              Toque em um dia para ver os planos
            </Text>
          </View>
          <Pressable
            onPress={() => changeCalendarMonth(1)}
            style={[
              styles.plansCalendarNav,
              { backgroundColor: theme.accentSoft },
            ]}
            accessibilityLabel="Próximo mês"
          >
            <Ionicons name="chevron-forward" size={18} color={theme.accent} />
          </Pressable>
        </View>

        <View style={styles.plansCalendarGrid}>
          {calendarWeekdayLabels.map((label) => (
            <Text
              key={label}
              style={[styles.plansCalendarWeekday, { color: theme.muted }]}
            >
              {label}
            </Text>
          ))}
          {calendarCells.map((day, index) => {
            if (!day) {
              return (
                <View
                  key={`calendar-empty-${index}`}
                  style={styles.plansCalendarDayCell}
                />
              );
            }

            const isoDate = toIsoDate(
              new Date(calendarYear, calendarMonth, day),
            );
            const dayPlans = plansByDate[isoDate] ?? [];
            const selected = isoDate === selectedDate;
            const isToday = isoDate === todayIso;

            return (
              <Pressable
                key={isoDate}
                onPress={() => setSelectedDate(isoDate)}
                style={styles.plansCalendarDayCell}
                accessibilityLabel={`${day} de ${monthNames[calendarMonth]}, ${
                  dayPlans.length
                } ${dayPlans.length === 1 ? "plano" : "planos"}`}
              >
                <View
                  style={[
                    styles.plansCalendarDay,
                    isToday && {
                      borderColor: theme.accent,
                      borderWidth: 1,
                    },
                    selected && {
                      backgroundColor: theme.accent,
                      borderColor: theme.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.plansCalendarDayText,
                      { color: theme.title },
                      selected && styles.plansCalendarDayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                  {dayPlans.length > 0 && (
                    <View
                      style={[
                        styles.plansCalendarCount,
                        {
                          backgroundColor: selected
                            ? palette.paper
                            : theme.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.plansCalendarCountText,
                          { color: selected ? theme.accent : palette.paper },
                        ]}
                      >
                        {dayPlans.length}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.dayAgenda,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.dayAgendaHeader}>
          <View>
            <Text style={[styles.dayAgendaTitle, { color: theme.title }]}>
              {selectedDateLabel}
            </Text>
            <Text style={[styles.dayAgendaSubtitle, { color: theme.muted }]}>
              {selectedPlans.length === 0
                ? "Nenhum plano para este dia"
                : `${selectedPlans.length} ${
                    selectedPlans.length === 1 ? "plano" : "planos"
                  } neste dia`}
            </Text>
          </View>
          {selectedDate === todayIso && (
            <View
              style={[
                styles.todayBadge,
                { backgroundColor: theme.accentSoft },
              ]}
            >
              <Text style={[styles.todayBadgeText, { color: theme.accent }]}>
                HOJE
              </Text>
            </View>
          )}
        </View>

        {selectedPlans.length === 0 ? (
          <View style={styles.dayAgendaEmpty}>
            <Ionicons
              name="calendar-clear-outline"
              size={24}
              color={theme.accent}
            />
            <Text style={[styles.dayAgendaEmptyText, { color: theme.muted }]}>
              Os planos previstos ou concluídos nesta data aparecerão aqui.
            </Text>
          </View>
        ) : (
          selectedPlans.map((item) => {
            const ideaMeta = item.ideaType
              ? ideaTypeMeta[item.ideaType]
              : null;
            return (
              <Pressable
                key={`agenda-${item.id}`}
                onPress={() => onToggle(item.id)}
                style={[
                  styles.dayAgendaItem,
                  { borderTopColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.dayAgendaCheck,
                    { borderColor: theme.accent },
                    item.done && { backgroundColor: theme.accent },
                  ]}
                >
                  {item.done && (
                    <Ionicons
                      name="checkmark"
                      size={15}
                      color={palette.paper}
                    />
                  )}
                </View>
                <View style={styles.dayAgendaContent}>
                  <Text
                    style={[
                      styles.dayAgendaItemTitle,
                      { color: theme.title },
                      item.done && styles.doneText,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.dayAgendaItemNote, { color: theme.muted }]}
                  >
                    {item.note}
                  </Text>
                  <View style={styles.dayAgendaMeta}>
                    {ideaMeta && (
                      <Text
                        style={[
                          styles.dayAgendaType,
                          { color: ideaMeta.color },
                        ]}
                      >
                        {ideaMeta.label}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.dayAgendaStatus,
                        { color: theme.accent },
                      ]}
                    >
                      {item.done ? "CONCLUÍDO" : "PREVISTO"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.title }]}>
          Lista do casal
        </Text>
        <Ionicons name="heart" size={17} color={theme.accent} />
      </View>
      {plans.map((item) => {
        const ideaMeta = item.ideaType ? ideaTypeMeta[item.ideaType] : null;
        return (
          <Pressable
            key={item.id}
            onPress={() => onToggle(item.id)}
            style={[styles.planRow, { borderBottomColor: theme.border }]}
          >
            <View
              style={[
                styles.bigCheck,
                item.done && {
                  backgroundColor: theme.accent,
                  borderColor: theme.accent,
                },
              ]}
            >
              {item.done && (
                <Ionicons name="checkmark" size={18} color={palette.paper} />
              )}
            </View>
            <View style={styles.planContent}>
              <Text
                style={[
                  styles.planTitle,
                  { color: theme.title },
                  item.done && styles.doneText,
                ]}
              >
                {item.title}
              </Text>
              <Text style={[styles.planNote, { color: theme.muted }]}>
                {item.note}
              </Text>
              {ideaMeta && (
                <View
                  style={[
                    styles.planIdeaBadge,
                    { backgroundColor: `${ideaMeta.color}16` },
                  ]}
                >
                  <Ionicons
                    name={ideaMeta.icon}
                    size={11}
                    color={ideaMeta.color}
                  />
                  <Text
                    style={[styles.planIdeaBadgeText, { color: ideaMeta.color }]}
                  >
                    {ideaMeta.label}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.planDateContainer}>
              <Ionicons
                name={item.plannedFor ? "calendar-outline" : "calendar-clear-outline"}
                size={13}
                color={theme.accent}
              />
              <Text style={[styles.planDate, { color: theme.accent }]}>
                {item.date}
              </Text>
            </View>
          </Pressable>
        );
      })}

      <Pressable
        onPress={onAddIdea}
        style={[styles.dashedButton, { borderColor: `${theme.accent}70` }]}
      >
        <Ionicons name="add-circle-outline" size={21} color={theme.accent} />
        <Text style={[styles.dashedButtonText, { color: theme.accent }]}>
          Adicionar uma ideia para junho
        </Text>
      </Pressable>
    </ScrollView>
  );
}
