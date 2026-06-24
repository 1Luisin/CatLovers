import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, {
  Circle,
  Path,
  Text as SvgText,
} from "react-native-svg";
import {
  loadRouletteOptions,
  saveRouletteOptions,
} from "../../../services/storageService";
import { palette } from "../../../theme/themes";
import type { ThemePalette as AppTheme } from "../../../types";
import { supportsNativeDriver } from "../../../utils/platform";

const MAX_OPTIONS = 100;
const WHEEL_SIZE = 260;
const WHEEL_CENTER = WHEEL_SIZE / 2;
const WHEEL_RADIUS = 124;
const LABEL_RADIUS = 82;

const defaultRouletteOptions = [
  "Cinema",
  "Café novo",
  "Anime juntinhos",
  "Jogo cooperativo",
  "Rolê no parque",
  "Noite de massas",
];

const segmentColors = [
  "#F29AA4",
  "#B993D6",
  "#6FB1D6",
  "#8ABFA3",
  "#F3B66F",
  "#D98D73",
  "#7D78B8",
  "#C65D6C",
  "#A9795F",
  "#5FA8D3",
];

type AppHeaderComponent = React.ComponentType<{
  eyebrow: string;
  title: string;
  subtitle?: string;
  theme: AppTheme;
}>;

type RouletteScreenBaseProps = {
  theme: AppTheme;
  styles: Record<string, any>;
  Header: AppHeaderComponent;
};

function normalizeOptions(options: string[]) {
  const unique = new Set<string>();
  return options
    .map((option) => option.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .filter((option) => {
      const key = option.toLocaleLowerCase("pt-BR");
      if (unique.has(key)) return false;
      unique.add(key);
      return true;
    })
    .slice(0, MAX_OPTIONS);
}

function pointOnWheel(angle: number, radius = WHEEL_RADIUS) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: WHEEL_CENTER + radius * Math.cos(radians),
    y: WHEEL_CENTER + radius * Math.sin(radians),
  };
}

