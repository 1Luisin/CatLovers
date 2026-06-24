import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const outputPath = resolve("src/data/mobileDownloads.ts");
const expoBuildsUrl =
  "https://expo.dev/accounts/1luisin/projects/catlovers/builds";

const result = spawnSync(
  "npx",
  [
    "--yes",
    "eas-cli@20.2.0",
    "build:list",
    "--platform",
    "all",
    "--limit",
    "50",
    "--json",
    "--non-interactive",
  ],
  {
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout);
  throw new Error(
    "Nao foi possivel ler os builds. Faca login com `eas login` ou defina EXPO_TOKEN.",
  );
}

const parsed = JSON.parse(result.stdout);
const builds = Array.isArray(parsed) ? parsed : (parsed.builds ?? []);

const formatDate = (value) => {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(value))
    .replace(".", "")
    .toUpperCase();
};

const platformLabel = (platform) =>
  String(platform).toLowerCase() === "ios" ? "iOS" : "Android";

const getArtifactUrl = (build) =>
  build.artifacts?.applicationArchiveUrl ??
  build.artifacts?.buildUrl ??
  build.artifact?.url ??
  build.url ??
  "";

const downloads = builds
  .filter((build) => build.status === "finished")
  .map((build) => ({
    id: String(build.id),
    platform: platformLabel(build.platform),
    version: build.appVersion
      ? `v${build.appVersion}`
      : build.runtimeVersion
        ? `runtime ${build.runtimeVersion}`
        : "Versao mobile",
    buildType: build.buildProfile ?? build.profile ?? build.distribution ?? "EAS",
    date: formatDate(build.completedAt ?? build.createdAt),
    status: getArtifactUrl(build) ? "Disponível" : "Em preparo",
    url: getArtifactUrl(build),
    notes: `${platformLabel(build.platform)} gerado pelo EAS para instalacao interna.`,
  }))
  .filter((build) => build.url);

const file = `export type MobileDownload = {
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
  "${expoBuildsUrl}";

export const mobileDownloads: MobileDownload[] = ${JSON.stringify(
  downloads,
  null,
  2,
)};
`;

writeFileSync(outputPath, file, "utf8");
console.log(`Downloads sincronizados: ${downloads.length}`);
