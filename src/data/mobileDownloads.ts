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

export const mobileDownloads: MobileDownload[] = [];
