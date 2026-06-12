import type { UploadFile } from "../types";

export const isRemoteImage = (uri?: string) =>
  Boolean(uri && /^https?:\/\//.test(uri));

export const toUploadFile = (uri: string): UploadFile => ({ uri });
