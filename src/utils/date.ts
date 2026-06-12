import { monthAbbreviations, monthNames } from "../data/uiConstants";

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatFullDate(value: string) {
  const date = fromIsoDate(value);
  return `${String(date.getDate()).padStart(2, "0")} de ${
    monthNames[date.getMonth()]
  } de ${date.getFullYear()}`;
}

export function formatCardDate(value: string) {
  const date = fromIsoDate(value);
  return `${String(date.getDate()).padStart(2, "0")} ${
    monthAbbreviations[date.getMonth()]
  }`;
}
