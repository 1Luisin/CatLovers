import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  createItem,
  getItems,
  getMonthlyGoals,
  getProfiles,
  toggleItemDone,
  updateItem,
  updateProfile,
  updateProfileSettings,
  uploadItemPhoto,
  uploadProfilePhoto,
  upsertMonthlyGoal,
} from "../../src/services/apiClient";
import {
  loadActiveProfileId,
  loadCachedItems,
  loadCachedMonthlyGoals,
  loadCachedProfiles,
  saveActiveProfileId,
  saveCachedItems,
  saveCachedMonthlyGoals,
  saveCachedProfiles,
} from "../../src/services/storageService";

type Category = "Filme" | "Serie" | "Jogo" | "Role" | "Anime" | "Plano";
type MemoryCategory = Exclude<Category, "Plano">;
type IdeaType = MemoryCategory | "Outros";
type Tab = "inicio" | "colecao" | "planos" | "perfil";
type CategoryFilter = "Todos" | MemoryCategory;
type RatingFilter = "Todas" | "Sem avaliacao" | 1 | 2 | 3 | 4 | 5;
type CollectionFilters = {
  category: CategoryFilter;
  month: string | null;
  rating: RatingFilter;
};
type AddMode = "memory" | "plan";
type ThemeName = "Romance" | "Lavanda" | "Floresta" | "Noite" | "Cinnamoroll" | "Chococat";

type AppTheme = {
  accent: string;
  accentSoft: string;
  background: string;
  surface: string;
  border: string;
  title: string;
  muted: string;
  heroColors: readonly [string, string];
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isDark?: boolean;
  character?: "Cinnamoroll" | "Chococat";
};

type Profile = {
  id: string;
  code?: string;
  name: string;
  birthDate: string;
  bio: string;
  photoUri?: string;
  color: string;
  theme: ThemeName;
  notifications: boolean;
  privateProfile?: boolean;
  weeklyQuestion: boolean;
};

type CoupleItem = {
  id: string;
  title: string;
  category: Category;
  ideaType?: IdeaType;
  note: string;
  date: string;
  occurredOn?: string;
  plannedFor?: string;
  completedOn?: string;
  photoUri?: string;
  done: boolean;
  rating?: number;
  color: string;
  createdByProfileId?: string;
};

type MonthlyGoal = {
  monthKey: string;
  title: string;
  description: string;
};

const STORAGE_KEY = "@catlovers/items";
const PROFILES_KEY = "@catlovers/profiles";
const MONTHLY_GOALS_KEY = "@catlovers/monthly-goals";
const PLANS_MONTH_KEY = "2026-06";
const PLANS_MONTH_LABEL = "Junho 2026";
const defaultCollectionFilters: CollectionFilters = {
  category: "Todos",
  month: null,
  rating: "Todas",
};

const palette = {
  ink: "#29242B",
  muted: "#746C73",
  cream: "#FCF8F4",
  paper: "#FFFFFF",
  blush: "#EF9B92",
  rose: "#C65D6C",
  lilac: "#A58AC7",
  sage: "#7C9D8E",
  apricot: "#EBA56E",
  line: "#EDE4DE",
};

const characterImages: Record<
  NonNullable<AppTheme["character"]>,
  ImageSourcePropType
> = {
  Cinnamoroll: require("../../assets/themes/cinnamoroll.png"),
  Chococat: require("../../assets/themes/chococat.png"),
};

const themes: Record<ThemeName, AppTheme> = {
  Romance: {
    accent: "#C65D6C",
    accentSoft: "#F9E9E8",
    background: "#FCF8F4",
    surface: "#FFFFFF",
    border: "#EDE4DE",
    title: palette.ink,
    muted: palette.muted,
    heroColors: ["#D36A76", "#A77BC0"],
    label: "Romance",
    icon: "heart-outline",
  },
  Lavanda: {
    accent: "#9175BA",
    accentSoft: "#EEE8F7",
    background: "#FAF7FD",
    surface: "#FFFFFF",
    border: "#E4DAEF",
    title: palette.ink,
    muted: "#746B7D",
    heroColors: ["#A58AC7", "#C68BAD"],
    label: "Lavanda",
    icon: "flower-outline",
  },
  Floresta: {
    accent: "#557D6B",
    accentSoft: "#E3EFE9",
    background: "#F6FAF7",
    surface: "#FFFFFF",
    border: "#D6E5DC",
    title: "#26382F",
    muted: "#66756D",
    heroColors: ["#668E79", "#8DA978"],
    label: "Floresta",
    icon: "leaf-outline",
  },
  Noite: {
    accent: "#B89BE8",
    accentSoft: "#352D44",
    background: "#18151D",
    surface: "#25212B",
    border: "#403848",
    title: "#FFF8FC",
    muted: "#BEB3BD",
    heroColors: ["#514463", "#785B80"],
    label: "Noite",
    icon: "moon-outline",
    isDark: true,
  },
  Cinnamoroll: {
    accent: "#4BAFDF",
    accentSoft: "#DFF4FF",
    background: "#F3FBFF",
    surface: "#FFFFFF",
    border: "#CDEAF7",
    title: palette.ink,
    muted: "#667681",
    heroColors: ["#62C5EE", "#8FAEEB"],
    label: "Cinnamoroll",
    character: "Cinnamoroll",
  },
  Chococat: {
    accent: "#80563F",
    accentSoft: "#F1E3D2",
    background: "#FFF8EC",
    surface: "#FFFCF6",
    border: "#E6D1B8",
    title: "#4A3026",
    muted: "#78665B",
    heroColors: ["#6A4636", "#A17B5D"],
    label: "Chococat",
    character: "Chococat",
  },
};

function normalizeThemeName(theme: string): ThemeName {
  if (theme === "Dark" || theme === "Noite") return "Noite";
  if (theme === "Lavanda" || theme === "Floresta") return theme;
  if (theme === "Cinnamoroll" || theme === "Chococat") return theme;
  return "Romance";
}

const initialProfiles: Profile[] = [
  {
    id: "leticia",
    name: "Letícia",
    birthDate: "18/09/2003",
    bio: "Apaixonada por histórias, café e pelos nossos domingos sem pressa.",
    color: "#E9A29D",
    theme: "Romance",
    notifications: true,
    weeklyQuestion: true,
  },
  {
    id: "luis",
    name: "Luis",
    birthDate: "03/05/2001",
    bio: "Jogos cooperativos, filmes longos e qualquer plano que seja a dois.",
    color: "#9B8BC1",
    theme: "Lavanda",
    notifications: true,
    weeklyQuestion: false,
  },
];

const initialItems: CoupleItem[] = [
  {
    id: "1",
    title: "Maratona de Severance",
    category: "Serie",
    note: "Dois episódios e sobremesa no sofá.",
    date: "12 JUN",
    done: true,
    rating: 5,
    color: palette.lilac,
  },
  {
    id: "2",
    title: "It Takes Two",
    category: "Jogo",
    note: "Terminamos o capítulo do jardim.",
    date: "02 JUN",
    done: true,
    rating: 5,
    color: palette.sage,
  },
  {
    id: "3",
    title: "Past Lives",
    category: "Filme",
    note: "Bonito, delicado e rendeu uma conversa enorme.",
    date: "28 MAI",
    done: true,
    rating: 4,
    color: palette.rose,
  },
  {
    id: "4",
    title: "Café novo no centro",
    category: "Plano",
    ideaType: "Role",
    note: "Ir de manhã e caminhar pela livraria depois.",
    date: "21 JUN",
    plannedFor: "2026-06-21",
    done: false,
    color: palette.apricot,
  },
  {
    id: "5",
    title: "Noite sem celular",
    category: "Plano",
    ideaType: "Role",
    note: "Jantar feito juntos e cartas na mesa.",
    date: "27 JUN",
    plannedFor: "2026-06-27",
    done: false,
    color: palette.blush,
  },
];

const initialMonthlyGoals: Record<string, MonthlyGoal> = {
  [PLANS_MONTH_KEY]: {
    monthKey: PLANS_MONTH_KEY,
    title: "Mais tempo para nós",
    description: "Sem pressa. O importante é fazer caber na vida real.",
  },
};

const categoryMeta: Record<
  Category,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  Filme: { icon: "film-outline", color: palette.rose, label: "Filme" },
  Serie: { icon: "tv-outline", color: palette.lilac, label: "Série" },
  Jogo: { icon: "game-controller-outline", color: palette.sage, label: "Jogo" },
  Role: { icon: "location-outline", color: "#D48A62", label: "Rolê" },
  Anime: { icon: "sparkles-outline", color: "#7D78B8", label: "Anime" },
  Plano: { icon: "calendar-outline", color: palette.apricot, label: "Plano" },
};

const ideaTypeMeta: Record<
  IdeaType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  Filme: categoryMeta.Filme,
  Serie: categoryMeta.Serie,
  Jogo: categoryMeta.Jogo,
  Role: categoryMeta.Role,
  Anime: categoryMeta.Anime,
  Outros: {
    icon: "ellipsis-horizontal-outline",
    color: "#8B8388",
    label: "Outros",
  },
};

const memoryCategories: MemoryCategory[] = [
  "Filme",
  "Serie",
  "Jogo",
  "Role",
  "Anime",
];

const ideaTypes: IdeaType[] = [...memoryCategories, "Outros"];

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const monthAbbreviations = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

const weekdayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
const calendarWeekdayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const legacyTextCorrections: Record<string, string> = {
  Leticia: "Letícia",
  "Apaixonada por historias, cafe e pelos nossos domingos sem pressa.":
    "Apaixonada por histórias, café e pelos nossos domingos sem pressa.",
  "Dois episodios e sobremesa no sofa.": "Dois episódios e sobremesa no sofá.",
  "Terminamos o capitulo do jardim.": "Terminamos o capítulo do jardim.",
  "Cafe novo no centro": "Café novo no centro",
  "Ir de manha e caminhar pela livraria depois.":
    "Ir de manhã e caminhar pela livraria depois.",
};

function correctLegacyText(value: string) {
  return legacyTextCorrections[value] ?? value;
}

function formatFullDate(value: string) {
  const date = fromIsoDate(value);
  return `${String(date.getDate()).padStart(2, "0")} de ${
    monthNames[date.getMonth()]
  } de ${date.getFullYear()}`;
}

function formatCardDate(value: string) {
  const date = fromIsoDate(value);
  return `${String(date.getDate()).padStart(2, "0")} ${
    monthAbbreviations[date.getMonth()]
  }`;
}

