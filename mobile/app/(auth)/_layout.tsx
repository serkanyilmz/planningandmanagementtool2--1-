import { Redirect, Stack } from "expo-router"
import { useAuth } from "@/providers/auth-provider"

export default function AuthLayout() {
  const { isHydrated, token, currentUser } = useAuth()

  if (isHydrated && token && currentUser) {
    return <Redirect href="/(tabs)/boards" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
