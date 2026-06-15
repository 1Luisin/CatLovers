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

export function CollectionFilterModal({
  visible,
  filters,
  availableMonths,
  theme,
  onClose,
  onApply,
}: {
  visible: boolean;
  filters: CollectionFilters;
  availableMonths: Array<{ key: string; label: string }>;
  theme: AppTheme;
  onClose: () => void;
  onApply: (filters: CollectionFilters) => void;
}) {
  const [draft, setDraft] = useState(filters);
  const categories: CategoryFilter[] = [
    "Todos",
    "Filme",
    "Serie",
    "Jogo",
    "Role",
    "Anime",
  ];
  const ratings: RatingFilter[] = ["Todas", 5, 4, 3, 2, 1, "Sem avaliacao"];

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalDismiss} onPress={onClose} />
        <View
          style={[
            styles.filterModalSheet,
            { backgroundColor: theme.background },
          ]}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, { color: theme.accent }]}>
                ORGANIZAR COLEÇÃO
              </Text>
              <Text style={[styles.modalTitle, { color: theme.title }]}>
                Filtrar lembranças
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="close" size={22} color={theme.title} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.filterModalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.filterSectionHeader}>
              <View
                style={[
                  styles.filterSectionIcon,
                  { backgroundColor: theme.accentSoft },
                ]}
              >
                <Ionicons name="grid-outline" size={17} color={theme.accent} />
              </View>
              <View>
                <Text style={[styles.filterSectionTitle, { color: theme.title }]}>
                  Categoria
                </Text>
                <Text style={styles.filterSectionHint}>
                  Escolha um tipo de lembrança
                </Text>
              </View>
            </View>
            <View style={styles.filterOptionGrid}>
              {categories.map((category) => {
                const active = draft.category === category;
                const meta =
                  category === "Todos" ? null : categoryMeta[category];
                return (
                  <Pressable
                    key={category}
                    onPress={() => setDraft({ ...draft, category })}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: theme.surface,
                        borderColor: active ? theme.accent : theme.border,
                      },
                      active && { backgroundColor: theme.accentSoft },
                    ]}
                  >
                    <Ionicons
                      name={meta?.icon ?? "apps-outline"}
                      size={17}
                      color={active ? theme.accent : palette.muted}
                    />
                    <Text
                      style={[
                        styles.filterOptionText,
                        active && { color: theme.accent, fontWeight: "800" },
                      ]}
                    >
                      {meta?.label ?? "Todas"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.filterSectionHeader}>
              <View
                style={[
                  styles.filterSectionIcon,
                  { backgroundColor: theme.accentSoft },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color={theme.accent}
                />
              </View>
              <View>
                <Text style={[styles.filterSectionTitle, { color: theme.title }]}>
                  Data
                </Text>
                <Text style={styles.filterSectionHint}>
                  Mostre lembranças de um mês
                </Text>
              </View>
            </View>
            <View style={styles.filterMonthList}>
              <Pressable
                onPress={() => setDraft({ ...draft, month: null })}
                style={[
                  styles.filterMonthOption,
                  {
                    backgroundColor: theme.surface,
                    borderColor:
                      draft.month === null ? theme.accent : theme.border,
                  },
                  draft.month === null && {
                    backgroundColor: theme.accentSoft,
                  },
                ]}
              >
                <Ionicons
                  name="calendar-clear-outline"
                  size={17}
                  color={draft.month === null ? theme.accent : palette.muted}
                />
                <Text
                  style={[
                    styles.filterMonthText,
                    draft.month === null && {
                      color: theme.accent,
                      fontWeight: "800",
                    },
                  ]}
                >
                  Todos os meses
                </Text>
                {draft.month === null && (
                  <Ionicons name="checkmark" size={17} color={theme.accent} />
                )}
              </Pressable>
              {availableMonths.map((month) => {
                const active = draft.month === month.key;
                return (
                  <Pressable
                    key={month.key}
                    onPress={() => setDraft({ ...draft, month: month.key })}
                    style={[
                      styles.filterMonthOption,
                      {
                        backgroundColor: theme.surface,
                        borderColor: active ? theme.accent : theme.border,
                      },
                      active && { backgroundColor: theme.accentSoft },
                    ]}
                  >
                    <Ionicons
                      name="calendar-clear-outline"
                      size={17}
                      color={active ? theme.accent : palette.muted}
                    />
                    <Text
                      style={[
                        styles.filterMonthText,
                        active && { color: theme.accent, fontWeight: "800" },
                      ]}
                    >
                      {month.label}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark" size={17} color={theme.accent} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.filterSectionHeader}>
              <View
                style={[
                  styles.filterSectionIcon,
                  { backgroundColor: theme.accentSoft },
                ]}
              >
                <Ionicons name="star-outline" size={17} color={theme.accent} />
              </View>
              <View>
                <Text style={[styles.filterSectionTitle, { color: theme.title }]}>
                  Avaliação
                </Text>
                <Text style={styles.filterSectionHint}>
                  Filtre pela quantidade exata de estrelas
                </Text>
              </View>
            </View>
            <View style={styles.filterRatingList}>
              {ratings.map((rating) => {
                const active = draft.rating === rating;
                return (
                  <Pressable
                    key={String(rating)}
                    onPress={() => setDraft({ ...draft, rating })}
                    style={[
                      styles.filterRatingOption,
                      {
                        backgroundColor: theme.surface,
                        borderColor: active ? theme.accent : theme.border,
                      },
                      active && { backgroundColor: theme.accentSoft },
                    ]}
                  >
                    {typeof rating === "number" ? (
                      <View style={styles.filterRatingStars}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Ionicons
                            key={index}
                            name={index < rating ? "star" : "star-outline"}
                            size={16}
                            color={
                              index < rating ? palette.apricot : "#CFC4BE"
                            }
                          />
                        ))}
                      </View>
                    ) : (
                      <View style={styles.filterRatingLabelRow}>
                        <Ionicons
                          name={
                            rating === "Todas"
                              ? "sparkles-outline"
                              : "star-outline"
                          }
                          size={17}
                          color={active ? theme.accent : palette.muted}
                        />
                        <Text
                          style={[
                            styles.filterRatingLabel,
                            active && {
                              color: theme.accent,
                              fontWeight: "800",
                            },
                          ]}
                        >
                          {rating === "Todas" ? "Todas as notas" : "Sem avaliação"}
                        </Text>
                      </View>
                    )}
                    {active && (
                      <Ionicons name="checkmark" size={17} color={theme.accent} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.filterModalActions}>
            <Pressable
              onPress={() => setDraft(defaultCollectionFilters)}
              style={[styles.filterClearButton, { borderColor: theme.border }]}
            >
              <Text style={[styles.filterClearText, { color: theme.accent }]}>
                Limpar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onApply(draft)}
              style={styles.filterApplyButton}
            >
              <LinearGradient
                colors={theme.heroColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.filterApplyGradient}
              >
                <Text style={styles.filterApplyText}>Aplicar filtros</Text>
                <Ionicons name="checkmark" size={18} color={palette.paper} />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function CollectionScreen({
  items,
  onAdd,
  onEdit,
  refreshing,
  onRefresh,
  theme,
}: {
  items: CoupleItem[];
  onAdd: () => void;
  onEdit: (item: CoupleItem) => void;
  refreshing: boolean;
  onRefresh: () => void;
  theme: AppTheme;
}) {
  const [filters, setFilters] = useState(defaultCollectionFilters);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const memories = items.filter((item) => item.category !== "Plano");
  const availableMonths = Array.from(
    memories
      .reduce((months, item) => {
        const month = getMonthGroup(item);
        months.set(month.key, month);
        return months;
      }, new Map<string, { key: string; label: string }>())
      .values(),
  ).sort((first, second) => second.key.localeCompare(first.key));
  const visible = memories.filter(
    (item) =>
      (filters.category === "Todos" || item.category === filters.category) &&
      (filters.month === null || getMonthGroup(item).key === filters.month) &&
      (filters.rating === "Todas" ||
        (filters.rating === "Sem avaliacao"
          ? !item.rating
          : item.rating === filters.rating)),
  );
  const activeFilterCount =
    Number(filters.category !== "Todos") +
    Number(filters.month !== null) +
    Number(filters.rating !== "Todas");
  const activeFilterLabels = [
    filters.category === "Todos"
      ? null
      : categoryMeta[filters.category].label,
    filters.month === null
      ? null
      : availableMonths.find((month) => month.key === filters.month)?.label,
    filters.rating === "Todas"
      ? null
      : filters.rating === "Sem avaliacao"
        ? "Sem avaliação"
        : `${filters.rating} ${
            filters.rating === 1 ? "estrela" : "estrelas"
          }`,
  ].filter((label): label is string => Boolean(label));
  const monthGroups = Array.from(
    [...visible]
      .sort((first, second) => getItemDate(second).getTime() - getItemDate(first).getTime())
      .reduce((groups, item) => {
        const month = getMonthGroup(item);
        const current = groups.get(month.key);
        if (current) {
          current.items.push(item);
        } else {
          groups.set(month.key, { ...month, items: [item] });
        }
        return groups;
      }, new Map<string, { key: string; label: string; items: CoupleItem[] }>())
      .values(),
  );

  return (
    <>
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
          eyebrow="TUDO QUE VIVEMOS"
          title="Nossa coleção"
          onAdd={onAdd}
          theme={theme}
        />
        <Text style={[styles.introText, { color: theme.muted }]}>
          O nosso pequeno arquivo de histórias, partidas e maratonas.
        </Text>
        <View style={styles.collectionFilterToolbar}>
          <View>
            <Text style={[styles.resultCount, { color: theme.muted }]}>
              {visible.length} {visible.length === 1 ? "registro" : "registros"}
            </Text>
            <Text style={[styles.collectionFilterHint, { color: theme.muted }]}>
              {activeFilterCount
                ? `${activeFilterCount} ${
                    activeFilterCount === 1 ? "filtro ativo" : "filtros ativos"
                  }`
                : "Mostrando toda a coleção"}
            </Text>
          </View>
          <Pressable
            onPress={() => setFiltersVisible(true)}
            style={[
              styles.collectionFilterButton,
              {
                backgroundColor:
                  activeFilterCount > 0 ? theme.accent : theme.surface,
                borderColor: theme.accent,
              },
            ]}
          >
            <Ionicons
              name="options-outline"
              size={19}
              color={activeFilterCount > 0 ? palette.paper : theme.accent}
            />
            <Text
              style={[
                styles.collectionFilterButtonText,
                {
                  color:
                    activeFilterCount > 0 ? palette.paper : theme.accent,
                },
              ]}
            >
              Filtrar
            </Text>
            {activeFilterCount > 0 && (
              <View style={styles.collectionFilterBadge}>
                <Text style={[styles.collectionFilterBadgeText, { color: theme.accent }]}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        {activeFilterLabels.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFilterList}
          >
            {activeFilterLabels.map((label) => (
              <Pressable
                key={label}
                onPress={() => setFiltersVisible(true)}
                style={[
                  styles.activeFilterChip,
                  {
                    backgroundColor: theme.accentSoft,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.activeFilterChipText, { color: theme.accent }]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        {monthGroups.map((group) => (
          <View key={group.key} style={styles.memoryMonthGroup}>
            <View style={styles.memoryMonthDivider}>
              <View
                style={[
                  styles.memoryMonthIcon,
                  { backgroundColor: theme.accentSoft },
                ]}
              >
                <Ionicons
                  name="calendar-clear-outline"
                  size={15}
                  color={theme.accent}
                />
              </View>
              <Text style={[styles.memoryMonthTitle, { color: theme.title }]}>
                {group.label}
              </Text>
              <View
                style={[
                  styles.memoryMonthCount,
                  { backgroundColor: theme.accentSoft },
                ]}
              >
                <Text
                  style={[styles.memoryMonthCountText, { color: theme.accent }]}
                >
                  {group.items.length}
                </Text>
              </View>
              <View
                style={[styles.memoryMonthLine, { backgroundColor: theme.border }]}
              />
            </View>
            {group.items.map((item) => (
              <MemoryCard
                key={item.id}
                item={item}
                theme={theme}
                onEdit={onEdit}
              />
            ))}
          </View>
        ))}
        {visible.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={36} color={theme.accent} />
            <Text style={[styles.emptyTitle, { color: theme.title }]}>
              Nenhuma lembrança encontrada
            </Text>
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              Ajuste ou limpe os filtros para ver outros registros.
            </Text>
          </View>
        )}
      </ScrollView>
      <CollectionFilterModal
        visible={filtersVisible}
        filters={filters}
        availableMonths={availableMonths}
        theme={theme}
        onClose={() => setFiltersVisible(false)}
        onApply={(updatedFilters) => {
          setFilters(updatedFilters);
          setFiltersVisible(false);
        }}
      />
    </>
  );
}
