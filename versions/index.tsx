import { Platform } from "react-native";

import IOSApp from "./IOS/App";
import AndroidApp from "./ANDROID/App";
import WebApp from "./WEB/App";

const SelectedApp =
  Platform.OS === "ios"
    ? IOSApp
    : Platform.OS === "android"
      ? AndroidApp
      : WebApp;

export default SelectedApp;