function getLegacyCardDate(item: CoupleItem) {
  const [dayText, monthText] = item.date.toUpperCase().split(" ");
  const month = monthAbbreviations.indexOf(monthText);
  const day = Number(dayText);
  if (month < 0 || !day) return undefined;

  return toIsoDate(new Date(new Date().getFullYear(), month, day));
}

function getPlanCalendarDate(item: CoupleItem) {
  if (item.category !== "Plano") return undefined;
  const plannedFor = item.plannedFor ?? getLegacyCardDate(item);
  return item.done ? item.completedOn ?? plannedFor : plannedFor;
}

function getItemDate(item: CoupleItem) {
  if (item.occurredOn) return fromIsoDate(item.occurredOn);

  const legacyDate = getLegacyCardDate(item);
  return legacyDate ? fromIsoDate(legacyDate) : new Date(0);
}

function getMonthGroup(item: CoupleItem) {
  const date = getItemDate(item);
  if (date.getTime() === 0) {
    return { key: "sem-data", label: "Sem data" };
  }
  return {
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
  };
}

const tabs: Array<{
  key: Tab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: "inicio", label: "Início", icon: "home-outline", activeIcon: "home" },
  {
    key: "colecao",
    label: "Coleção",
    icon: "albums-outline",
    activeIcon: "albums",
  },
  {
    key: "planos",
    label: "Planos",
    icon: "calendar-outline",
    activeIcon: "calendar",
  },
  {
    key: "perfil",
    label: "Perfil",
    icon: "person-outline",
    activeIcon: "person",
  },
];

function ThemeDecorations({ theme }: { theme: AppTheme }) {
  if (!theme.character) return null;

  const image = characterImages[theme.character];
  const isCinnamoroll = theme.character === "Cinnamoroll";

  return (
    <View style={styles.themeDecorations}>
      <View
        style={[
          styles.themeBubble,
          styles.themeBubbleTop,
          { backgroundColor: theme.accentSoft },
        ]}
      />
      <View
        style={[
          styles.themeBubble,
          styles.themeBubbleBottom,
          { backgroundColor: theme.accentSoft },
        ]}
      />
      <Ionicons
        name={isCinnamoroll ? "cloud-outline" : "star-outline"}
        size={25}
        color={`${theme.accent}58`}
        style={styles.themeCornerIcon}
      />
      <Image
        source={image}
        resizeMode="contain"
        style={[
          styles.themeCharacterTop,
          isCinnamoroll && styles.cinnamorollCharacterTop,
        ]}
      />
      <Image
        source={image}
        resizeMode="contain"
        style={[
          styles.themeCharacterBottom,
          isCinnamoroll && styles.cinnamorollCharacterBottom,
        ]}
      />
    </View>
  );
}

