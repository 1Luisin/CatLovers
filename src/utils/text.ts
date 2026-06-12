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

export const correctLegacyText = (value: string) =>
  legacyTextCorrections[value] ?? value;
