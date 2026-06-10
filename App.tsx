import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  View,
} from "react-native";

type Category = "Filme" | "Serie" | "Jogo" | "Role" | "Anime" | "Plano";
type MemoryCategory = Exclude<Category, "Plano">;
type Tab = "inicio" | "colecao" | "planos" | "perfil";
type CategoryFilter = "Todos" | MemoryCategory;
type RatingFilter = "Todas" | "Sem avaliacao" | 1 | 2 | 3 | 4 | 5;
type CollectionFilters = {
  category: CategoryFilter;
  month: string | null;
  rating: RatingFilter;
};
type AddMode = "memory" | "plan";
type ThemeName =
  | "Romance"
  | "Lavanda"
  | "Floresta"
  | "Noite"
  | "Cinnamoroll"
  | "Chococat";

type AppTheme = {
  accent: string;
  accentSoft: string;
  background: string;
  surface: string;
  border: string;
  title: string;
  heroColors: readonly [string, string];
  label: string;
  character?: "Cinnamoroll" | "Chococat";
};

type Profile = {
  id: "leticia" | "luis";
  name: string;
  birthDate: string;
  bio: string;
  photoUri?: string;
  color: string;
  theme: ThemeName;
  notifications: boolean;
  privateProfile: boolean;
  weeklyQuestion: boolean;
};

type CoupleItem = {
  id: string;
  title: string;
  category: Category;
  note: string;
  date: string;
  occurredOn?: string;
  photoUri?: string;
  done: boolean;
  rating?: number;
  color: string;
};

const STORAGE_KEY = "@catlovers/items";
const PROFILES_KEY = "@catlovers/profiles";
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
  Cinnamoroll: require("./assets/themes/cinnamoroll.png"),
  Chococat: require("./assets/themes/chococat.png"),
};

const themes: Record<ThemeName, AppTheme> = {
  Romance: {
    accent: "#C65D6C",
    accentSoft: "#F9E9E8",
    background: "#FCF8F4",
    surface: "#FFFFFF",
    border: "#EDE4DE",
    title: palette.ink,
    heroColors: ["#D36A76", "#A77BC0"],
    label: "Romance",
  },
  Lavanda: {
    accent: "#8B6FAE",
    accentSoft: "#F0EAF6",
    background: "#FAF8FC",
    surface: "#FFFDFF",
    border: "#E9E1F0",
    title: palette.ink,
    heroColors: ["#9B82BC", "#C7A8D8"],
    label: "Lavanda",
  },
  Floresta: {
    accent: "#527B68",
    accentSoft: "#E7F0EB",
    background: "#F7FAF8",
    surface: "#FEFFFE",
    border: "#DDE9E2",
    title: palette.ink,
    heroColors: ["#56806C", "#89A995"],
    label: "Floresta",
  },
  Noite: {
    accent: "#655D9A",
    accentSoft: "#EAE8F4",
    background: "#F6F5FA",
    surface: "#FDFDFF",
    border: "#E2E0ED",
    title: palette.ink,
    heroColors: ["#544D83", "#8279B6"],
    label: "Noite",
  },
  Cinnamoroll: {
    accent: "#4BAFDF",
    accentSoft: "#DFF4FF",
    background: "#F3FBFF",
    surface: "#FFFFFF",
    border: "#CDEAF7",
    title: palette.ink,
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
    heroColors: ["#6A4636", "#A17B5D"],
    label: "Chococat",
    character: "Chococat",
  },
};

const initialProfiles: Profile[] = [
  {
    id: "leticia",
    name: "Leticia",
    birthDate: "18/09/2003",
    bio: "Apaixonada por historias, cafe e pelos nossos domingos sem pressa.",
    color: "#E9A29D",
    theme: "Romance",
    notifications: true,
    privateProfile: true,
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
    privateProfile: true,
    weeklyQuestion: false,
  },
];

const initialItems: CoupleItem[] = [
  {
    id: "1",
    title: "Maratona de Severance",
    category: "Serie",
    note: "Dois episodios e sobremesa no sofa.",
    date: "12 JUN",
    done: true,
    rating: 5,
    color: palette.lilac,
  },
  {
    id: "2",
    title: "It Takes Two",
    category: "Jogo",
    note: "Terminamos o capitulo do jardim.",
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
    title: "Cafe novo no centro",
    category: "Plano",
    note: "Ir de manha e caminhar pela livraria depois.",
    date: "21 JUN",
    done: false,
    color: palette.apricot,
  },
  {
    id: "5",
    title: "Noite sem celular",
    category: "Plano",
    note: "Jantar feito juntos e cartas na mesa.",
    date: "27 JUN",
    done: false,
    color: palette.blush,
  },
];