function ProfileAvatar({
  profile,
  size = 72,
  border = false,
}: {
  profile: Profile;
  size?: number;
  border?: boolean;
}) {
  return (
    <View
      style={[
        styles.profileAvatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: profile.color,
          borderWidth: border ? 4 : 0,
        },
      ]}
    >
      {profile.photoUri ? (
        <Image source={{ uri: profile.photoUri }} style={styles.avatarImage} />
      ) : (
        <Text style={[styles.profileInitial, { fontSize: size * 0.34 }]}>
          {profile.name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

function ProfileGate({
  profiles,
  onSelect,
}: {
  profiles: Profile[];
  onSelect: (id: Profile["id"]) => void;
}) {
  return (
    <LinearGradient
      colors={["#FCF8F4", "#F3E8F0"]}
      style={styles.gateContainer}
    >
      <View style={styles.gateBrand}>
        <View style={styles.gateLogo}>
          <Ionicons name="heart" size={25} color={palette.paper} />
        </View>
        <Text style={styles.gateBrandName}>CatLovers</Text>
        <Text style={styles.gateBrandTag}>NOSSO CANTINHO</Text>
      </View>

      <View style={styles.gateContent}>
        <Text style={styles.gateTitle}>Quem está entrando?</Text>
        <Text style={styles.gateSubtitle}>
          Escolha seu perfil. Aqui não tem senha, só o nosso espaço compartilhado.
        </Text>
        <View style={styles.profileChoices}>
          {profiles.map((profile) => (
            <Pressable
              key={profile.id}
              onPress={() => onSelect(profile.id)}
              style={({ pressed }) => [
                styles.profileChoice,
                pressed && styles.pressed,
              ]}
            >
              <ProfileAvatar profile={profile} size={92} border />
              <Text style={styles.profileChoiceName}>{profile.name}</Text>
              <View style={styles.enterProfile}>
                <Text style={styles.enterProfileText}>Entrar</Text>
                <Ionicons name="arrow-forward" size={14} color={palette.rose} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.gatePrivacy}>
        <Ionicons name="lock-closed-outline" size={14} color={palette.muted} />
        <Text style={styles.gatePrivacyText}>Perfis salvos somente neste aparelho</Text>
      </View>
    </LinearGradient>
  );
}

function AppHeader({
  eyebrow,
  title,
  onAdd,
  addAccessibilityLabel,
  theme,
}: {
  eyebrow: string;
  title: string;
  onAdd?: () => void;
  addAccessibilityLabel?: string;
  theme: AppTheme;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.eyebrow, { color: theme.accent }]}>{eyebrow}</Text>
        <Text style={[styles.pageTitle, { color: theme.title }]}>{title}</Text>
      </View>
      {onAdd && (
        <Pressable
          accessibilityLabel={addAccessibilityLabel}
          onPress={onAdd}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: theme.accent, shadowColor: theme.accent },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add" size={25} color={palette.paper} />
        </Pressable>
      )}
    </View>
  );
}

function CategoryPill({ category }: { category: Category }) {
  const meta = categoryMeta[category];
  return (
    <View style={[styles.categoryPill, { backgroundColor: `${meta.color}18` }]}>
      <Ionicons name={meta.icon} size={13} color={meta.color} />
      <Text style={[styles.categoryPillText, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

function MemoryCard({
  item,
  theme,
  onEdit,
}: {
  item: CoupleItem;
  theme: AppTheme;
  onEdit?: (item: CoupleItem) => void;
}) {
  return (
    <View
      style={[
        styles.memoryCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={[styles.memoryStripe, { backgroundColor: item.color }]} />
      <View style={styles.memoryBody}>
        <View style={styles.memoryTop}>
          <CategoryPill category={item.category} />
          <View style={styles.memoryTopActions}>
            <Text style={[styles.dateText, { color: theme.muted }]}>
              {item.date}
            </Text>
            {onEdit && (
              <Pressable
                accessibilityLabel={`Editar ${item.title}`}
                onPress={() => onEdit(item)}
                style={({ pressed }) => [
                  styles.memoryEditButton,
                  {
                    backgroundColor: theme.accentSoft,
                    borderColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="pencil-outline"
                  size={14}
                  color={theme.accent}
                />
              </Pressable>
            )}
          </View>
        </View>
        <Text style={[styles.memoryTitle, { color: theme.title }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.memoryNote, { color: theme.muted }]}
          numberOfLines={2}
        >
          {item.note}
        </Text>
        {item.photoUri && (
          <Image
            source={{ uri: item.photoUri }}
            resizeMode="cover"
            style={styles.memoryPhoto}
          />
        )}
        <View style={styles.memoryFooter}>
          {item.rating ? (
            <View style={styles.ratingRow}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Ionicons
                  key={index}
                  name={index < item.rating! ? "star" : "star-outline"}
                  size={14}
                  color={palette.apricot}
                />
              ))}
            </View>
          ) : (
            <Text style={[styles.memorySavedText, { color: theme.muted }]}>
              Lembrança guardada
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function HomeScreen({
  items,
  profile,
  onViewAll,
  theme,
}: {
  items: CoupleItem[];
  profile: Profile;
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
            <View style={[styles.avatar, { backgroundColor: "#F6C7A8" }]}>
              <Text style={styles.avatarText}>LE</Text>
            </View>
            <View
              style={[
                styles.avatar,
                styles.avatarOverlap,
                { backgroundColor: "#C5B5DD" },
              ]}
            >
              <Text style={styles.avatarText}>LU</Text>
            </View>
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
            {items.length}
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

function CollectionFilterModal({
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
      animationType="fade"
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

function CollectionScreen({
  items,
  onAdd,
  onEdit,
  theme,
}: {
  items: CoupleItem[];
  onAdd: () => void;
  onEdit: (item: CoupleItem) => void;
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
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

function MonthlyGoalModal({
  visible,
  monthKey,
  monthLabel,
  goal,
  theme,
  onClose,
  onSave,
}: {
  visible: boolean;
  monthKey: string;
  monthLabel: string;
  goal?: MonthlyGoal;
  theme: AppTheme;
  onClose: () => void;
  onSave: (goal: MonthlyGoal) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const isEditing = Boolean(goal);

  useEffect(() => {
    if (!visible) return;
    setTitle(goal?.title ?? "");
    setDescription(goal?.description ?? "");
  }, [goal, visible]);

  const save = () => {
    if (!title.trim()) {
      Alert.alert("Falta um título", "Dê um título para a meta mensal.");
      return;
    }
    if (!description.trim()) {
      Alert.alert(
        "Falta uma descrição",
        "Conte como vocês pretendem viver essa meta.",
      );
      return;
    }
    onSave({
      monthKey,
      title: title.trim(),
      description: description.trim(),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalDismiss} onPress={onClose} />
        <View
          style={[styles.goalModalSheet, { backgroundColor: theme.background }]}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, { color: theme.accent }]}>
                {monthLabel.toUpperCase()}
              </Text>
              <Text style={[styles.modalTitle, { color: theme.title }]}>
                {isEditing ? "Editar meta mensal" : "Criar meta mensal"}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Fechar meta mensal"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="close" size={22} color={theme.title} />
            </Pressable>
          </View>

          <Text style={[styles.goalModalIntro, { color: theme.muted }]}>
            Cada mês pode ter uma única meta compartilhada.
          </Text>

          <Text style={[styles.inputLabel, { color: theme.title }]}>Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex.: Mais tempo para nós"
            placeholderTextColor="#AFA4AA"
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.title,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.title }]}>
            Descrição
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Como vocês querem colocar essa meta em prática?"
            placeholderTextColor="#AFA4AA"
            style={[
              styles.input,
              styles.goalDescriptionInput,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.title,
              },
            ]}
            multiline
            maxLength={220}
          />
          <Text style={styles.characterCount}>{description.length}/220</Text>

          <Pressable onPress={save} style={styles.saveButton}>
            <LinearGradient
              colors={theme.heroColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveButtonText}>
                {isEditing ? "Salvar meta mensal" : "Criar meta mensal"}
              </Text>
              <Ionicons name="flag" size={17} color={palette.paper} />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PlansScreen({
  items,
  monthlyGoal,
  onConfigureGoal,
  onAddIdea,
  onToggle,
  theme,
}: {
  items: CoupleItem[];
  monthlyGoal?: MonthlyGoal;
  onConfigureGoal: () => void;
  onAddIdea: () => void;
  onToggle: (id: string) => void;
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
    <ScrollView contentContainerStyle={styles.scrollContent}>
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
                backgroundColor: theme.accent,
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

function SettingSwitch({
  icon,
  label,
  description,
  value,
  accent,
  titleColor,
  descriptionColor,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  value: boolean;
  accent: string;
  titleColor: string;
  descriptionColor: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: `${accent}16` }]}>
        <Ionicons name={icon} size={19} color={accent} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, { color: titleColor }]}>{label}</Text>
        <Text style={[styles.settingDescription, { color: descriptionColor }]}>
          {description}
        </Text>
      </View>
      <Switch
        {...(Platform.OS === "web" ? { activeThumbColor: accent } : {})}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#DDD4D8", true: `${accent}75` }}
        thumbColor={value ? accent : "#F7F4F5"}
      />
    </View>
  );
}

function ExpandableSetting({
  icon,
  title,
  description,
  accent,
  theme,
  maxHeight,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accent: string;
  theme: AppTheme;
  maxHeight: number;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [renderContent, setRenderContent] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: expanded ? 260 : 210,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !expanded) setRenderContent(false);
    });
  }, [expanded, progress]);

  const toggle = () => {
    if (!expanded) setRenderContent(true);
    setExpanded((current) => !current);
  };

  const panelHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxHeight],
  });
  const panelOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });
  const chevronRotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <>
      <Pressable
        onPress={toggle}
        style={styles.actionSettingRow}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={[styles.settingIcon, { backgroundColor: `${accent}16` }]}>
          <Ionicons name={icon} size={20} color={accent} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingLabel, { color: theme.title }]}>
            {title}
          </Text>
          <Text style={[styles.settingDescription, { color: theme.muted }]}>
            {description}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <Ionicons name="chevron-forward" size={18} color={theme.muted} />
        </Animated.View>
      </Pressable>
      {renderContent && (
        <Animated.View
          pointerEvents={expanded ? "auto" : "none"}
          accessibilityElementsHidden={!expanded}
          importantForAccessibility={
            expanded ? "auto" : "no-hide-descendants"
          }
          style={[
            styles.disclosurePanel,
            {
              maxHeight: panelHeight,
              opacity: progress,
              transform: [{ translateY: panelOffset }],
            },
          ]}
        >
          <View
            style={[
              styles.disclosureBox,
              { backgroundColor: theme.accentSoft },
            ]}
          >
            {children}
          </View>
        </Animated.View>
      )}
    </>
  );
}

function ProfileScreen({
  profile,
  items,
  theme,
  onEdit,
  onUpdate,
  onSwitchProfile,
}: {
  profile: Profile;
  items: CoupleItem[];
  theme: AppTheme;
  onEdit: () => void;
  onUpdate: (profile: Profile) => void;
  onSwitchProfile: () => void;
}) {
  const completed = items.filter((item) => item.done).length;
  const accent = theme.accent;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: accent }]}>MINHA CONTA</Text>
          <Text style={[styles.pageTitle, { color: theme.title }]}>Perfil</Text>
        </View>
        <Pressable
          onPress={onEdit}
          style={[
            styles.editProfileButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="pencil-outline" size={19} color={accent} />
        </Pressable>
      </View>

      <View
        style={[
          styles.profileHero,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View>
          <ProfileAvatar profile={profile} size={104} border />
          <Pressable
            onPress={onEdit}
            style={[styles.photoBadge, { backgroundColor: accent }]}
          >
            <Ionicons name="camera" size={16} color={palette.paper} />
          </Pressable>
        </View>
        <Text style={[styles.profileName, { color: theme.title }]}>
          {profile.name}
        </Text>
        <Text style={[styles.profileBirth, { color: theme.muted }]}>
          <Ionicons name="gift-outline" size={12} color={theme.muted} />{" "}
          {profile.birthDate}
        </Text>
        <Text style={[styles.profileBio, { color: theme.muted }]}>
          {profile.bio}
        </Text>
        <Pressable
          onPress={onEdit}
          style={[styles.outlineProfileButton, { borderColor: `${accent}55` }]}
        >
          <Text style={[styles.outlineProfileButtonText, { color: accent }]}>
            Editar perfil
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.profileStats,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.profileStat}>
          <Text style={[styles.profileStatValue, { color: theme.title }]}>
            {completed}
          </Text>
          <Text style={[styles.profileStatLabel, { color: theme.muted }]}>
            memórias
          </Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStat}>
          <Text style={[styles.profileStatValue, { color: theme.title }]}>
            {items.filter((item) => !item.done).length}
          </Text>
          <Text style={[styles.profileStatLabel, { color: theme.muted }]}>
            planos
          </Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStat}>
          <Text style={[styles.profileStatValue, { color: theme.title }]}>
            1
          </Text>
          <Text style={[styles.profileStatLabel, { color: theme.muted }]}>
             Dias junto
          </Text>
        </View>
      </View>

      <Text style={[styles.settingsSectionTitle, { color: theme.title }]}>
        Aparência
      </Text>
      <View
        style={[
          styles.settingsCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.themeHint, { color: theme.muted }]}>
          Tema do aplicativo
        </Text>
        <View style={styles.themeOptions}>
          {(Object.keys(themes) as ThemeName[]).map((themeName) => {
            const optionTheme = themes[themeName];
            const active = profile.theme === themeName;
            return (
              <Pressable
                key={themeName}
                onPress={() => onUpdate({ ...profile, theme: themeName })}
                style={styles.themeOption}
              >
                <View
                  style={[
                    styles.themeSwatch,
                    {
                      backgroundColor: optionTheme.character
                        ? optionTheme.accent
                        : optionTheme.surface,
                      borderColor: active
                        ? optionTheme.accent
                        : optionTheme.border,
                    },
                    active && styles.themeSwatchActive,
                  ]}
                >
                  {optionTheme.character ? (
                    <Image
                      source={characterImages[optionTheme.character]}
                      resizeMode="contain"
                      style={styles.themeSwatchCharacter}
                    />
                  ) : (
                    <Ionicons
                      name={optionTheme.icon ?? "color-palette-outline"}
                      size={22}
                      color={optionTheme.accent}
                    />
                  )}
                  {active && (
                    <View style={styles.themeSwatchCheck}>
                      <Ionicons
                        name="checkmark"
                        size={11}
                        color={palette.paper}
                      />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.themeName,
                    { color: theme.muted },
                    active && {
                      color: optionTheme.accent,
                      fontWeight: "800",
                    },
                  ]}
                >
                  {optionTheme.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={[styles.settingsSectionTitle, { color: theme.title }]}>
        Preferências
      </Text>
      <View
        style={[
          styles.settingsCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <SettingSwitch
          icon="notifications-outline"
          label="Lembretes do casal"
          description="Planos próximos e datas especiais"
          value={profile.notifications}
          accent={accent}
          titleColor={theme.title}
          descriptionColor={theme.muted}
          onChange={(notifications) => onUpdate({ ...profile, notifications })}
        />
        <View
          style={[styles.settingDivider, { backgroundColor: theme.border }]}
        />
        <SettingSwitch
          icon="chatbubbles-outline"
          label="Pergunta da semana"
          description="Uma pergunta nova para responder juntos"
          value={profile.weeklyQuestion}
          accent={accent}
          titleColor={theme.title}
          descriptionColor={theme.muted}
          onChange={(weeklyQuestion) => onUpdate({ ...profile, weeklyQuestion })}
        />
      </View>

      <Text style={[styles.settingsSectionTitle, { color: theme.title }]}>
        CatLovers
      </Text>
      <View
        style={[
          styles.settingsCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <ExpandableSetting
          icon="heart-circle-outline"
          title="Sobre o aplicativo"
          description="Versão 1.1.0"
          accent={accent}
          theme={theme}
          maxHeight={180}
        >
          <Text style={[styles.aboutText, { color: theme.muted }]}>
            CatLovers é o nosso cantinho para guardar histórias, escolher o
            próximo evento e transformar planos simples em memória.
          </Text>
          <Text style={[styles.aboutSignature, { color: accent }]}>
            Feito com carinho para nós dois.
          </Text>
        </ExpandableSetting>
        <View
          style={[styles.settingDivider, { backgroundColor: theme.border }]}
        />
        <ExpandableSetting
          icon="document-text-outline"
          title="Privacidade e dados"
          description="Como suas informações serão tratadas"
          accent={accent}
          theme={theme}
          maxHeight={620}
        >
          <Text style={[styles.privacyIntro, { color: theme.muted }]}>
            Hoje os registros ficam no armazenamento local. Quando a
            sincronização for ativada, os dados serão enviados pela API e
            armazenados no banco do CatLovers.
          </Text>
          {[
            {
              title: "Dados tratados",
              text: "Perfil, preferências, lembranças, planos, datas, avaliações, metas e imagens adicionadas.",
            },
            {
              title: "Finalidade",
              text: "Manter a conta, sincronizar o casal entre dispositivos e disponibilizar as funções do aplicativo.",
            },
            {
              title: "Compartilhamento",
              text: "Os dados não serão vendidos. O acesso será limitado à infraestrutura necessária para operar a API, o banco e o armazenamento.",
            },
            {
              title: "Seus direitos",
              text: "Será possível solicitar confirmação, acesso, correção, portabilidade e exclusão, conforme a integração da conta for implementada.",
            },
            {
              title: "Segurança e retenção",
              text: "A transmissão deverá usar conexão segura, acesso autenticado e retenção somente pelo período necessário à prestação do serviço.",
            },
          ].map((section) => (
            <View key={section.title} style={styles.privacySection}>
              <Text style={[styles.privacyTitle, { color: theme.title }]}>
                {section.title}
              </Text>
              <Text style={[styles.privacyText, { color: theme.muted }]}>
                {section.text}
              </Text>
            </View>
          ))}
          <Text style={[styles.privacyDocumentHint, { color: accent }]}>
            Consulte também PRIVACIDADE_E_DADOS.md no projeto.
          </Text>
        </ExpandableSetting>
      </View>

      <Pressable
        onPress={onSwitchProfile}
        style={[styles.switchProfileButton, { borderColor: `${accent}55` }]}
      >
        <Ionicons name="swap-horizontal-outline" size={19} color={accent} />
        <Text style={[styles.switchProfileText, { color: accent }]}>
          Trocar de perfil
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function EditProfileModal({
  visible,
  profile,
  accent,
  onClose,
  onSave,
}: {
  visible: boolean;
  profile: Profile;
  accent: string;
  onClose: () => void;
  onSave: (profile: Profile) => void;
}) {
  const [draft, setDraft] = useState(profile);

  useEffect(() => {
    if (visible) setDraft(profile);
  }, [profile, visible]);

  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso às fotos para escolher uma imagem de perfil.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setDraft((current) => ({
        ...current,
        photoUri: result.assets[0].uri,
      }));
    }
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.editModalPage}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.editModalPage}
        >
          <View style={styles.fullModalHeader}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={palette.ink} />
            </Pressable>
            <Text style={styles.fullModalTitle}>Editar perfil</Text>
            <Pressable
              onPress={() => {
                if (!draft.name.trim()) {
                  Alert.alert("Nome obrigatório", "Informe o nome do perfil.");
                  return;
                }
                onSave({ ...draft, name: draft.name.trim() });
              }}
            >
              <Text style={[styles.fullModalSave, { color: accent }]}>Salvar</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.editProfileContent}>
            <Pressable onPress={choosePhoto} style={styles.editPhotoArea}>
              <ProfileAvatar profile={draft} size={112} border />
              <View style={[styles.editPhotoBadge, { backgroundColor: accent }]}>
                <Ionicons name="camera" size={18} color={palette.paper} />
              </View>
              <Text style={[styles.changePhotoText, { color: accent }]}>
                Alterar foto
              </Text>
            </Pressable>

            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="#AFA4AA"
            />
            <Text style={styles.inputLabel}>Data de nascimento</Text>
            <TextInput
              value={draft.birthDate}
              onChangeText={(birthDate) => setDraft({ ...draft, birthDate })}
              style={styles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#AFA4AA"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              value={draft.bio}
              onChangeText={(bio) => setDraft({ ...draft, bio })}
              style={[styles.input, styles.profileBioInput]}
              placeholder="Conte um pouco sobre você"
              placeholderTextColor="#AFA4AA"
              multiline
              maxLength={180}
            />
            <Text style={styles.characterCount}>{draft.bio.length}/180</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function DateCalendar({
  selectedDate,
  visibleMonth,
  range,
  theme,
  onChangeMonth,
  onSelect,
}: {
  selectedDate?: string;
  visibleMonth: Date;
  range: "past" | "future";
  theme: AppTheme;
  onChangeMonth: (month: Date) => void;
  onSelect: (date: string) => void;
}) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayIso = toIsoDate(today);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoPrevious = range === "past" || visibleMonth > currentMonth;
  const canGoNext = range === "future" || visibleMonth < currentMonth;
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  return (
    <View
      style={[
        styles.calendarCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.calendarHeader}>
        <Pressable
          disabled={!canGoPrevious}
          onPress={() => onChangeMonth(new Date(year, month - 1, 1))}
          style={[
            styles.calendarNavButton,
            !canGoPrevious && styles.calendarNavDisabled,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={canGoPrevious ? theme.accent : "#CFC5BF"}
          />
        </Pressable>
        <Text style={[styles.calendarMonth, { color: theme.title }]}>
          {monthNames[month]} {year}
        </Text>
        <Pressable
          disabled={!canGoNext}
          onPress={() => onChangeMonth(new Date(year, month + 1, 1))}
          style={[styles.calendarNavButton, !canGoNext && styles.calendarNavDisabled]}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={canGoNext ? theme.accent : "#CFC5BF"}
          />
        </Pressable>
      </View>

      <View style={styles.calendarGrid}>
        {weekdayLabels.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.calendarWeekday}>
            {label}
          </Text>
        ))}
        {cells.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
          }
          const isoDate = toIsoDate(new Date(year, month, day));
          const selected = isoDate === selectedDate;
          const disabled =
            isoDate !== selectedDate &&
            (range === "past" ? isoDate > todayIso : isoDate < todayIso);
          return (
            <Pressable
              key={isoDate}
              disabled={disabled}
              onPress={() => onSelect(isoDate)}
              style={styles.calendarDayCell}
            >
              <View
                style={[
                  styles.calendarDay,
                  selected && { backgroundColor: theme.accent },
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    selected && styles.calendarDayTextSelected,
                    disabled && styles.calendarDayTextDisabled,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CategorySelector({
  label,
  category,
  options,
  theme,
  onChange,
}: {
  label: string;
  category: IdeaType;
  options: IdeaType[];
  theme: AppTheme;
  onChange: (category: IdeaType) => void;
}) {
  return (
    <>
      <Text style={[styles.inputLabel, { color: theme.title }]}>{label}</Text>
      <View style={styles.categoryGrid}>
        {options.map((item) => {
          const meta = ideaTypeMeta[item];
          const active = category === item;
          return (
            <Pressable
              key={item}
              onPress={() => onChange(item)}
              style={[
                styles.categoryOption,
                active && {
                  borderColor: meta.color,
                  backgroundColor: `${meta.color}12`,
                },
              ]}
            >
              <Ionicons
                name={meta.icon}
                size={20}
                color={active ? meta.color : palette.muted}
              />
              <Text
                style={[
                  styles.categoryOptionText,
                  active && { color: meta.color },
                ]}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function AddModal({
  visible,
  mode,
  editingItem,
  theme,
  onClose,
  onSave,
}: {
  visible: boolean;
  mode: AddMode;
  editingItem?: CoupleItem;
  theme: AppTheme;
  onClose: () => void;
  onSave: (item: CoupleItem) => void;
}) {
  const [category, setCategory] = useState<MemoryCategory>("Filme");
  const [ideaType, setIdeaType] = useState<IdeaType>("Role");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [plannedDate, setPlannedDate] = useState<string>();
  const [photoUri, setPhotoUri] = useState<string>();
  const [rating, setRating] = useState(0);
  const isPlan = mode === "plan";
  const isEditingMemory =
    mode === "memory" &&
    Boolean(editingItem) &&
    editingItem?.category !== "Plano";

  useEffect(() => {
    if (!visible) return;
    const today = new Date();
    const editingDate = editingItem
      ? editingItem.occurredOn ?? toIsoDate(getItemDate(editingItem))
      : null;
    const initialDate = editingDate ?? toIsoDate(today);
    const initialDateValue = fromIsoDate(initialDate);

    setTitle(editingItem?.title ?? "");
    setNote(editingItem?.note ?? "");
    setCategory(
      editingItem && editingItem.category !== "Plano"
        ? editingItem.category
        : "Filme",
    );
    setIdeaType(editingItem?.ideaType ?? "Role");
    setSelectedDate(initialDate);
    setVisibleMonth(
      new Date(initialDateValue.getFullYear(), initialDateValue.getMonth(), 1),
    );
    setCalendarVisible(false);
    setPlannedDate(undefined);
    setPhotoUri(editingItem?.photoUri);
    setRating(editingItem?.rating ?? 0);
  }, [editingItem, mode, visible]);

  const chooseMemoryPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso às fotos para escolher uma imagem da lembrança.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const save = () => {
    if (!title.trim()) {
      Alert.alert(
        "Falta um título",
        isPlan ? "Dê um nome para esse plano." : "Dê um nome para essa lembrança.",
      );
      return;
    }
    const savedCategory: Category = isPlan ? "Plano" : category;
    onSave({
      ...editingItem,
      id: editingItem?.id ?? Date.now().toString(),
      title: title.trim(),
      note:
        note.trim() ||
        (isPlan
          ? "Um novo momento para viver juntos."
          : "Uma lembrança especial guardada juntos."),
      category: savedCategory,
      ideaType: isPlan ? ideaType : undefined,
      date: isPlan
        ? plannedDate
          ? formatCardDate(plannedDate)
          : "EM BREVE"
        : formatCardDate(selectedDate),
      occurredOn: isPlan ? undefined : selectedDate,
      plannedFor: isPlan ? plannedDate : undefined,
      photoUri: isPlan ? undefined : photoUri,
      done: editingItem?.done ?? !isPlan,
      rating: isPlan || rating === 0 ? undefined : rating,
      color: isPlan
        ? ideaTypeMeta[ideaType].color
        : categoryMeta[savedCategory].color,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalDismiss} onPress={onClose} />
        <View
          style={[styles.modalSheet, { backgroundColor: theme.background }]}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, { color: theme.accent }]}>
                {isPlan
                  ? "PLANEJAR JUNTOS"
                  : isEditingMemory
                    ? "ATUALIZAR LEMBRANÇA"
                    : "GUARDAR JUNTOS"}
              </Text>
              <Text style={[styles.modalTitle, { color: theme.title }]}>
                {isPlan
                  ? "Novo plano"
                  : isEditingMemory
                    ? "Editar lembrança"
                    : "Nova lembrança"}
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
            contentContainerStyle={styles.modalBodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {isPlan ? (
            <>
              <CategorySelector
                label="Tipo de ideia"
                category={ideaType}
                options={ideaTypes}
                theme={theme}
                onChange={setIdeaType}
              />

              <Text style={[styles.inputLabel, { color: theme.title }]}>
                Data prevista (opcional)
              </Text>
              <Pressable
                onPress={() => setCalendarVisible((current) => !current)}
                style={[
                  styles.datePickerButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.datePickerIcon,
                    { backgroundColor: theme.accentSoft },
                  ]}
                >
                  <Ionicons
                    name={
                      plannedDate
                        ? "calendar-outline"
                        : "calendar-clear-outline"
                    }
                    size={19}
                    color={theme.accent}
                  />
                </View>
                <View style={styles.datePickerText}>
                  <Text style={[styles.datePickerValue, { color: theme.title }]}>
                    {plannedDate
                      ? formatFullDate(plannedDate)
                      : "Sem data prevista"}
                  </Text>
                  <Text style={styles.datePickerHint}>
                    {plannedDate
                      ? "Toque para escolher outra data"
                      : "Toque para escolher uma data"}
                  </Text>
                </View>
                <Ionicons
                  name={calendarVisible ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.accent}
                />
              </Pressable>
              {calendarVisible && (
                <DateCalendar
                  selectedDate={plannedDate}
                  visibleMonth={visibleMonth}
                  range="future"
                  theme={theme}
                  onChangeMonth={setVisibleMonth}
                  onSelect={(date) => {
                    setPlannedDate(date);
                    setCalendarVisible(false);
                  }}
                />
              )}
              {plannedDate && (
                <Pressable
                  onPress={() => {
                    setPlannedDate(undefined);
                    setCalendarVisible(false);
                  }}
                  style={styles.clearPlannedDateButton}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={16}
                    color={theme.accent}
                  />
                  <Text
                    style={[
                      styles.clearPlannedDateText,
                      { color: theme.accent },
                    ]}
                  >
                    Remover data prevista
                  </Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              <CategorySelector
                label="Que lembrança vamos guardar?"
                category={category}
                options={memoryCategories}
                theme={theme}
                onChange={(selectedCategory) =>
                  selectedCategory !== "Outros" && setCategory(selectedCategory)
                }
              />

              <Text style={[styles.inputLabel, { color: theme.title }]}>
                Quando aconteceu?
              </Text>
              <Pressable
                onPress={() => setCalendarVisible((current) => !current)}
                style={[
                  styles.datePickerButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.datePickerIcon,
                    { backgroundColor: theme.accentSoft },
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color={theme.accent}
                  />
                </View>
                <View style={styles.datePickerText}>
                  <Text style={[styles.datePickerValue, { color: theme.title }]}>
                    {formatFullDate(selectedDate)}
                  </Text>
                  <Text style={styles.datePickerHint}>
                    Toque para escolher outra data
                  </Text>
                </View>
                <Ionicons
                  name={calendarVisible ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.accent}
                />
              </Pressable>
              {calendarVisible && (
                <DateCalendar
                  selectedDate={selectedDate}
                  visibleMonth={visibleMonth}
                  range="past"
                  theme={theme}
                  onChangeMonth={setVisibleMonth}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setCalendarVisible(false);
                  }}
                />
              )}
            </>
          )}

          <Text style={[styles.inputLabel, { color: theme.title }]}>Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={isPlan ? "Ex.: Conhecer um café novo" : "Ex.: Cinema na sexta"}
            placeholderTextColor="#AFA4AA"
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.title,
              },
            ]}
          />
          <Text style={[styles.inputLabel, { color: theme.title }]}>
            {isPlan ? "Detalhes do plano" : "Um detalhe para lembrar"}
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={
              isPlan
                ? "O que vocês querem fazer?"
                : "O que tornou esse momento nosso?"
            }
            placeholderTextColor="#AFA4AA"
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.title,
              },
            ]}
            multiline
          />

          {!isPlan && (
            <>
              <Text style={[styles.inputLabel, { color: theme.title }]}>
                Quantas estrelas essa lembrança merece?
              </Text>
              <View
                style={[
                  styles.ratingPicker,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.ratingPickerStars}>
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    const selected = value <= rating;
                    return (
                      <Pressable
                        key={value}
                        accessibilityLabel={`${value} ${
                          value === 1 ? "estrela" : "estrelas"
                        }`}
                        onPress={() => setRating(value)}
                        style={({ pressed }) => [
                          styles.ratingStarButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name={selected ? "star" : "star-outline"}
                          size={29}
                          color={selected ? palette.apricot : "#CFC4BE"}
                        />
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.ratingPickerFooter}>
                  <Text style={styles.ratingPickerText}>
                    {rating === 0
                      ? "Sem avaliação"
                      : `${rating} ${rating === 1 ? "estrela" : "estrelas"}`}
                  </Text>
                  {rating > 0 && (
                    <Pressable onPress={() => setRating(0)}>
                      <Text style={[styles.ratingClearText, { color: theme.accent }]}>
                        Limpar
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: theme.title }]}>
                Foto da lembrança
              </Text>
              {photoUri ? (
                <View
                  style={[
                    styles.photoPreviewCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Image
                    source={{ uri: photoUri }}
                    resizeMode="cover"
                    style={styles.photoPreview}
                  />
                  <View style={styles.photoPreviewActions}>
                    <Pressable
                      onPress={chooseMemoryPhoto}
                      style={[
                        styles.photoActionButton,
                        { backgroundColor: theme.accentSoft },
                      ]}
                    >
                      <Ionicons
                        name="images-outline"
                        size={17}
                        color={theme.accent}
                      />
                      <Text style={[styles.photoActionText, { color: theme.accent }]}>
                        Trocar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setPhotoUri(undefined)}
                      style={styles.photoRemoveButton}
                    >
                      <Ionicons name="trash-outline" size={17} color="#A96363" />
                      <Text style={styles.photoRemoveText}>Remover</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={chooseMemoryPhoto}
                  style={[
                    styles.addPhotoButton,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <View
                    style={[
                      styles.addPhotoIcon,
                      { backgroundColor: theme.accentSoft },
                    ]}
                  >
                    <Ionicons
                      name="image-outline"
                      size={23}
                      color={theme.accent}
                    />
                  </View>
                  <View style={styles.addPhotoText}>
                    <Text style={[styles.addPhotoTitle, { color: theme.title }]}>
                      Adicionar uma imagem
                    </Text>
                    <Text style={styles.addPhotoHint}>
                      Opcional. O arquivo fica localmente por enquanto.
                    </Text>
                  </View>
                  <Ionicons name="add" size={21} color={theme.accent} />
                </Pressable>
              )}
            </>
          )}

          <Pressable onPress={save} style={styles.saveButton}>
            <LinearGradient
              colors={theme.heroColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveButtonText}>
                {isPlan
                  ? "Adicionar aos planos"
                  : isEditingMemory
                    ? "Salvar alterações"
                    : "Guardar lembrança"}
              </Text>
              <Ionicons
                name={
                  isPlan ? "calendar" : isEditingMemory ? "checkmark" : "heart"
                }
                size={17}
                color={palette.paper}
              />
            </LinearGradient>
          </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function App() {
  const { width: viewportWidth } = useWindowDimensions();
  const desktopLayout = viewportWidth >= 900;
  const [tab, setTab] = useState<Tab>("inicio");
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenTranslateX = useRef(new Animated.Value(0)).current;
  const previousTab = useRef<Tab>("inicio");
  const transitionDirection = useRef(1);
  const [items, setItems] = useState<CoupleItem[]>(initialItems);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [monthlyGoals, setMonthlyGoals] =
    useState<Record<string, MonthlyGoal>>(initialMonthlyGoals);
  const [activeProfileId, setActiveProfileId] = useState<Profile["id"] | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>("memory");
  const [editingMemory, setEditingMemory] = useState<CoupleItem>();
  const [monthlyGoalVisible, setMonthlyGoalVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      loadCachedItems(),
      loadCachedProfiles(),
      loadCachedMonthlyGoals(),
      loadActiveProfileId(),
    ])
      .then(([storedItems, storedProfiles, storedMonthlyGoals, storedActiveProfile]) => {
        if (storedItems) {
          const parsedItems = storedItems as CoupleItem[];
          setItems(
            parsedItems.map((item) => {
              const plannedFor =
                item.category === "Plano"
                  ? item.plannedFor ?? getLegacyCardDate(item)
                  : undefined;
              return {
                ...item,
                title: correctLegacyText(item.title),
                note: correctLegacyText(item.note),
                done: item.category === "Plano" ? item.done : true,
                plannedFor,
                completedOn:
                  item.category === "Plano" && item.done
                    ? item.completedOn ?? plannedFor
                    : undefined,
              };
            }),
          );
        }
        if (storedProfiles) {
          const parsedProfiles = storedProfiles as unknown as Profile[];
          setProfiles(
            parsedProfiles.map((profile) => {
              const legacyProfile = profile as Profile & {
                privateProfile?: boolean;
              };
              const { privateProfile: _privateProfile, ...profileData } =
                legacyProfile;
              return {
                ...profileData,
                name: correctLegacyText(profile.name),
                bio: correctLegacyText(profile.bio),
                theme: normalizeThemeName(profile.theme),
              };
            }),
          );
        }
        if (storedMonthlyGoals) {
          setMonthlyGoals(storedMonthlyGoals);
        }
        if (storedActiveProfile) setActiveProfileId(storedActiveProfile);
      })
      .catch(() => undefined)
      .finally(() => {
        setLoaded(true);
        Promise.all([getProfiles(), getItems(), getMonthlyGoals()])
          .then(([remoteProfiles, remoteItems, remoteGoals]) => {
            if (remoteProfiles.length) {
              const normalized = remoteProfiles.map((profile) => ({
                ...profile,
                theme: normalizeThemeName(profile.theme),
              })) as unknown as Profile[];
              setProfiles(normalized);
              void saveCachedProfiles(remoteProfiles);
            }
            setItems(remoteItems as CoupleItem[]);
            const goals = Object.fromEntries(
              remoteGoals.map((goal) => [goal.monthKey, goal]),
            );
            setMonthlyGoals(goals);
          })
          .catch(() => undefined);
      });
  }, []);

  useEffect(() => {
    if (loaded) void saveCachedItems(items);
  }, [items, loaded]);

  useEffect(() => {
    if (loaded) void saveCachedProfiles(profiles as never);
  }, [loaded, profiles]);

  useEffect(() => {
    if (loaded) void saveCachedMonthlyGoals(monthlyGoals);
  }, [loaded, monthlyGoals]);

  useEffect(() => {
    if (loaded) void saveActiveProfileId(activeProfileId);
  }, [activeProfileId, loaded]);

  const activeProfile = profiles.find(
    (profile) => profile.id === activeProfileId,
  );
  const activeTheme = themes[activeProfile?.theme ?? "Romance"];
  const openAddModal = (mode: AddMode) => {
    setEditingMemory(undefined);
    setAddMode(mode);
    setModalVisible(true);
  };
  const openMemoryEditor = (item: CoupleItem) => {
    setEditingMemory(item);
    setAddMode("memory");
    setModalVisible(true);
  };
  const showSyncError = () =>
    Alert.alert(
      "Sem conexão com a API",
      "A alteração ficou salva neste dispositivo e poderá ser refeita quando o servidor estiver disponível.",
    );
  const handleToggle = async (id: string) => {
    const previous = items;
    const completedOn = toIsoDate(new Date());
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? item.done
            ? { ...item, done: false, completedOn: undefined }
            : { ...item, done: true, completedOn }
          : item,
      ),
    );
    try {
      const saved = (await toggleItemDone(id)) as CoupleItem;
      setItems((current) =>
        current.map((item) => (item.id === id ? saved : item)),
      );
    } catch {
      setItems(previous);
      showSyncError();
    }
  };
  const handleProfileSave = async (updated: Profile, settingsOnly = false) => {
    setProfiles((current) =>
      current.map((profile) => (profile.id === updated.id ? updated : profile)),
    );
    try {
      const saved = settingsOnly
        ? await updateProfileSettings(updated.id, updated as never)
        : await updateProfile(updated.id, updated as never);
      const withPhoto =
        updated.photoUri && !/^https?:\/\//.test(updated.photoUri)
          ? await uploadProfilePhoto(updated.id, { uri: updated.photoUri })
          : saved;
      const normalized = {
        ...withPhoto,
        theme: normalizeThemeName(withPhoto.theme),
      } as unknown as Profile;
      setProfiles((current) =>
        current.map((profile) =>
          profile.id === normalized.id ? normalized : profile,
        ),
      );
    } catch {
      showSyncError();
    }
  };
  const handleItemSave = async (item: CoupleItem) => {
    const editing = Boolean(editingMemory);
    const optimistic = { ...item, createdByProfileId: activeProfileId ?? undefined };
    setItems((current) =>
      editing
        ? current.map((currentItem) =>
            currentItem.id === optimistic.id ? optimistic : currentItem,
          )
        : [optimistic, ...current],
    );
    setModalVisible(false);
    setEditingMemory(undefined);
    try {
      let saved = editing
        ? await updateItem(optimistic.id, optimistic)
        : await createItem(optimistic);
      if (
        optimistic.photoUri &&
        !/^https?:\/\//.test(optimistic.photoUri)
      ) {
        saved = await uploadItemPhoto(saved.id, { uri: optimistic.photoUri });
      }
      setItems((current) =>
        current
          .filter((currentItem) => editing || currentItem.id !== optimistic.id)
          .map((currentItem) =>
            currentItem.id === optimistic.id || currentItem.id === saved.id
              ? (saved as CoupleItem)
              : currentItem,
          )
          .concat(
            current.some((currentItem) => currentItem.id === saved.id)
              ? []
              : [saved as CoupleItem],
          ),
      );
    } catch {
      showSyncError();
    }
  };
  const handleGoalSave = async (goal: MonthlyGoal) => {
    setMonthlyGoals((current) => ({ ...current, [goal.monthKey]: goal }));
    setMonthlyGoalVisible(false);
    try {
      const saved = await upsertMonthlyGoal(goal.monthKey, goal);
      setMonthlyGoals((current) => ({ ...current, [saved.monthKey]: saved }));
    } catch {
      showSyncError();
    }
  };
  const navigateToTab = useCallback(
    (nextTab: Tab) => {
      if (nextTab === tab) return;
      const currentIndex = tabs.findIndex((item) => item.key === tab);
      const nextIndex = tabs.findIndex((item) => item.key === nextTab);
      transitionDirection.current = nextIndex > currentIndex ? 1 : -1;
      setTab(nextTab);
    },
    [tab],
  );

  useEffect(() => {
    if (previousTab.current === tab) return;
    previousTab.current = tab;
    screenOpacity.stopAnimation();
    screenTranslateX.stopAnimation();
    screenOpacity.setValue(0);
    screenTranslateX.setValue(18 * transitionDirection.current);
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenOpacity, screenTranslateX, tab]);

  const screen = useMemo(() => {
    if (!activeProfile) return null;
    if (tab === "colecao")
      return (
        <CollectionScreen
          items={items}
          theme={activeTheme}
          onAdd={() => openAddModal("memory")}
          onEdit={openMemoryEditor}
        />
      );
    if (tab === "planos")
      return (
        <PlansScreen
          items={items}
          monthlyGoal={monthlyGoals[PLANS_MONTH_KEY]}
          theme={activeTheme}
          onConfigureGoal={() => setMonthlyGoalVisible(true)}
          onAddIdea={() => openAddModal("plan")}
          onToggle={handleToggle}
        />
      );
    if (tab === "perfil")
      return (
        <ProfileScreen
          profile={activeProfile}
          items={items}
          theme={activeTheme}
          onEdit={() => setEditProfileVisible(true)}
          onUpdate={(updated) => void handleProfileSave(updated, true)}
          onSwitchProfile={() => {
            setTab("inicio");
            setActiveProfileId(null);
          }}
        />
      );
    return (
      <HomeScreen
        items={items}
        profile={activeProfile}
        theme={activeTheme}
        onViewAll={() => navigateToTab("colecao")}
      />
    );
  }, [activeProfile, activeTheme, items, monthlyGoals, navigateToTab, tab]);

  if (!loaded) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.gateLogo}>
          <Ionicons name="heart" size={25} color={palette.paper} />
        </View>
        <Text style={styles.loadingText}>CatLovers</Text>
      </View>
    );
  }

  if (!activeProfile) {
    return (
      <SafeAreaView style={styles.gateSafeArea}>
        <StatusBar style="dark" />
        <ProfileGate profiles={profiles} onSelect={setActiveProfileId} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: activeTheme.background }]}
    >
      <StatusBar style={activeTheme.isDark ? "light" : "dark"} />
      <View
        style={[
          styles.appShell,
          {
            backgroundColor: activeTheme.background,
            flexDirection: desktopLayout ? "row" : "column",
          },
        ]}
      >
        {desktopLayout && (
          <View
            style={[
              styles.desktopSidebar,
              {
                backgroundColor: activeTheme.surface,
                borderColor: activeTheme.border,
              },
            ]}
          >
            <View style={styles.desktopBrand}>
              <View
                style={[
                  styles.desktopBrandIcon,
                  { backgroundColor: activeTheme.accent },
                ]}
              >
                <Ionicons name="heart" size={22} color={palette.paper} />
              </View>
              <View>
                <Text
                  style={[styles.desktopBrandName, { color: activeTheme.title }]}
                >
                  CatLovers
                </Text>
                <Text
                  style={[
                    styles.desktopBrandCaption,
                    { color: activeTheme.accent },
                  ]}
                >
                  NOSSO CANTINHO
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.desktopProfile,
                {
                  backgroundColor: activeTheme.accentSoft,
                  borderColor: activeTheme.border,
                },
              ]}
            >
              <ProfileAvatar profile={activeProfile} size={48} />
              <View style={styles.desktopProfileText}>
                <Text
                  style={[
                    styles.desktopProfileName,
                    { color: activeTheme.title },
                  ]}
                >
                  {activeProfile.name}
                </Text>
                <Text
                  style={[
                    styles.desktopProfileCaption,
                    { color: activeTheme.muted },
                  ]}
                >
                  Perfil ativo
                </Text>
              </View>
            </View>

            <View style={styles.desktopNavigation}>
              {tabs.map((item) => {
                const active = tab === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => navigateToTab(item.key)}
                    style={({ pressed }) => [
                      styles.desktopNavItem,
                      active && {
                        backgroundColor: activeTheme.accentSoft,
                        borderColor: activeTheme.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.desktopNavIcon,
                        active && { backgroundColor: activeTheme.accent },
                      ]}
                    >
                      <Ionicons
                        name={active ? item.activeIcon : item.icon}
                        size={20}
                        color={active ? palette.paper : activeTheme.muted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.desktopNavLabel,
                        {
                          color: active
                            ? activeTheme.title
                            : activeTheme.muted,
                        },
                        active && styles.desktopNavLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.desktopSidebarFooter}>
              <Text
                style={[
                  styles.desktopSidebarFooterTitle,
                  { color: activeTheme.title },
                ]}
              >
                CatLovers Web
              </Text>
              <Text
                style={[
                  styles.desktopSidebarFooterText,
                  { color: activeTheme.muted },
                ]}
              >
                Versão 1.1.0
              </Text>
            </View>
          </View>
        )}

        <View style={styles.desktopMain}>
          <ThemeDecorations theme={activeTheme} />
          <Animated.View
            style={[
              styles.screenLayer,
              desktopLayout && styles.desktopScreenLayer,
              {
                opacity: screenOpacity,
                transform: [{ translateX: screenTranslateX }],
              },
            ]}
          >
            {screen}
          </Animated.View>
        </View>

        {!desktopLayout && (
          <View
            style={[
              styles.tabBar,
              {
                backgroundColor: activeTheme.surface,
                borderColor: activeTheme.border,
              },
            ]}
          >
            {tabs.map((item) => {
              const active = tab === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => navigateToTab(item.key)}
                  style={styles.tabButton}
                >
                  <Ionicons
                    name={active ? item.activeIcon : item.icon}
                    size={22}
                    color={active ? activeTheme.accent : "#9C9298"}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      active && { color: activeTheme.accent },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      <AddModal
        visible={modalVisible}
        mode={addMode}
        editingItem={editingMemory}
        theme={activeTheme}
        onClose={() => {
          setModalVisible(false);
          setEditingMemory(undefined);
        }}
        onSave={(item) => void handleItemSave(item)}
      />
      <MonthlyGoalModal
        visible={monthlyGoalVisible}
        monthKey={PLANS_MONTH_KEY}
        monthLabel={PLANS_MONTH_LABEL}
        goal={monthlyGoals[PLANS_MONTH_KEY]}
        theme={activeTheme}
        onClose={() => setMonthlyGoalVisible(false)}
        onSave={(goal) => void handleGoalSave(goal)}
      />
      <EditProfileModal
        visible={editProfileVisible}
        profile={activeProfile}
        accent={activeTheme.accent}
        onClose={() => setEditProfileVisible(false)}
        onSave={(updated) => {
          void handleProfileSave(updated);
          setEditProfileVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.cream },
  appShell: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    backgroundColor: palette.cream,
    overflow: "hidden",
  },
  screenLayer: { flex: 1, zIndex: 1 },
  desktopMain: {
    flex: 1,
    minWidth: 0,
    position: "relative",
    overflow: "hidden",
  },
  desktopScreenLayer: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
  },
  desktopSidebar: {
    width: 260,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    zIndex: 4,
  },
  desktopBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 28,
  },
  desktopBrandIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopBrandName: {
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  desktopBrandCaption: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  desktopProfile: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 24,
  },
  desktopProfileText: { flex: 1, marginLeft: 10 },
  desktopProfileName: { fontSize: 13, fontWeight: "900" },
  desktopProfileCaption: { fontSize: 9, marginTop: 2 },
  desktopNavigation: { gap: 7 },
  desktopNavItem: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 10,
  },
  desktopNavIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  desktopNavLabel: { fontSize: 12, fontWeight: "700" },
  desktopNavLabelActive: { fontWeight: "900" },
  desktopSidebarFooter: { marginTop: "auto", paddingHorizontal: 10 },
  desktopSidebarFooterTitle: { fontSize: 10, fontWeight: "800" },
  desktopSidebarFooterText: { fontSize: 8, marginTop: 3 },
  themeDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    pointerEvents: "none",
  },
  themeBubble: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    opacity: 0.42,
  },
  themeBubbleTop: { right: 30, top: -46 },
  themeBubbleBottom: { left: -48, bottom: 80 },
  themeCornerIcon: {
    position: "absolute",
    right: 18,
    top: 92,
    transform: [{ rotate: "12deg" }],
  },
  themeCharacterTop: {
    position: "absolute",
    right: 56,
    top: 2,
    width: 82,
    height: 82,
    opacity: 0.9,
  },
  cinnamorollCharacterTop: { right: 50, width: 118 },
  themeCharacterBottom: {
    position: "absolute",
    left: -25,
    bottom: 72,
    width: 92,
    height: 92,
    opacity: 0.48,
    transform: [{ rotate: "-10deg" }],
  },
  cinnamorollCharacterBottom: { left: -22, width: 112 },
  scrollContent: {
    width: "100%",
    paddingHorizontal: 36,
    paddingTop: 28,
    paddingBottom: 70,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "android" ? 16 : 4,
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: palette.rose,
    fontWeight: "800",
    marginBottom: 5,
  },
  pageTitle: {
    fontSize: 29,
    letterSpacing: -0.7,
    color: palette.ink,
    fontWeight: "800",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.ink,
    shadowColor: palette.ink,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  heroCard: {
    minHeight: 225,
    borderRadius: 30,
    padding: 25,
    overflow: "hidden",
    shadowColor: palette.rose,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    marginBottom: 30,
  },
  heroDecorationOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.09)",
    right: -58,
    top: -55,
  },
  heroDecorationTwo: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 22,
    borderColor: "rgba(255,255,255,0.07)",
    left: -40,
    bottom: -52,
  },
  heroKicker: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: palette.paper,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 12,
    maxWidth: "88%",
  },
  heroNote: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: "88%",
  },
  heroFooter: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarStack: { flexDirection: "row" },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: palette.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlap: { marginLeft: -9 },
  avatarText: { color: palette.ink, fontSize: 12, fontWeight: "800" },
  heroDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroDateText: {
    color: palette.paper,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 15,
  },
  sectionEyebrow: {
    color: palette.rose,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 20,
    letterSpacing: -0.35,
    fontWeight: "800",
    color: palette.ink,
  },
  progressBadge: {
    backgroundColor: "#EFE6F4",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 15,
  },
  progressText: { color: palette.lilac, fontSize: 11, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: palette.paper,
    padding: 17,
    borderWidth: 1,
    borderColor: palette.line,
  },
  statValue: {
    color: palette.ink,
    fontSize: 25,
    fontWeight: "800",
    marginTop: 14,
  },
  statLabel: { color: palette.muted, fontSize: 11, marginTop: 2 },
  linkText: { color: palette.rose, fontWeight: "700", fontSize: 12 },
  memoryCard: {
    flexDirection: "row",
    backgroundColor: palette.paper,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.line,
    marginBottom: 13,
  },
  memoryStripe: { width: 6 },
  memoryBody: { flex: 1, padding: 16 },
  memoryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memoryTopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memoryEditButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryPill: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryPillText: { fontSize: 10, fontWeight: "700" },
  dateText: { color: "#A0979D", fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  memoryTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 12,
  },
  memoryNote: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  memoryPhoto: {
    width: "100%",
    height: 150,
    borderRadius: 15,
    marginTop: 13,
  },
  memoryFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  ratingRow: { flexDirection: "row", gap: 2 },
  memorySavedText: { color: palette.muted, fontSize: 10, fontWeight: "700" },
  introText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: -11,
    marginBottom: 22,
    maxWidth: 320,
  },
  collectionFilterToolbar: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  collectionFilterHint: {
    color: palette.muted,
    fontSize: 9,
    marginTop: 3,
  },
  collectionFilterButton: {
    minWidth: 105,
    height: 43,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 13,
  },
  collectionFilterButtonText: { fontSize: 11, fontWeight: "800" },
  collectionFilterBadge: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: palette.paper,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  collectionFilterBadgeText: { fontSize: 9, fontWeight: "900" },
  activeFilterList: { gap: 7, paddingBottom: 7 },
  activeFilterChip: {
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeFilterChipText: { fontSize: 9, fontWeight: "800" },
  resultCount: {
    color: "#9D9399",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  memoryMonthGroup: { marginTop: 8 },
  memoryMonthDivider: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  memoryMonthIcon: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  memoryMonthTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: -0.1,
  },
  memoryMonthCount: {
    minWidth: 25,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  memoryMonthCountText: { fontSize: 9, fontWeight: "900" },
  memoryMonthLine: {
    flex: 1,
    height: 1,
    marginLeft: 10,
  },
  emptyState: { alignItems: "center", paddingVertical: 55 },
  emptyTitle: { color: palette.ink, fontWeight: "800", fontSize: 17, marginTop: 14 },
  emptyText: { color: palette.muted, fontSize: 12, marginTop: 5 },
  monthCard: {
    backgroundColor: palette.ink,
    borderRadius: 26,
    padding: 22,
    marginBottom: 28,
  },
  monthTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthGoalContent: { flex: 1, paddingRight: 14 },
  monthLabel: {
    color: palette.paper,
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: "800",
  },
  monthTitle: { color: palette.paper, fontSize: 18, fontWeight: "800", marginTop: 5 },
  monthProgress: { color: palette.paper, fontSize: 24, fontWeight: "800" },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginTop: 22,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  monthHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    marginTop: 13,
  },
  plansCalendarCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },
  plansCalendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  plansCalendarNav: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  plansCalendarHeading: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  plansCalendarMonth: { fontSize: 15, fontWeight: "900" },
  plansCalendarSubtitle: { color: palette.muted, fontSize: 9, marginTop: 3 },
  plansCalendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  plansCalendarWeekday: {
    width: "14.2857%",
    color: palette.muted,
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  plansCalendarDayCell: {
    width: "14.2857%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  plansCalendarDay: {
    width: 40,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  plansCalendarDayText: { fontSize: 11, fontWeight: "800" },
  plansCalendarDayTextSelected: { color: palette.paper },
  plansCalendarCount: {
    position: "absolute",
    right: 2,
    bottom: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  plansCalendarCountText: { fontSize: 7, fontWeight: "900" },
  dayAgenda: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
    marginBottom: 27,
  },
  dayAgendaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayAgendaTitle: { fontSize: 14, fontWeight: "900" },
  dayAgendaSubtitle: { color: palette.muted, fontSize: 9, marginTop: 3 },
  todayBadge: {
    minHeight: 24,
    borderRadius: 12,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  todayBadgeText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  dayAgendaEmpty: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 5,
  },
  dayAgendaEmptyText: {
    flex: 1,
    color: palette.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  dayAgendaItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: 1,
    paddingTop: 13,
    marginTop: 13,
  },
  dayAgendaCheck: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dayAgendaContent: { flex: 1 },
  dayAgendaItemTitle: { fontSize: 12, fontWeight: "800" },
  dayAgendaItemNote: { color: palette.muted, fontSize: 9, marginTop: 3 },
  dayAgendaMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 7,
  },
  dayAgendaType: { fontSize: 8, fontWeight: "800" },
  dayAgendaStatus: { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  bigCheck: {
    width: 29,
    height: 29,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D6CBD0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  planContent: { flex: 1 },
  planTitle: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  planNote: { color: palette.muted, fontSize: 11, marginTop: 4, paddingRight: 10 },
  planIdeaBadge: {
    alignSelf: "flex-start",
    minHeight: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  planIdeaBadgeText: { fontSize: 9, fontWeight: "800" },
  planDateContainer: {
    minWidth: 72,
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
    marginLeft: 8,
  },
  planDate: {
    color: palette.rose,
    fontWeight: "800",
    fontSize: 9,
    textAlign: "right",
  },
  doneText: { textDecorationLine: "line-through", color: "#9B9297" },
  dashedButton: {
    height: 58,
    marginTop: 23,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#D8B8BA",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  dashedButtonText: { color: palette.rose, fontSize: 12, fontWeight: "700" },
  coupleCard: {
    alignItems: "center",
    backgroundColor: "#F2E8F4",
    borderRadius: 28,
    padding: 28,
  },
  largeAvatars: { flexDirection: "row", alignItems: "center" },
  largeAvatar: {
    width: 75,
    height: 75,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: palette.paper,
  },
  largeAvatarText: { color: palette.ink, fontSize: 24, fontWeight: "800" },
  heartConnector: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.rose,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -7,
    zIndex: 2,
  },
  coupleQuote: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 19,
    maxWidth: 280,
  },
  achievementGrid: { flexDirection: "row", gap: 10, marginTop: 14 },
  achievement: {
    flex: 1,
    alignItems: "center",
    backgroundColor: palette.paper,
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: palette.line,
  },
  achievementValue: { color: palette.ink, fontSize: 20, fontWeight: "800" },
  achievementLabel: { color: palette.muted, fontSize: 9, marginTop: 3 },
  menuRow: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.paper,
    borderRadius: 18,
    marginBottom: 9,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: palette.line,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#F9E9E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  menuLabel: { flex: 1, color: palette.ink, fontSize: 13, fontWeight: "700" },
  menuDetail: { color: "#A2989E", fontSize: 10, marginRight: 7 },
  tabBar: {
    position: "absolute",
    zIndex: 3,
    left: 14,
    right: 14,
    bottom: Platform.OS === "ios" ? 10 : 12,
    height: 72,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: palette.line,
    shadowColor: palette.ink,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  tabText: { color: "#9C9298", fontSize: 9, fontWeight: "700" },
  tabTextActive: { color: palette.rose },
  filterModalSheet: {
    backgroundColor: palette.cream,
    width: "92%",
    maxWidth: 980,
    borderRadius: 28,
    padding: 26,
    paddingBottom: 24,
    maxHeight: "90%",
  },
  filterModalContent: { paddingBottom: 12 },
  filterSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    marginBottom: 11,
  },
  filterSectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  filterSectionTitle: { fontSize: 13, fontWeight: "900" },
  filterSectionHint: { color: palette.muted, fontSize: 9, marginTop: 2 },
  filterOptionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 22,
  },
  filterOption: {
    minHeight: 45,
    flexBasis: 100,
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 10,
  },
  filterOptionText: { color: palette.muted, fontSize: 10, fontWeight: "700" },
  filterMonthList: { gap: 7, marginBottom: 22 },
  filterMonthOption: {
    minHeight: 47,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 9,
  },
  filterMonthText: {
    flex: 1,
    color: palette.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  filterRatingList: { gap: 7 },
  filterRatingOption: {
    minHeight: 45,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 13,
  },
  filterRatingStars: { flexDirection: "row", gap: 3 },
  filterRatingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterRatingLabel: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  filterModalActions: {
    flexDirection: "row",
    gap: 9,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  filterClearButton: {
    width: 90,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterClearText: { fontSize: 11, fontWeight: "800" },
  filterApplyButton: { flex: 1, borderRadius: 16, overflow: "hidden" },
  filterApplyGradient: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  filterApplyText: { color: palette.paper, fontSize: 11, fontWeight: "900" },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(35,28,34,0.4)",
    padding: 24,
  },
  modalDismiss: { ...StyleSheet.absoluteFillObject },
  goalModalSheet: {
    backgroundColor: palette.cream,
    width: "92%",
    maxWidth: 720,
    borderRadius: 28,
    padding: 26,
    paddingBottom: 26,
  },
  goalModalIntro: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: -6,
    marginBottom: 20,
  },
  goalDescriptionInput: {
    height: 104,
    paddingTop: 14,
    textAlignVertical: "top",
    marginBottom: 7,
  },
  modalSheet: {
    backgroundColor: palette.cream,
    width: "94%",
    maxWidth: 1040,
    borderRadius: 30,
    padding: 28,
    paddingBottom: 28,
    maxHeight: "92%",
  },
  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D9CED3",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 23,
  },
  modalBody: { flexShrink: 1 },
  modalBodyContent: { paddingBottom: 2 },
  modalEyebrow: {
    color: palette.rose,
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: "800",
  },
  modalTitle: { color: palette.ink, fontSize: 25, fontWeight: "800", marginTop: 3 },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.paper,
  },
  inputLabel: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 9,
    marginTop: 2,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 20,
  },
  categoryOption: {
    flexGrow: 1,
    flexBasis: 96,
    minHeight: 62,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  categoryOptionText: { color: palette.muted, fontSize: 9, fontWeight: "700" },
  datePickerButton: {
    minHeight: 62,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  datePickerIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  datePickerText: { flex: 1 },
  datePickerValue: { fontSize: 12, fontWeight: "800" },
  datePickerHint: { color: palette.muted, fontSize: 9, marginTop: 3 },
  clearPlannedDateButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: -7,
    marginBottom: 17,
    paddingVertical: 4,
  },
  clearPlannedDateText: { fontSize: 10, fontWeight: "800" },
  calendarCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginTop: -7,
    marginBottom: 18,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  calendarNavButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarNavDisabled: { opacity: 0.45 },
  calendarMonth: { fontSize: 13, fontWeight: "800" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarWeekday: {
    width: "14.2857%",
    color: palette.muted,
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  calendarDayCell: {
    width: "14.2857%",
    height: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDay: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayText: { color: palette.ink, fontSize: 11, fontWeight: "700" },
  calendarDayTextSelected: { color: palette.paper },
  calendarDayTextDisabled: { color: "#D7CFCA" },
  ratingPicker: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 18,
  },
  ratingPickerStars: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingStarButton: {
    width: 43,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingPickerFooter: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 7,
  },
  ratingPickerText: { color: palette.muted, fontSize: 10, fontWeight: "700" },
  ratingClearText: { fontSize: 10, fontWeight: "800" },
  input: {
    height: 51,
    borderRadius: 15,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: 15,
    color: palette.ink,
    fontSize: 13,
    marginBottom: 18,
  },
  textArea: { height: 78, paddingTop: 14, textAlignVertical: "top" },
  addPhotoButton: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  addPhotoIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  addPhotoText: { flex: 1, paddingRight: 8 },
  addPhotoTitle: { fontSize: 12, fontWeight: "800" },
  addPhotoHint: {
    color: palette.muted,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
  },
  photoPreviewCard: {
    borderRadius: 17,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 18,
  },
  photoPreview: { width: "100%", height: 175 },
  photoPreviewActions: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  photoActionButton: {
    flex: 1,
    minHeight: 39,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoActionText: { fontSize: 10, fontWeight: "800" },
  photoRemoveButton: {
    flex: 1,
    minHeight: 39,
    borderRadius: 12,
    backgroundColor: "#F9ECE9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoRemoveText: { color: "#A96363", fontSize: 10, fontWeight: "800" },
  saveButton: { borderRadius: 17, overflow: "hidden", marginTop: 2 },
  saveGradient: {
    height: 54,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { color: palette.paper, fontSize: 13, fontWeight: "800" },
  gateSafeArea: { flex: 1, backgroundColor: palette.cream },
  gateContainer: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 48,
    paddingVertical: 34,
  },
  gateBrand: { alignItems: "center", marginTop: 18 },
  gateLogo: {
    width: 54,
    height: 54,
    borderRadius: 19,
    backgroundColor: palette.rose,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.rose,
    shadowOpacity: 0.25,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 7 },
  },
  gateBrandName: {
    color: palette.ink,
    fontSize: 24,
    letterSpacing: -0.5,
    fontWeight: "900",
    marginTop: 11,
  },
  gateBrandTag: {
    color: palette.rose,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 2.2,
    marginTop: 3,
  },
  gateContent: {
    flex: 1,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    justifyContent: "center",
  },
  gateTitle: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  gateSubtitle: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    alignSelf: "center",
    maxWidth: 480,
    marginTop: 9,
  },
  profileChoices: { flexDirection: "row", gap: 20, marginTop: 34 },
  profileChoice: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: palette.line,
    minHeight: 230,
    paddingVertical: 30,
    alignItems: "center",
    shadowColor: palette.ink,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
  },
  profileAvatar: {
    overflow: "hidden",
    borderColor: palette.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  profileInitial: { color: palette.paper, fontWeight: "900" },
  profileChoiceName: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
  },
  enterProfile: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    marginTop: 8,
  },
  enterProfileText: { color: palette.rose, fontSize: 11, fontWeight: "700" },
  gatePrivacy: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  gatePrivacyText: { color: palette.muted, fontSize: 10 },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.cream,
  },
  loadingText: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 13,
  },
  editProfileButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
  },
  profileHero: {
    alignItems: "center",
    backgroundColor: palette.paper,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.line,
  },
  photoBadge: {
    position: "absolute",
    right: 0,
    bottom: 1,
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: palette.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    color: palette.ink,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginTop: 13,
  },
  profileBirth: { color: palette.muted, fontSize: 11, marginTop: 5 },
  profileBio: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 300,
    marginTop: 13,
  },
  outlineProfileButton: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 9,
    marginTop: 17,
  },
  outlineProfileButtonText: { fontSize: 11, fontWeight: "800" },
  profileStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.paper,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: palette.line,
    paddingVertical: 15,
    marginTop: 12,
  },
  profileStat: { flex: 1, alignItems: "center" },
  profileStatValue: { color: palette.ink, fontSize: 18, fontWeight: "800" },
  profileStatLabel: { color: palette.muted, fontSize: 9, marginTop: 2 },
  profileStatDivider: { width: 1, height: 29, backgroundColor: palette.line },
  settingsSectionTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 25,
    marginBottom: 10,
  },
  settingsCard: {
    backgroundColor: palette.paper,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: 14,
  },
  themeHint: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 12,
  },
  themeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 2,
  },
  themeOption: {
    alignItems: "center",
    width: "50%",
    marginBottom: 18,
  },
  themeSwatch: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  themeSwatchActive: {
    transform: [{ scale: 1.06 }],
  },
  themeSwatchCharacter: { width: 46, height: 46 },
  themeSwatchCheck: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: palette.paper,
  },
  themeName: { fontSize: 10, marginTop: 7 },
  settingRow: {
    minHeight: 73,
    flexDirection: "row",
    alignItems: "center",
  },
  actionSettingRow: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  settingText: { flex: 1, paddingRight: 8 },
  settingLabel: { color: palette.ink, fontSize: 12, fontWeight: "800" },
  settingDescription: {
    color: palette.muted,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
  },
  settingDivider: { height: 1, marginLeft: 50 },
  disclosurePanel: { overflow: "hidden" },
  disclosureBox: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 13,
  },
  aboutText: { color: palette.muted, fontSize: 11, lineHeight: 17 },
  aboutSignature: { fontSize: 10, fontWeight: "800", marginTop: 8 },
  privacyIntro: { fontSize: 10, lineHeight: 16, marginBottom: 4 },
  privacySection: { marginTop: 11 },
  privacyTitle: { fontSize: 10, fontWeight: "900" },
  privacyText: { fontSize: 9, lineHeight: 14, marginTop: 3 },
  privacyDocumentHint: { fontSize: 9, fontWeight: "800", marginTop: 13 },
  switchProfileButton: {
    height: 53,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E4C4C6",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  switchProfileText: { color: palette.rose, fontSize: 12, fontWeight: "800" },
  editModalPage: { flex: 1, backgroundColor: palette.cream },
  fullModalHeader: {
    height: 67,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  fullModalTitle: { color: palette.ink, fontSize: 16, fontWeight: "800" },
  fullModalSave: { fontSize: 13, fontWeight: "800" },
  editProfileContent: { padding: 22, paddingBottom: 50 },
  editPhotoArea: { alignItems: "center", marginBottom: 28 },
  editPhotoBadge: {
    position: "absolute",
    top: 79,
    marginLeft: 77,
    width: 35,
    height: 35,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: palette.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoText: { fontSize: 11, fontWeight: "800", marginTop: 11 },
  profileBioInput: { height: 112, paddingTop: 14, textAlignVertical: "top" },
  characterCount: {
    color: palette.muted,
    fontSize: 9,
    textAlign: "right",
    marginTop: -13,
  },
});
