import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { config } from "../config.js";

fs.mkdirSync(config.uploadDir, { recursive: true });

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_request, file, callback) => {
      const extension =
        path.extname(file.originalname).toLowerCase() ||
        (file.mimetype === "image/png"
          ? ".png"
          : file.mimetype === "image/webp"
            ? ".webp"
            : ".jpg");
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (allowedTypes.has(file.mimetype)) callback(null, true);
    else callback(new Error("Formato inválido. Use JPEG, PNG ou WebP."));
  },
});
