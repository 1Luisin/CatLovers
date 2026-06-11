import "dotenv/config";
import path from "node:path";

export const config = {
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: process.env.DATABASE_URL ?? "",
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "uploads"),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL ?? "http://localhost:3333").replace(
    /\/+$/,
    "",
  ),
};

if (!config.databaseUrl) {
  console.warn("DATABASE_URL não configurada. Rotas que usam o banco falharão.");
}
