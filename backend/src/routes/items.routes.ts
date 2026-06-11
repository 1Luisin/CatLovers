import fs from "node:fs/promises";
import { Router } from "express";
import { config } from "../config.js";
import { upload } from "../middlewares/upload.js";
import {
  createItem,
  deleteItem,
  findItem,
  listItems,
  listPhotoPaths,
  replaceItemPhoto,
  toggleItem,
  updateItem,
} from "../repositories/itemsRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireFields } from "../utils/http.js";

export const itemsRouter = Router();

const removeFiles = async (paths: string[]) => {
  await Promise.all(paths.map((file) => fs.unlink(file).catch(() => undefined)));
};

itemsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const profileId =
      typeof request.query.profileId === "string"
        ? request.query.profileId
        : undefined;
    response.json(await listItems(profileId));
  }),
);

itemsRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const item = await findItem(String(request.params.id));
    if (!item) return response.status(404).json({ error: "Item não encontrado." });
    response.json(item);
  }),
);

itemsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    if (!requireFields(request.body, ["title", "category"], response)) return;
    response.status(201).json(await createItem(request.body));
  }),
);

itemsRouter.put(
  "/:id",
  asyncHandler(async (request, response) => {
    const item = await updateItem(String(request.params.id), request.body);
    if (!item) return response.status(404).json({ error: "Item não encontrado." });
    response.json(item);
  }),
);

itemsRouter.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    const paths = await listPhotoPaths(id);
    const result = await deleteItem(id);
    if (!result.rowCount) {
      return response.status(404).json({ error: "Item não encontrado." });
    }
    await removeFiles(paths);
    response.status(204).send();
  }),
);

itemsRouter.patch(
  "/:id/toggle-done",
  asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    const existing = await findItem(id);
    if (!existing) return response.status(404).json({ error: "Item não encontrado." });
    if (existing.category !== "Plano") {
      return response.status(400).json({ error: "Apenas planos podem ser alternados." });
    }
    response.json(await toggleItem(id));
  }),
);

itemsRouter.post(
  "/:id/photo",
  upload.single("photo"),
  asyncHandler(async (request, response) => {
    if (!request.file) {
      return response.status(400).json({ error: "Envie uma imagem no campo photo." });
    }
    const id = String(request.params.id);
    const item = await findItem(id);
    if (!item) {
      await removeFiles([request.file.path]);
      return response.status(404).json({ error: "Item não encontrado." });
    }
    const publicUrl = `${config.publicBaseUrl}/uploads/${request.file.filename}`;
    const previous = await replaceItemPhoto(
      id,
      request.file,
      publicUrl,
    );
    await removeFiles(previous);
    response.json(await findItem(id));
  }),
);
