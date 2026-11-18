"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, BookOpen, Building2, Calendar, CreditCard, MapPinned, Megaphone, Settings, Tags, Users } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { getRoleHomePath } from "@/lib/role-routing"
import { clientLogout, makeLogoutGuard } from "@/lib/client-logout"
import { RoleDashboardShell } from "@/components/skillup/role-dashboard-shell"
import type { DashboardNavItem } from "@/components/skillup/dashboard-nav"

const adminNavItems: DashboardNavItem[] = [
  { name: "Dashboard", href: "/admin", icon: BarChart3 },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Campuses & Labs", href: "/admin/campuses", icon: Building2 },
  { name: "Cohorts & Timetables", href: "/admin/cohorts", icon: Calendar },
  { name: "Courses", href: "/admin/courses", icon: BookOpen },
  { name: "Categories", href: "/admin/categories", icon: Tags },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Campaign", href: "/admin/campaign", icon: Megaphone },
  { name: "Onsite Training", href: "/admin/onsite-training", icon: MapPinned },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, token, setAuth, clearAuth, hydrated } = useAuthStore()
  const logoutGuard = useMemo(() => makeLogoutGuard(), [])
  const [accessVerified, setAccessVerified] = useState(false)

  useEffect(() => {
    if (logoutGuard.isLoggingOut()) return
    if (!hydrated) return

    let cancelled = false

    const redirectToLogin = () => {
      clearAuth()
      const redirectTarget = encodeURIComponent(pathname || "/admin")
      router.replace(`/login?redirect=${redirectTarget}`)
    }

    const verifyAccess = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        })

        if (res.status === 401 || res.status === 403) {
          if (!cancelled) {
            setAccessVerified(false)
            redirectToLogin()
          }
          return
        }

        if (!res.ok) {
          // Transient server/database error (e.g., 503): preserve session if already verified admin
          if (!cancelled && user?.role === "admin" && token) {
            setAccessVerified(true)
          }
          return
        }

        const data = await res.json()
        const currentUser = data?.user
        const resolvedToken = data?.token || token

        if (!currentUser || !resolvedToken) {
          if (!cancelled) {
            setAccessVerified(false)
            redirectToLogin()
          }
          return
        }

        if (resolvedToken !== token || currentUser.id !== user?.id || currentUser.role !== user?.role) {
          setAuth(currentUser, resolvedToken)
        }

        if (currentUser.role !== "admin") {
          if (!cancelled) {
            setAccessVerified(false)
            router.replace(getRoleHomePath(currentUser.role))
          }
          return
        }

        if (!cancelled) {
          setAccessVerified(true)
        }
      } catch {
        if (!cancelled && !(user?.role === "admin" && token)) {
          setAccessVerified(false)
          redirectToLogin()
        }
      }
    }

    void verifyAccess()

    return () => {
      cancelled = true
    }
  }, [hydrated, token, user?.id, user?.role, pathname, setAuth, clearAuth, router, logoutGuard])

  if (!hydrated || !user || user.role !== "admin" || !accessVerified) return null

  const handleLogout = async () => {
    logoutGuard.start()
    await clientLogout()
    router.replace("/")
    clearAuth()
  }

  return (
    <RoleDashboardShell
      roleLabel="Admin"
      userName={user.name}
      userAvatar={user.avatar}
      navItems={adminNavItems}
      onLogout={handleLogout}
      homeHref="/admin"
    >
      {children}
    </RoleDashboardShell>
  )
}
