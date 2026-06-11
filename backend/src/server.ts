import fs from "node:fs";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { config } from "./config.js";
import { pool } from "./db.js";
import { itemsRouter } from "./routes/items.routes.js";
import { monthlyGoalsRouter } from "./routes/monthlyGoals.routes.js";
import { profilesRouter } from "./routes/profiles.routes.js";

fs.mkdirSync(config.uploadDir, { recursive: true });

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(config.uploadDir));
app.get("/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok", database: "connected" });
  } catch {
    response.status(503).json({ status: "degraded", database: "unavailable" });
  }
});
app.use("/profiles", profilesRouter);
app.use("/items", itemsRouter);
app.use("/monthly-goals", monthlyGoalsRouter);
app.use((_request, response) => {
  response.status(404).json({ error: "Rota não encontrada." });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  const message =
    error instanceof Error ? error.message : "Erro interno do servidor.";
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : undefined;
  const status =
    code === "23505"
      ? 409
      : code === "LIMIT_FILE_SIZE" || message.startsWith("Formato inválido")
        ? 400
        : 500;
  response.status(status).json({ error: message });
};
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`CatLovers API em http://localhost:${config.port}`);
  });
}