const categoryMeta: Record<
  Category,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  Filme: { icon: "film-outline", color: palette.rose, label: "Filme" },
  Serie: { icon: "tv-outline", color: palette.lilac, label: "Serie" },
  Jogo: { icon: "game-controller-outline", color: palette.sage, label: "Jogo" },
  Role: { icon: "location-outline", color: "#D48A62", label: "Rolê" },
  Anime: { icon: "sparkles-outline", color: "#7D78B8", label: "Anime" },
  Plano: { icon: "calendar-outline", color: palette.apricot, label: "Plano" },
};

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Marco",
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

function getItemDate(item: CoupleItem) {
  if (item.occurredOn) return fromIsoDate(item.occurredOn);

  const [dayText, monthText] = item.date.toUpperCase().split(" ");
  const month = monthAbbreviations.indexOf(monthText);
  const day = Number(dayText);
  if (month < 0 || !day) return new Date(0);

  return new Date(new Date().getFullYear(), month, day);
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
  { key: "inicio", label: "Inicio", icon: "home-outline", activeIcon: "home" },
  {
    key: "colecao",
    label: "Colecao",
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
        <Text style={styles.gateTitle}>Quem esta entrando?</Text>
        <Text style={styles.gateSubtitle}>
          Escolha seu perfil. Aqui nao tem senha, so o nosso espaco compartilhado.
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
  theme,
}: {
  eyebrow: string;
  title: string;
  onAdd?: () => void;
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
}: {
  item: CoupleItem;
  theme: AppTheme;
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
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <Text style={[styles.memoryTitle, { color: theme.title }]}>
          {item.title}
        </Text>
        <Text style={styles.memoryNote} numberOfLines={2}>
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
            <Text style={styles.memorySavedText}>Lembranca guardada</Text>
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
        <Text style={styles.heroKicker}>NOSSO PROXIMO MOMENTO</Text>
        <Text style={styles.heroTitle}>{nextPlan?.title ?? "Criar um novo plano"}</Text>
        <Text style={styles.heroNote}>
          {nextPlan?.note ?? "Uma ideia simples pode virar uma memoria favorita."}
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
            Nosso mes
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
          <Text style={styles.statValue}>{items.length}</Text>
          <Text style={styles.statLabel}>momentos salvos</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="time-outline" size={21} color={theme.accent} />
          <Text style={styles.statValue}>
            {items.filter((item) => !item.done).length}
          </Text>
          <Text style={styles.statLabel}>ideias esperando</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.title }]}>
          Ultimas memorias
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
                ORGANIZAR COLECAO
              </Text>
              <Text style={[styles.modalTitle, { color: theme.title }]}>
                Filtrar lembrancas
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
                  Escolha um tipo de lembranca
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
                  Mostre lembrancas de um mes
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
                  Avaliacao
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
                          {rating === "Todas" ? "Todas as notas" : "Sem avaliacao"}
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
  theme,
}: {
  items: CoupleItem[];
  onAdd: () => void;
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
        ? "Sem avaliacao"
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
          title="Nossa colecao"
          onAdd={onAdd}
          theme={theme}
        />
        <Text style={styles.introText}>
          O nosso pequeno arquivo de historias, partidas e maratonas.
        </Text>
        <View style={styles.collectionFilterToolbar}>
          <View>
            <Text style={styles.resultCount}>
              {visible.length} {visible.length === 1 ? "registro" : "registros"}
            </Text>
            <Text style={styles.collectionFilterHint}>
              {activeFilterCount
                ? `${activeFilterCount} ${
                    activeFilterCount === 1 ? "filtro ativo" : "filtros ativos"
                  }`
                : "Mostrando toda a colecao"}
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
              <MemoryCard key={item.id} item={item} theme={theme} />
            ))}
          </View>
        ))}
        {visible.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={36} color={theme.accent} />
            <Text style={[styles.emptyTitle, { color: theme.title }]}>
              Nenhuma lembranca encontrada
            </Text>
            <Text style={styles.emptyText}>
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

function PlansScreen({
  items,
  onAdd,
  onToggle,
  theme,
}: {
  items: CoupleItem[];
  onAdd: () => void;
  onToggle: (id: string) => void;
  theme: AppTheme;
}) {
  const plans = items.filter((item) => item.category === "Plano");
  const done = plans.filter((item) => item.done).length;
  const progress = plans.length ? done / plans.length : 0;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <AppHeader
        eyebrow="TEMPO DE QUALIDADE"
        title="Planos de junho"
        onAdd={onAdd}
        theme={theme}
      />
      <LinearGradient colors={theme.heroColors} style={styles.monthCard}>
        <View style={styles.monthTop}>
          <View>
            <Text style={styles.monthLabel}>META DO MES</Text>
            <Text style={styles.monthTitle}>Mais tempo para nos</Text>
          </View>
          <Text style={styles.monthProgress}>
            {done}/{plans.length}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.monthHint}>
          Sem pressa. O importante e fazer caber na vida real.
        </Text>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.title }]}>
          Lista do casal
        </Text>
        <Ionicons name="heart" size={17} color={theme.accent} />
      </View>
      {plans.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onToggle(item.id)}
          style={[styles.planRow, { borderBottomColor: theme.border }]}
        >
          <View
            style={[
              styles.bigCheck,
              item.done && { backgroundColor: palette.sage, borderColor: palette.sage },
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
            <Text style={styles.planNote}>{item.note}</Text>
          </View>
          <Text style={[styles.planDate, { color: theme.accent }]}>
            {item.date.split(" ")[0]}
          </Text>
        </Pressable>
      ))}

      <Pressable
        onPress={onAdd}
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
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  value: boolean;
  accent: string;
  titleColor: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: `${accent}16` }]}>
        <Ionicons name={icon} size={19} color={accent} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, { color: titleColor }]}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
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
  const [aboutVisible, setAboutVisible] = useState(false);
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
        <Text style={styles.profileBirth}>
          <Ionicons name="gift-outline" size={12} color={palette.muted} />{" "}
          {profile.birthDate}
        </Text>
        <Text style={styles.profileBio}>{profile.bio}</Text>
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
          <Text style={styles.profileStatLabel}>memorias</Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStat}>
          <Text style={[styles.profileStatValue, { color: theme.title }]}>
            {items.filter((item) => !item.done).length}
          </Text>
          <Text style={styles.profileStatLabel}>planos</Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStat}>
          <Text style={[styles.profileStatValue, { color: theme.title }]}>
            4
          </Text>
          <Text style={styles.profileStatLabel}>anos juntos</Text>
        </View>
      </View>

      <Text style={[styles.settingsSectionTitle, { color: theme.title }]}>
        Aparencia
      </Text>
      <View
        style={[
          styles.settingsCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={styles.themeHint}>Tema do aplicativo</Text>
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
                    { backgroundColor: optionTheme.accent },
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
                    active && (
                      <Ionicons
                        name="checkmark"
                        size={17}
                        color={palette.paper}
                      />
                    )
                  )}
                  {active && optionTheme.character && (
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
        Preferencias
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
          description="Planos proximos e datas especiais"
          value={profile.notifications}
          accent={accent}
          titleColor={theme.title}
          onChange={(notifications) => onUpdate({ ...profile, notifications })}
        />
        <View style={styles.settingDivider} />
        <SettingSwitch
          icon="chatbubbles-outline"
          label="Pergunta da semana"
          description="Uma pergunta nova para responder juntos"
          value={profile.weeklyQuestion}
          accent={accent}
          titleColor={theme.title}
          onChange={(weeklyQuestion) => onUpdate({ ...profile, weeklyQuestion })}
        />
        <View style={styles.settingDivider} />
        <SettingSwitch
          icon="shield-checkmark-outline"
          label="Perfil privado"
          description="Dados ficam somente neste aparelho"
          value={profile.privateProfile}
          accent={accent}
          titleColor={theme.title}
          onChange={(privateProfile) => onUpdate({ ...profile, privateProfile })}
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
        <Pressable
          onPress={() => setAboutVisible(!aboutVisible)}
          style={styles.actionSettingRow}
        >
          <View style={[styles.settingIcon, { backgroundColor: `${accent}16` }]}>
            <Ionicons name="heart-circle-outline" size={20} color={accent} />
          </View>
          <View style={styles.settingText}>
            <Text style={[styles.settingLabel, { color: theme.title }]}>
              Sobre o aplicativo
            </Text>
            <Text style={styles.settingDescription}>Versao 1.1.0</Text>
          </View>
          <Ionicons
            name={aboutVisible ? "chevron-up" : "chevron-forward"}
            size={18}
            color="#B3A9AE"
          />
        </Pressable>
        {aboutVisible && (
          <View style={styles.aboutBox}>
            <Text style={styles.aboutText}>
              CatLovers e o cantinho de Leticia e Luis para guardar historias,
              escolher o proximo filme e transformar planos simples em memoria.
            </Text>
            <Text style={[styles.aboutSignature, { color: accent }]}>
              Feito com carinho para dois.
            </Text>
          </View>
        )}
        <View style={styles.settingDivider} />
        <Pressable
          onPress={() =>
            Alert.alert(
              "Seus dados",
              "Perfis, preferencias e registros sao armazenados localmente neste aparelho.",
            )
          }
          style={styles.actionSettingRow}
        >
          <View style={[styles.settingIcon, { backgroundColor: `${accent}16` }]}>
            <Ionicons name="document-text-outline" size={19} color={accent} />
          </View>
          <Text style={[styles.menuLabel, { color: theme.title }]}>
            Privacidade e dados
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#B3A9AE" />
        </Pressable>
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
        "Permissao necessaria",
        "Permita o acesso as fotos para escolher uma imagem de perfil.",
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
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
                  Alert.alert("Nome obrigatorio", "Informe o nome do perfil.");
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
              placeholder="Conte um pouco sobre voce"
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

function MemoryCalendar({
  selectedDate,
  visibleMonth,
  theme,
  onChangeMonth,
  onSelect,
}: {
  selectedDate: string;
  visibleMonth: Date;
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
  const canGoNext = visibleMonth < currentMonth;
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
          onPress={() => onChangeMonth(new Date(year, month - 1, 1))}
          style={styles.calendarNavButton}
        >
          <Ionicons name="chevron-back" size={18} color={theme.accent} />
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
          const future = isoDate > todayIso;
          return (
            <Pressable
              key={isoDate}
              disabled={future}
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
                    future && styles.calendarDayTextDisabled,
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

function AddModal({
  visible,
  mode,
  theme,
  onClose,
  onSave,
}: {
  visible: boolean;
  mode: AddMode;
  theme: AppTheme;
  onClose: () => void;
  onSave: (item: CoupleItem) => void;
}) {
  const [category, setCategory] = useState<MemoryCategory>("Filme");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string>();
  const [rating, setRating] = useState(0);
  const isPlan = mode === "plan";
  const memoryCategories: MemoryCategory[] = [
    "Filme",
    "Serie",
    "Jogo",
    "Role",
    "Anime",
  ];

  useEffect(() => {
    if (!visible) return;
    setTitle("");
    setNote("");
    setCategory("Filme");
    const today = new Date();
    setSelectedDate(toIsoDate(today));
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setCalendarVisible(false);
    setPhotoUri(undefined);
    setRating(0);
  }, [mode, visible]);

  const chooseMemoryPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permissao necessaria",
        "Permita o acesso as fotos para escolher uma imagem da lembranca.",
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
        "Falta um titulo",
        isPlan ? "De um nome para esse plano." : "De um nome para essa lembranca.",
      );
      return;
    }
    const savedCategory: Category = isPlan ? "Plano" : category;
    onSave({
      id: Date.now().toString(),
      title: title.trim(),
      note:
        note.trim() ||
        (isPlan
          ? "Um novo momento para viver juntos."
          : "Uma lembranca especial guardada juntos."),
      category: savedCategory,
      date: isPlan ? "30 JUN" : formatCardDate(selectedDate),
      occurredOn: isPlan ? undefined : selectedDate,
      photoUri: isPlan ? undefined : photoUri,
      done: !isPlan,
      rating: isPlan || rating === 0 ? undefined : rating,
      color: categoryMeta[savedCategory].color,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
                {isPlan ? "PLANEJAR JUNTOS" : "GUARDAR JUNTOS"}
              </Text>
              <Text style={[styles.modalTitle, { color: theme.title }]}>
                {isPlan ? "Novo plano" : "Nova lembranca"}
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
          {!isPlan && (
            <>
              <Text style={[styles.inputLabel, { color: theme.title }]}>
                Que lembranca vamos guardar?
              </Text>
              <View style={styles.categoryGrid}>
                {memoryCategories.map((item) => {
                  const meta = categoryMeta[item];
                  const active = category === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setCategory(item)}
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
                <MemoryCalendar
                  selectedDate={selectedDate}
                  visibleMonth={visibleMonth}
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

          <Text style={[styles.inputLabel, { color: theme.title }]}>Titulo</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={isPlan ? "Ex.: Conhecer um cafe novo" : "Ex.: Cinema na sexta"}
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
                ? "O que voces querem fazer?"
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
                Quantas estrelas essa lembranca merece?
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
                      ? "Sem avaliacao"
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
                Foto da lembranca
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
                {isPlan ? "Adicionar aos planos" : "Guardar lembranca"}
              </Text>
              <Ionicons
                name={isPlan ? "calendar" : "heart"}
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
  const [tab, setTab] = useState<Tab>("inicio");
  const [items, setItems] = useState<CoupleItem[]>(initialItems);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [activeProfileId, setActiveProfileId] = useState<Profile["id"] | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>("memory");
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(PROFILES_KEY),
    ])
      .then(([storedItems, storedProfiles]) => {
        if (storedItems) {
          const parsedItems = JSON.parse(storedItems) as CoupleItem[];
          setItems(
            parsedItems.map((item) =>
              item.category === "Plano" ? item : { ...item, done: true },
            ),
          );
        }
        if (storedProfiles) setProfiles(JSON.parse(storedProfiles));
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }, [loaded, profiles]);

  const activeProfile = profiles.find(
    (profile) => profile.id === activeProfileId,
  );
  const activeTheme = themes[activeProfile?.theme ?? "Romance"];
  const openAddModal = (mode: AddMode) => {
    setAddMode(mode);
    setModalVisible(true);
  };

  const screen = useMemo(() => {
    if (!activeProfile) return null;
    const onToggle = (id: string) =>
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, done: !item.done } : item,
        ),
      );
    if (tab === "colecao")
      return (
        <CollectionScreen
          items={items}
          theme={activeTheme}
          onAdd={() => openAddModal("memory")}
        />
      );
    if (tab === "planos")
      return (
        <PlansScreen
          items={items}
          theme={activeTheme}
          onAdd={() => openAddModal("plan")}
          onToggle={onToggle}
        />
      );
    if (tab === "perfil")
      return (
        <ProfileScreen
          profile={activeProfile}
          items={items}
          theme={activeTheme}
          onEdit={() => setEditProfileVisible(true)}
          onUpdate={(updated) =>
            setProfiles((current) =>
              current.map((profile) =>
                profile.id === updated.id ? updated : profile,
              ),
            )
          }
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
        onViewAll={() => setTab("colecao")}
      />
    );
  }, [activeProfile, activeTheme, items, tab]);

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
      <StatusBar style="dark" />
      <View
        style={[styles.appShell, { backgroundColor: activeTheme.background }]}
      >
        <ThemeDecorations theme={activeTheme} />
        <View style={styles.screenLayer}>{screen}</View>
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
                onPress={() => setTab(item.key)}
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
      </View>
      <AddModal
        visible={modalVisible}
        mode={addMode}
        theme={activeTheme}
        onClose={() => setModalVisible(false)}
        onSave={(item) => {
          setItems((current) => [item, ...current]);
          setModalVisible(false);
        }}
      />
      <EditProfileModal
        visible={editProfileVisible}
        profile={activeProfile}
        accent={activeTheme.accent}
        onClose={() => setEditProfileVisible(false)}
        onSave={(updated) => {
          setProfiles((current) =>
            current.map((profile) =>
              profile.id === updated.id ? updated : profile,
            ),
          );
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
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: palette.cream,
    overflow: "hidden",
  },
  screenLayer: { flex: 1, zIndex: 1 },
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
  scrollContent: { padding: 20, paddingBottom: 118 },
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
  monthLabel: {
    color: palette.blush,
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
  progressFill: { height: "100%", backgroundColor: palette.blush, borderRadius: 3 },
  monthHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    marginTop: 13,
  },
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
  planDate: { color: palette.rose, fontWeight: "800", fontSize: 11 },
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 22,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
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
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(35,28,34,0.4)" },
  modalDismiss: { flex: 1 },
  modalSheet: {
    backgroundColor: palette.cream,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 22,
    paddingBottom: Platform.OS === "ios" ? 35 : 24,
    maxHeight: "94%",
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
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingVertical: 28,
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
  gateContent: { flex: 1, justifyContent: "center" },
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
    maxWidth: 330,
    marginTop: 9,
  },
  profileChoices: { flexDirection: "row", gap: 13, marginTop: 30 },
  profileChoice: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: palette.line,
    paddingVertical: 24,
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
    width: "33.333%",
    marginBottom: 15,
  },
  themeSwatch: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
    overflow: "hidden",
  },
  themeSwatchActive: {
    borderColor: "rgba(255,255,255,0.9)",
    transform: [{ scale: 1.06 }],
  },
  themeSwatchCharacter: { width: 40, height: 40 },
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
  themeName: { color: palette.muted, fontSize: 9, marginTop: 6 },
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
  settingDivider: { height: 1, backgroundColor: palette.line, marginLeft: 50 },
  aboutBox: {
    backgroundColor: "#FAF6F7",
    borderRadius: 14,
    padding: 14,
    marginBottom: 13,
  },
  aboutText: { color: palette.muted, fontSize: 11, lineHeight: 17 },
  aboutSignature: { fontSize: 10, fontWeight: "800", marginTop: 8 },
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