function segmentPath(index: number, total: number) {
  const segmentSize = 360 / total;
  const startAngle = index * segmentSize;
  const endAngle = startAngle + segmentSize;
  const start = pointOnWheel(startAngle);
  const end = pointOnWheel(endAngle);
  const largeArcFlag = segmentSize > 180 ? 1 : 0;

  return [
    `M ${WHEEL_CENTER} ${WHEEL_CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function wheelLabel(option: string, total: number, index: number) {
  if (total > 18) return String(index + 1);
  const limit = total <= 6 ? 15 : total <= 10 ? 11 : 8;
  return option.length > limit ? `${option.slice(0, limit - 1)}…` : option;
}

export function RouletteScreenBase({
  theme,
  styles,
  Header,
}: RouletteScreenBaseProps) {
  const [options, setOptions] = useState(defaultRouletteOptions);
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState("");
  const [spinning, setSpinning] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    loadRouletteOptions()
      .then((stored) => {
        if (!mounted || !stored?.length) return;
        setOptions(normalizeOptions(stored));
      })
      .catch(() => {
        if (mounted) {
          setFeedback("Não foi possível carregar a lista salva.");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const persistOptions = useCallback((nextOptions: string[]) => {
    const normalized = normalizeOptions(nextOptions);
    setOptions(normalized);
    void saveRouletteOptions(normalized);
  }, []);

  const addOption = useCallback(() => {
    const nextOption = draft.trim().replace(/\s+/g, " ");
    if (!nextOption) {
      setFeedback("Digite uma ideia antes de adicionar.");
      return;
    }

    if (options.length >= MAX_OPTIONS) {
      setFeedback(`A roleta aceita no máximo ${MAX_OPTIONS} opções.`);
      return;
    }

    const exists = options.some(
      (option) =>
        option.toLocaleLowerCase("pt-BR") ===
        nextOption.toLocaleLowerCase("pt-BR"),
    );
    if (exists) {
      setFeedback("Essa ideia já está na roleta.");
      return;
    }

    persistOptions([...options, nextOption]);
    setDraft("");
    setFeedback("Ideia adicionada à roleta.");
  }, [draft, options, persistOptions]);

  const removeOption = useCallback(
    (index: number) => {
      const nextOptions = options.filter((_, optionIndex) => optionIndex !== index);
      if (selected === options[index]) setSelected("");
      persistOptions(nextOptions);
      setFeedback("Ideia removida da roleta.");
    },
    [options, persistOptions, selected],
  );

  const restoreDefaults = useCallback(() => {
    persistOptions(defaultRouletteOptions);
    setSelected("");
    setFeedback("Lista padrão restaurada.");
  }, [persistOptions]);

  const clearOptions = useCallback(() => {
    persistOptions([]);
    setSelected("");
    setFeedback("Lista limpa. Adicione novas ideias para girar.");
  }, [persistOptions]);

  const removeSelected = useCallback(() => {
    if (!selected) return;
    const selectedIndex = options.findIndex((option) => option === selected);
    if (selectedIndex < 0) return;
    removeOption(selectedIndex);
  }, [options, removeOption, selected]);

  const spinWheel = useCallback(() => {
    if (spinning) return;
    if (!options.length) {
      setFeedback("Adicione pelo menos uma ideia para girar.");
      return;
    }

    const snapshot = [...options];
    const resultIndex = Math.floor(Math.random() * snapshot.length);
    const segmentSize = 360 / snapshot.length;
    const resultAngle = resultIndex * segmentSize + segmentSize / 2;
    const extraTurns = 5 + Math.floor(Math.random() * 4);
    const finalRotation = extraTurns * 360 + (360 - resultAngle);

    setSpinning(true);
    setSelected("");
    setFeedback("");
    rotation.stopAnimation();
    rotation.setValue(0);
    Animated.timing(rotation, {
      toValue: finalRotation,
      duration: 3200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: supportsNativeDriver,
    }).start(({ finished }) => {
      setSpinning(false);
      if (!finished) return;
      setSelected(snapshot[resultIndex]);
      setFeedback("Programa escolhido.");
    });
  }, [options, rotation, spinning]);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option === selected),
    [options, selected],
  );
  const selectedColor =
    selectedIndex >= 0
      ? segmentColors[selectedIndex % segmentColors.length]
      : theme.accent;

  const wheelRotation = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
    extrapolate: "extend",
  });

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Header
        eyebrow="SORTEAR JUNTOS"
        title="Roleta do próximo programa"
        subtitle="Coloquem ideias, girem a roleta e deixem o acaso escolher o próximo rolê."
        theme={theme}
      />

      <LinearGradient
        colors={theme.heroColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.rouletteHero, { shadowColor: theme.accent }]}
      >
        <View style={styles.heroDecorationOne} />
        <View style={styles.heroDecorationTwo} />
        <View style={styles.rouletteHeroHeader}>
          <View style={styles.rouletteHeroIcon}>
            <Ionicons name="aperture-outline" size={24} color={palette.paper} />
          </View>
          <View>
            <Text style={styles.rouletteHeroKicker}>ESCOLHA ALEATÓRIA</Text>
            <Text style={styles.rouletteHeroTitle}>Gire para decidir</Text>
          </View>
        </View>
        <Text style={styles.rouletteHeroText}>
          A lista fica salva neste dispositivo. A roleta sorteia todas as ideias
          cadastradas, mesmo quando só algumas aparecem no círculo.
        </Text>
      </LinearGradient>

      <View style={styles.rouletteStage}>
        <View
          style={[
            styles.roulettePointer,
            { borderTopColor: theme.accent },
          ]}
        />
        <View
          style={[
            styles.roulettePointerNeedle,
            { backgroundColor: theme.accent },
          ]}
        />
        <Animated.View
          style={[
            styles.rouletteWheel,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              transform: [{ rotate: wheelRotation }],
            },
          ]}
        >
          <Svg
            width={WHEEL_SIZE}
            height={WHEEL_SIZE}
            viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
            style={styles.rouletteWheelSvg}
          >
            <Circle
              cx={WHEEL_CENTER}
              cy={WHEEL_CENTER}
              r={WHEEL_RADIUS}
              fill={theme.accentSoft}
            />
            {options.length ? (
              options.map((option, index) => {
                const selectedOption = option === selected;
                const segmentSize = 360 / options.length;
                const labelAngle = index * segmentSize + segmentSize / 2;
                const labelPoint = pointOnWheel(labelAngle, LABEL_RADIUS);

                return (
                  <React.Fragment key={`${option}-${index}`}>
                    <Path
                      d={segmentPath(index, options.length)}
                      fill={
                        selectedOption
                          ? selectedColor
                          : segmentColors[index % segmentColors.length]
                      }
                      stroke={selectedOption ? palette.paper : theme.surface}
                      strokeWidth={selectedOption ? 5 : 3}
                    />
                    <SvgText
                      x={labelPoint.x}
                      y={labelPoint.y}
                      fill={palette.paper}
                      fontSize={options.length <= 8 ? 10 : 8}
                      fontWeight="900"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {wheelLabel(option, options.length, index)}
                    </SvgText>
                  </React.Fragment>
                );
              })
            ) : (
              <Path
                d={segmentPath(0, 1)}
                fill={theme.accentSoft}
                stroke={theme.surface}
                strokeWidth={3}
              />
            )}
            <Circle
              cx={WHEEL_CENTER}
              cy={WHEEL_CENTER}
              r={WHEEL_RADIUS}
              fill="none"
              stroke={theme.border}
              strokeWidth={3}
            />
            <Circle
              cx={WHEEL_CENTER}
              cy={WHEEL_CENTER}
              r={48}
              fill={theme.surface}
              stroke={theme.border}
              strokeWidth={3}
            />
          </Svg>
        </Animated.View>

        <Pressable
          disabled={spinning || !options.length}
          onPress={spinWheel}
          style={({ pressed }) => [
            styles.rouletteSpinButton,
            { backgroundColor: theme.accent },
            (!options.length || spinning) && styles.rouletteDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={spinning ? "sync-outline" : selected ? "refresh" : "play"}
            size={18}
            color={palette.paper}
          />
          <Text style={styles.rouletteSpinText}>
            {spinning ? "Girando" : selected ? "Girar de novo" : "Girar"}
          </Text>
        </Pressable>
        {selected ? (
          <View
            style={[
              styles.rouletteWinnerRibbon,
              {
                backgroundColor: theme.surface,
                borderColor: selectedColor,
                shadowColor: selectedColor,
              },
            ]}
          >
            <View
              style={[
                styles.rouletteWinnerIcon,
                { backgroundColor: selectedColor },
              ]}
            >
              <Ionicons name="sparkles" size={20} color={palette.paper} />
            </View>
            <View style={styles.rouletteWinnerTextBlock}>
              <Text
                style={[styles.rouletteWinnerLabel, { color: theme.accent }]}
              >
                PROGRAMA SORTEADO
              </Text>
              <Text
                numberOfLines={2}
                style={[styles.rouletteWinnerTitle, { color: theme.title }]}
              >
                {selected}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.rouletteResultCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
          selected && {
            borderColor: selectedColor,
            borderWidth: 2,
            shadowColor: selectedColor,
          },
        ]}
      >
        <Text style={[styles.rouletteResultLabel, { color: theme.accent }]}>
          RESULTADO
        </Text>
        <Text style={[styles.rouletteResultValue, { color: theme.title }]}>
          {selected || "Toque em girar para sortear"}
        </Text>
        <Text style={[styles.rouletteResultHint, { color: theme.muted }]}>
          {feedback || `${options.length} ideias na roleta`}
        </Text>
        {selected ? (
          <Pressable
            onPress={removeSelected}
            style={({ pressed }) => [
              styles.rouletteSecondaryButton,
              { borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="eye-off-outline" size={16} color={theme.accent} />
            <Text
              style={[
                styles.rouletteSecondaryButtonText,
                { color: theme.accent },
              ]}
            >
              Ocultar sorteado
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View
        style={[
          styles.rouletteInputCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.rouletteInputLabel, { color: theme.title }]}>
          Adicionar ideia
        </Text>
        <View style={styles.rouletteInputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={addOption}
            placeholder="Ex.: Sushi, cinema, parque..."
            placeholderTextColor="#B3A7AD"
            returnKeyType="done"
            style={[
              styles.rouletteInput,
              {
                borderColor: theme.border,
                color: theme.title,
                backgroundColor: theme.background,
              },
            ]}
          />
          <Pressable
            onPress={addOption}
            style={({ pressed }) => [
              styles.rouletteAddButton,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="add" size={20} color={palette.paper} />
          </Pressable>
        </View>
      </View>

      <View style={styles.rouletteOptionsHeader}>
        <View>
          <Text style={[styles.sectionEyebrow, { color: theme.accent }]}>
            LISTA
          </Text>
          <Text style={[styles.sectionTitle, { color: theme.title }]}>
            Ideias da roleta
          </Text>
        </View>
        <Text style={[styles.resultCount, { color: theme.muted }]}>
          {options.length}/{MAX_OPTIONS}
        </Text>
      </View>

      <View style={styles.rouletteActionRow}>
        <Pressable
          onPress={restoreDefaults}
          style={({ pressed }) => [
            styles.rouletteActionButton,
            { borderColor: theme.border },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="refresh-outline" size={15} color={theme.accent} />
          <Text style={[styles.rouletteActionText, { color: theme.accent }]}>
            Padrão
          </Text>
        </Pressable>
        <Pressable
          onPress={clearOptions}
          style={({ pressed }) => [
            styles.rouletteActionButton,
            { borderColor: theme.border },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="trash-outline" size={15} color={theme.accent} />
          <Text style={[styles.rouletteActionText, { color: theme.accent }]}>
            Limpar
          </Text>
        </Pressable>
      </View>

      {options.length ? (
        options.map((option, index) => (
          <View
            key={`${option}-${index}`}
            style={[
              styles.rouletteOptionRow,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.rouletteOptionIndex,
                { backgroundColor: theme.accentSoft },
              ]}
            >
              <Text
                style={[styles.rouletteOptionIndexText, { color: theme.accent }]}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              numberOfLines={2}
              style={[styles.rouletteOptionText, { color: theme.title }]}
            >
              {option}
            </Text>
            <Pressable
              disabled={spinning}
              onPress={() => removeOption(index)}
              style={({ pressed }) => [
                styles.rouletteRemoveButton,
                spinning && styles.rouletteDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={17} color={theme.muted} />
            </Pressable>
          </View>
        ))
      ) : (
        <View
          style={[
            styles.rouletteEmptyCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="list-outline" size={28} color={theme.accent} />
          <Text style={[styles.rouletteEmptyTitle, { color: theme.title }]}>
            Sem ideias ainda
          </Text>
          <Text style={[styles.rouletteEmptyText, { color: theme.muted }]}>
            Adicione pelo menos uma opção para a roleta começar a funcionar.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
