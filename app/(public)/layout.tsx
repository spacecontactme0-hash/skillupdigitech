import type React from "react"
import { PublicDrawerProvider } from "@/components/layout/get-started-drawer"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PublicDrawerProvider>
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </PublicDrawerProvider>
  )
}
