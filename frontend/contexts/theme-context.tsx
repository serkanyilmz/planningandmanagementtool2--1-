"use client"

import { createContext, useContext, useState, useMemo, type ReactNode } from "react"
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"

type ThemeMode = "light" | "dark"

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light")

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"))
  }

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#002366",
            light: "#1a4d8f",
            dark: "#001845",
            contrastText: "#ffffff",
          },
          secondary: {
            main: mode === "light" ? "#f1f5f9" : "#1e293b",
            light: mode === "light" ? "#f8fafc" : "#334155",
            dark: mode === "light" ? "#e2e8f0" : "#0f172a",
            contrastText: mode === "light" ? "#1e293b" : "#f1f5f9",
          },
          background: {
            default: mode === "light" ? "#f8fafc" : "#0f172a",
            paper: mode === "light" ? "#ffffff" : "#1e293b",
          },
          text: {
            primary: mode === "light" ? "#1e293b" : "#f1f5f9",
            secondary: mode === "light" ? "#64748b" : "#94a3b8",
          },
          error: {
            main: "#ef4444",
          },
          warning: {
            main: "#f59e0b",
          },
          success: {
            main: "#10b981",
          },
          divider: mode === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 600 },
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                fontWeight: 500,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: "#0f172a",
                color: "#f1f5f9",
              },
            },
          },
        },
      }),
    [mode],
  )

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
