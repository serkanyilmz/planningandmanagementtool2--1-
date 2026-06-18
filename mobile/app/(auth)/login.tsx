import { useState } from "react"
import { Redirect, router } from "expo-router"
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { Screen } from "@/components/screen"
import { palette } from "@/lib/theme"
import { useAuth } from "@/providers/auth-provider"

export default function LoginScreen() {
  const { token, currentUser, login } = useAuth()
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  if (token && currentUser) {
    return <Redirect href="/(tabs)/boards" />
  }

  const handleSubmit = async () => {
    setLoading(true)
    const result = await login(usernameOrEmail, password)
    setLoading(false)
    if (!result.success) {
      Alert.alert("Sign in failed", result.error || "Please try again.")
      return
    }
    router.replace("/(tabs)/boards")
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.brand}>Planify</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.copy}>Sign in to manage boards, tasks, and AI suggestions on mobile.</Text>
      </View>
      <View style={styles.card}>
        <TextInput
          placeholder="Username or email"
          autoCapitalize="none"
          value={usernameOrEmail}
          onChangeText={setUsernameOrEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <Pressable style={styles.primaryButton} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>{loading ? "Signing in..." : "Sign in"}</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.link}>Need an account? Register</Text>
        </Pressable>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
    marginTop: 40,
    marginBottom: 24,
  },
  brand: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: palette.text,
    fontSize: 32,
    fontWeight: "800",
  },
  copy: {
    color: palette.textMuted,
    lineHeight: 22,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
  },
  input: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  link: {
    textAlign: "center",
    color: palette.primary,
    fontWeight: "700",
    marginTop: 4,
  },
})
