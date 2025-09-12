import type React from "react"
import "../styles/globals.css"

export const metadata = {
  title: "Team Formation App",
  description: "Create and manage teams with Google Sheets integration",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
