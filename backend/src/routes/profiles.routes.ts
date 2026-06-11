import { Router } from "express";
import { config } from "../config.js";
import { upload } from "../middlewares/upload.js";
import {
  createProfile,
  findProfile,
  listProfiles,
  updateProfile,
  updateProfilePhoto,
} from "../repositories/profilesRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireFields } from "../utils/http.js";

export const profilesRouter = Router();

profilesRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json(await listProfiles());
  }),
);

profilesRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const profile = await findProfile(String(request.params.id));
    if (!profile) return response.status(404).json({ error: "Perfil não encontrado." });
    response.json(profile);
  }),
);

profilesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    if (!requireFields(request.body, ["code", "name"], response)) return;
    response.status(201).json(await createProfile(request.body));
  }),
);

profilesRouter.put(
  "/:id",
  asyncHandler(async (request, response) => {
    const profile = await updateProfile(String(request.params.id), request.body);
    if (!profile) return response.status(404).json({ error: "Perfil não encontrado." });
    response.json(profile);
  }),
);

profilesRouter.patch(
  "/:id/settings",
  asyncHandler(async (request, response) => {
    const profile = await updateProfile(String(request.params.id), request.body, true);
    if (!profile) return response.status(404).json({ error: "Perfil não encontrado." });
    response.json(profile);
  }),
);

profilesRouter.post(
  "/:id/photo",
  upload.single("photo"),
  asyncHandler(async (request, response) => {
    if (!request.file) {
      return response.status(400).json({ error: "Envie uma imagem no campo photo." });
    }
    const publicUrl = `${config.publicBaseUrl}/uploads/${request.file.filename}`;
    const profile = await updateProfilePhoto(String(request.params.id), publicUrl);
    if (!profile) return response.status(404).json({ error: "Perfil não encontrado." });
    response.json(profile);
  }),
);
