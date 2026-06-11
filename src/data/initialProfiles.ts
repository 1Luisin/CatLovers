import type { Profile } from "../types";

export const initialProfiles: Profile[] = [
  {
    id: "leticia",
    code: "leticia",
    name: "Letícia",
    birthDate: "2003-09-18",
    bio: "Apaixonada por histórias, café e pelos nossos domingos sem pressa.",
    color: "#E9A29D",
    theme: "Romance",
    notifications: true,
    privateProfile: true,
    weeklyQuestion: true,
  },
  {
    id: "luis",
    code: "luis",
    name: "Luis",
    birthDate: "2001-05-03",
    bio: "Jogos cooperativos, filmes longos e qualquer plano que seja a dois.",
    color: "#9B8BC1",
    theme: "Lavanda",
    notifications: true,
    privateProfile: true,
    weeklyQuestion: false,
  },
];
