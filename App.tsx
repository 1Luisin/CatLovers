import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Category = "Filme" | "Serie" | "Jogo" | "Plano";
type Tab = "inicio" | "colecao" | "planos" | "nos";
type Filter = "Todos" | Category;

type CoupleItem = {
  id: string;
  title: string;
  category: Category;
  note: string;
  date: string;
  done: boolean;
  rating?: number;
  color: string;
};

const STORAGE_KEY = "@catlovers/items";

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

const initialItems: CoupleItem[] = [
  {
    id: "1",
    title: "Maratona de Severance",
    category: "Serie",
    note: "Dois episodios e sobremesa no sofa.",
    date: "12 JUN",
    done: false,
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
  Plano: { icon: "calendar-outline", color: palette.apricot, label: "Plano" },
};

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
  { key: "nos", label: "Nos", icon: "heart-outline", activeIcon: "heart" },
];

function AppHeader({
  eyebrow,
  title,
  onAdd,
}: {
  eyebrow: string;
  title: string;
  onAdd: () => void;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.pageTitle}>{title}</Text>
      </View>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
      >
        <Ionicons name="add" size={25} color={palette.paper} />
      </Pressable>
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
  onToggle,
}: {
  item: CoupleItem;
  onToggle: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onToggle(item.id)}
      style={({ pressed }) => [styles.memoryCard, pressed && styles.pressed]}
    >
      <View style={[styles.memoryStripe, { backgroundColor: item.color }]} />
      <View style={styles.memoryBody}>
        <View style={styles.memoryTop}>
          <CategoryPill category={item.category} />
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <Text style={styles.memoryTitle}>{item.title}</Text>
        <Text style={styles.memoryNote} numberOfLines={2}>
          {item.note}
        </Text>
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
            <Text style={styles.pendingText}>Na nossa lista</Text>
          )}
          <View
            style={[
              styles.checkCircle,
              item.done && { backgroundColor: item.color, borderColor: item.color },
            ]}
          >
            {item.done && (
              <Ionicons name="checkmark" size={15} color={palette.paper} />
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function HomeScreen({
  items,
  onAdd,
  onToggle,
}: {
  items: CoupleItem[];
  onAdd: () => void;
  onToggle: (id: string) => void;
}) {
  const completed = items.filter((item) => item.done).length;
  const nextPlan = items.find((item) => !item.done);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader eyebrow="SEGUNDA, 8 DE JUNHO" title="Oi, Bia & Leo" onAdd={onAdd} />

      <LinearGradient
        colors={["#D36A76", "#A77BC0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
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
              <Text style={styles.avatarText}>B</Text>
            </View>
            <View
              style={[
                styles.avatar,
                styles.avatarOverlap,
                { backgroundColor: "#C5B5DD" },
              ]}
            >
              <Text style={styles.avatarText}>L</Text>
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
          <Text style={styles.sectionEyebrow}>JUNHO</Text>
          <Text style={styles.sectionTitle}>Nosso mes</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{completed} feitos</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="sparkles-outline" size={20} color={palette.rose} />
          <Text style={styles.statValue}>{items.length}</Text>
          <Text style={styles.statLabel}>momentos salvos</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={21} color={palette.lilac} />
          <Text style={styles.statValue}>
            {items.filter((item) => !item.done).length}
          </Text>
          <Text style={styles.statLabel}>ideias esperando</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ultimas memorias</Text>
        <Pressable>
          <Text style={styles.linkText}>Ver todas</Text>
        </Pressable>
      </View>
      {items.slice(0, 3).map((item) => (
        <MemoryCard key={item.id} item={item} onToggle={onToggle} />
      ))}
    </ScrollView>
  );
}

function CollectionScreen({
  items,
  onAdd,
  onToggle,
}: {
  items: CoupleItem[];
  onAdd: () => void;
  onToggle: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("Todos");
  const filters: Filter[] = ["Todos", "Filme", "Serie", "Jogo"];
  const visible = items.filter(
    (item) => item.category !== "Plano" && (filter === "Todos" || item.category === filter),
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <AppHeader eyebrow="TUDO QUE VIVEMOS" title="Nossa colecao" onAdd={onAdd} />
      <Text style={styles.introText}>
        O nosso pequeno arquivo de historias, partidas e maratonas.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((item) => {
          const active = filter === item;
          return (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text
                style={[styles.filterChipText, active && styles.filterChipTextActive]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={styles.resultCount}>{visible.length} registros</Text>
      {visible.map((item) => (
        <MemoryCard key={item.id} item={item} onToggle={onToggle} />
      ))}
      {visible.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="albums-outline" size={36} color={palette.blush} />
          <Text style={styles.emptyTitle}>Um espaco em branco</Text>
          <Text style={styles.emptyText}>O primeiro registro dessa categoria e seu.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function PlansScreen({
  items,
  onAdd,
  onToggle,
}: {
  items: CoupleItem[];
  onAdd: () => void;
  onToggle: (id: string) => void;
}) {
  const plans = items.filter((item) => item.category === "Plano");
  const done = plans.filter((item) => item.done).length;
  const progress = plans.length ? done / plans.length : 0;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <AppHeader eyebrow="TEMPO DE QUALIDADE" title="Planos de junho" onAdd={onAdd} />
      <View style={styles.monthCard}>
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
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Lista do casal</Text>
        <Ionicons name="heart" size={17} color={palette.rose} />
      </View>
      {plans.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onToggle(item.id)}
          style={styles.planRow}
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
            <Text style={[styles.planTitle, item.done && styles.doneText]}>
              {item.title}
            </Text>
            <Text style={styles.planNote}>{item.note}</Text>
          </View>
          <Text style={styles.planDate}>{item.date.split(" ")[0]}</Text>
        </Pressable>
      ))}

      <Pressable onPress={onAdd} style={styles.dashedButton}>
        <Ionicons name="add-circle-outline" size={21} color={palette.rose} />
        <Text style={styles.dashedButtonText}>Adicionar uma ideia para junho</Text>
      </Pressable>
    </ScrollView>
  );
}

function UsScreen({ items, onAdd }: { items: CoupleItem[]; onAdd: () => void }) {
  const completed = items.filter((item) => item.done);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <AppHeader eyebrow="DESDE 14.02.2022" title="Bia & Leo" onAdd={onAdd} />
      <View style={styles.coupleCard}>
        <View style={styles.largeAvatars}>
          <View style={[styles.largeAvatar, { backgroundColor: "#F1B694" }]}>
            <Text style={styles.largeAvatarText}>B</Text>
          </View>
          <View style={styles.heartConnector}>
            <Ionicons name="heart" size={18} color={palette.paper} />
          </View>
          <View style={[styles.largeAvatar, { backgroundColor: "#A994C6" }]}>
            <Text style={styles.largeAvatarText}>L</Text>
          </View>
        </View>
        <Text style={styles.coupleQuote}>
          "Colecionando dias comuns que viram historias favoritas."
        </Text>
      </View>

      <View style={styles.achievementGrid}>
        <View style={styles.achievement}>
          <Text style={styles.achievementValue}>{completed.length}</Text>
          <Text style={styles.achievementLabel}>memorias</Text>
        </View>
        <View style={styles.achievement}>
          <Text style={styles.achievementValue}>4</Text>
          <Text style={styles.achievementLabel}>anos juntos</Text>
        </View>
        <View style={styles.achievement}>
          <Text style={styles.achievementValue}>12</Text>
          <Text style={styles.achievementLabel}>meses ativos</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 26, marginBottom: 14 }]}>
        Nosso jeito
      </Text>
      {[
        ["Nossa trilha sonora", "Musical-notes-outline", "18 musicas"],
        ["Lista de desejos", "gift-outline", "7 ideias"],
        ["Pergunta da semana", "chatbubble-ellipses-outline", "Responder juntos"],
      ].map(([label, icon, detail]) => (
        <Pressable key={label} style={styles.menuRow}>
          <View style={styles.menuIcon}>
            <Ionicons
              name={icon.toLowerCase() as keyof typeof Ionicons.glyphMap}
              size={20}
              color={palette.rose}
            />
          </View>
          <Text style={styles.menuLabel}>{label}</Text>
          <Text style={styles.menuDetail}>{detail}</Text>
          <Ionicons name="chevron-forward" size={17} color="#B8ADB3" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

function AddModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (item: CoupleItem) => void;
}) {
  const [category, setCategory] = useState<Category>("Filme");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  const save = () => {
    if (!title.trim()) {
      Alert.alert("Falta um titulo", "De um nome para esse momento.");
      return;
    }
    onSave({
      id: Date.now().toString(),
      title: title.trim(),
      note: note.trim() || "Um novo momento para viver juntos.",
      category,
      date: category === "Plano" ? "30 JUN" : "08 JUN",
      done: category !== "Plano",
      rating: category !== "Plano" ? 5 : undefined,
      color: categoryMeta[category].color,
    });
    setTitle("");
    setNote("");
    setCategory("Filme");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalDismiss} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalEyebrow}>GUARDAR JUNTOS</Text>
              <Text style={styles.modalTitle}>Novo registro</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={palette.ink} />
            </Pressable>
          </View>

          <Text style={styles.inputLabel}>O que vamos guardar?</Text>
          <View style={styles.categoryGrid}>
            {(Object.keys(categoryMeta) as Category[]).map((item) => {
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

          <Text style={styles.inputLabel}>Titulo</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex.: Cinema na sexta"
            placeholderTextColor="#AFA4AA"
            style={styles.input}
          />
          <Text style={styles.inputLabel}>Um detalhe para lembrar</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="O que tornou esse momento nosso?"
            placeholderTextColor="#AFA4AA"
            style={[styles.input, styles.textArea]}
            multiline
          />
          <Pressable onPress={save} style={styles.saveButton}>
            <LinearGradient
              colors={[palette.rose, "#A87BC1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveButtonText}>Guardar no CatLovers</Text>
              <Ionicons name="heart" size={17} color={palette.paper} />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("inicio");
  const [items, setItems] = useState<CoupleItem[]>(initialItems);
  const [modalVisible, setModalVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setItems(JSON.parse(stored));
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const screen = useMemo(() => {
    const props = {
      items,
      onAdd: () => setModalVisible(true),
      onToggle: (id: string) =>
        setItems((current) =>
          current.map((item) =>
            item.id === id ? { ...item, done: !item.done } : item,
          ),
        ),
    };
    if (tab === "colecao") return <CollectionScreen {...props} />;
    if (tab === "planos") return <PlansScreen {...props} />;
    if (tab === "nos") return <UsScreen items={items} onAdd={props.onAdd} />;
    return <HomeScreen {...props} />;
  }, [items, tab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        {screen}
        <View style={styles.tabBar}>
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
                  color={active ? palette.rose : "#9C9298"}
                />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <AddModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={(item) => {
          setItems((current) => [item, ...current]);
          setModalVisible(false);
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
  },
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
  memoryFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  ratingRow: { flexDirection: "row", gap: 2 },
  pendingText: { color: palette.rose, fontSize: 10, fontWeight: "700" },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D7CED2",
    alignItems: "center",
    justifyContent: "center",
  },
  introText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: -11,
    marginBottom: 22,
    maxWidth: 320,
  },
  filterRow: { gap: 8, paddingBottom: 20 },
  filterChip: {
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
  },
  filterChipActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  filterChipText: { color: palette.muted, fontSize: 12, fontWeight: "700" },
  filterChipTextActive: { color: palette.paper },
  resultCount: {
    color: "#9D9399",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: "uppercase",
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
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(35,28,34,0.4)" },
  modalDismiss: { flex: 1 },
  modalSheet: {
    backgroundColor: palette.cream,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 22,
    paddingBottom: Platform.OS === "ios" ? 35 : 24,
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
  categoryGrid: { flexDirection: "row", gap: 7, marginBottom: 20 },
  categoryOption: {
    flex: 1,
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
  saveButton: { borderRadius: 17, overflow: "hidden", marginTop: 2 },
  saveGradient: {
    height: 54,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { color: palette.paper, fontSize: 13, fontWeight: "800" },
});
