import { Alert, Pressable, StyleSheet, Text, View } from "react-native"
import Constants from "expo-constants"
import { Screen } from "@/components/screen"
import { getApiUrl } from "@/api/client"
import { palette } from "@/lib/theme"
import { useAuth } from "@/providers/auth-provider"

export default function SettingsScreen() {
  const { currentUser, logout } = useAuth()

  return (
    <Screen scroll>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{currentUser?.fullName}</Text>
        <Text style={styles.meta}>{currentUser?.email}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>API</Text>
        <Text style={styles.meta}>{getApiUrl()}</Text>
        <Text style={styles.label}>App version</Text>
        <Text style={styles.meta}>{Constants.expoConfig?.version || "1.0.0"}</Text>
      </View>
      <Pressable
        style={styles.logoutButton}
        onPress={() =>
          Alert.alert("Sign out", "You will need to sign in again on mobile.", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign out", style: "destructive", onPress: () => void logout() },
          ])
        }
      >
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: palette.text,
    marginBottom: 18,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    marginBottom: 12,
    gap: 6,
  },
  label: {
    color: palette.text,
    fontWeight: "700",
  },
  value: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    color: palette.textMuted,
  },
  logoutButton: {
    marginTop: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 16,
  },
  logoutText: {
    color: palette.danger,
    fontWeight: "800",
  },
})
