import { SafeAreaView } from "react-native-safe-area-context"
import { ScrollView, StyleSheet, View, type ViewProps } from "react-native"
import { palette } from "@/lib/theme"

export function Screen({ children, scroll = false, style, ...props }: ViewProps & { scroll?: boolean }) {
  const content = <View style={[styles.content, style]} {...props}>{children}</View>

  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? <ScrollView contentContainerStyle={styles.scrollContent}>{content}</ScrollView> : content}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.surfaceMuted,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
})
