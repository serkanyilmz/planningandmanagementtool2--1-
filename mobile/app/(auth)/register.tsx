import { useState } from "react"
import { router } from "expo-router"
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { Screen } from "@/components/screen"
import { palette } from "@/lib/theme"
import { useAuth } from "@/providers/auth-provider"

export default function RegisterScreen() {
  const { register } = useAuth()
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    const result = await register(fullName, username, email, password)
    setLoading(false)
    if (!result.success) {
      Alert.alert("Registration failed", result.error || "Please try again.")
      return
    }
    Alert.alert("Account created", "You can sign in now.")
    router.replace("/(auth)/login")
  }

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.copy}>We will keep backend and web in sync while mobile gets its own clean entry point.</Text>
      </View>
      <View style={styles.card}>
        <TextInput placeholder="Full name" value={fullName} onChangeText={setFullName} style={styles.input} />
        <TextInput
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
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
          <Text style={styles.primaryButtonText}>{loading ? "Creating..." : "Create account"}</Text>
        </Pressable>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    color: palette.text,
    fontSize: 30,
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
})
