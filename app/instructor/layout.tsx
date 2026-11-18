"use client"

import type React from "react"
import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, BookOpen, Calendar, ClipboardCheck, Home, Settings, Upload } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { getRoleHomePath } from "@/lib/role-routing"
import { clientLogout, makeLogoutGuard } from "@/lib/client-logout"
import { RoleDashboardShell } from "@/components/skillup/role-dashboard-shell"
import type { DashboardNavItem } from "@/components/skillup/dashboard-nav"

const instructorNavItems: DashboardNavItem[] = [
  { name: "Dashboard", href: "/instructor", icon: Home },
  { name: "My Courses", href: "/instructor/courses", icon: BookOpen },
  { name: "Create Course", href: "/instructor/courses/new", icon: Upload },
  { name: "Attendance & Labs", href: "/instructor/attendance", icon: Calendar },
  { name: "Evaluations", href: "/instructor/evaluations", icon: ClipboardCheck },
  { name: "Analytics", href: "/instructor/analytics", icon: BarChart3 },
  { name: "Settings", href: "/instructor/settings", icon: Settings },
]

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, clearAuth, hydrated } = useAuthStore()
  const logoutGuard = useMemo(() => makeLogoutGuard(), [])

  useEffect(() => {
    if (logoutGuard.isLoggingOut()) return
    if (!hydrated) return
    if (!user) {
      router.push("/login")
    } else if (user.role !== "instructor") {
      router.replace(getRoleHomePath(user.role))
    }
  }, [user, hydrated, router, logoutGuard])

  if (!hydrated || !user || user.role !== "instructor") return null

  const handleLogout = async () => {
    logoutGuard.start()
    await clientLogout()
    router.replace("/")
    clearAuth()
  }

  return (
    <RoleDashboardShell
      roleLabel="Instructor"
      userName={user.name}
      userAvatar={user.avatar}
      navItems={instructorNavItems}
      onLogout={handleLogout}
      homeHref="/instructor"
    >
      {children}
    </RoleDashboardShell>
  )
}

