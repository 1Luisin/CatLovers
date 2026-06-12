import { Platform } from "react-native";

export const supportsNativeDriver = Platform.OS !== "web";

export const getDevelopmentApiHint = () => {
  if (Platform.OS === "android") return "http://10.0.2.2:3333";
  return "http://localhost:3333";
};
