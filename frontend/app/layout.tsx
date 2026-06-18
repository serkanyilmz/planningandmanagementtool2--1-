import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthProvider } from "@/contexts/auth-context"
import { BoardProvider } from "@/contexts/board-context"
import { FilterProvider } from "@/contexts/filter-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { AuthGuard } from "@/components/auth-guard"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Planify - Planning & Management Tool",
  description: "Professional planning and management tool for teams",
  generator: "v0.app",
}

export const viewport = {
  themeColor: "#002366",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <BoardProvider>
            <NotificationProvider>
              <FilterProvider>
                <ThemeProvider>
                  <AuthGuard>{children}</AuthGuard>
                </ThemeProvider>
              </FilterProvider>
            </NotificationProvider>
          </BoardProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
