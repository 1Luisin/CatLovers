import type { Response } from "express";

export function requireFields(
  body: Record<string, unknown>,
  fields: string[],
  response: Response,
) {
  const missing = fields.filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === "",
  );
  if (!missing.length) return true;
  response.status(400).json({ error: `Campos obrigatórios: ${missing.join(", ")}` });
  return false;
}

export const isMonthKey = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
