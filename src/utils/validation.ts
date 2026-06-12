export const hasText = (value: string) => value.trim().length > 0;

export const normalizeRating = (rating?: number) =>
  rating && rating >= 1 && rating <= 5 ? rating : undefined;
