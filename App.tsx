import { SafeAreaProvider } from "react-native-safe-area-context";
import PlatformApp from "./versions";

export default function App() {
  return (
    <SafeAreaProvider>
      <PlatformApp />
    </SafeAreaProvider>
  );
}
