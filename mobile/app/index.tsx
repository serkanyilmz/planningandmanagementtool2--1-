import { Redirect } from "expo-router"
import { ActivityIndicator, View } from "react-native"
import { useAuth } from "@/providers/auth-provider"

export default function IndexScreen() {
  const { isHydrated, token, currentUser } = useAuth()

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    )
  }

  return <Redirect href={token && currentUser ? "/(tabs)/boards" : "/(auth)/login"} />
}
