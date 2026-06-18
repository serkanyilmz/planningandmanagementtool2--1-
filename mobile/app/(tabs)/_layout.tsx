import { Redirect, Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { View } from "react-native"
import { ReminderStrip } from "@/components/reminder-strip"
import { palette } from "@/lib/theme"
import { useAuth } from "@/providers/auth-provider"

export default function TabsLayout() {
  const { isHydrated, token, currentUser } = useAuth()

  if (isHydrated && (!token || !currentUser)) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10, backgroundColor: palette.surfaceMuted }}>
        <ReminderStrip />
      </View>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.primary,
        }}
      >
        <Tabs.Screen
          name="boards"
          options={{
            title: "Boards",
            tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
          }}
        />
      </Tabs>
    </View>
  )
}
