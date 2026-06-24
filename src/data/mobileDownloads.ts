export type MobileDownload = {
  id: string;
  platform: "Android" | "iOS";
  version: string;
  buildType: string;
  date: string;
  status: "Disponível" | "Em preparo";
  url: string;
  notes: string;
};

export const expoBuildsUrl =
  "https://expo.dev/accounts/1luisin/projects/catlovers/builds";

export const mobileDownloads: MobileDownload[] = [
  {
    id: "android-stable-0866b353",
    platform: "Android",
    version: "1.1.0",
    buildType: "Estável testada",
    date: "24 JUN 2026",
    status: "Disponível",
    url: "https://expo.dev/accounts/1luisin/projects/catlovers/builds/0866b353-0eb1-48f8-9150-af9bda681a54",
    notes: "Build estável testada e aprovada para instalação no celular.",
  },
  {
    id: "android-stable-93d6366d",
    platform: "Android",
    version: "1.1.0",
    buildType: "Estável",
    date: "24 JUN 2026",
    status: "Disponível",
    url: "https://expo.dev/accounts/1luisin/projects/catlovers/builds/93d6366d-5d45-4964-a7e3-cfedcf935909",
    notes: "Última versão estável cadastrada para instalação no celular.",
  },
];
