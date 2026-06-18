import { Stack } from "expo-router"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { StatusBar } from "expo-status-bar"
import { AuthProvider } from "@/providers/auth-provider"
import { BoardsProvider } from "@/providers/boards-provider"

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <BoardsProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </BoardsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
