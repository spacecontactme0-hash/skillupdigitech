"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { ArrowRight, LayoutDashboard, Menu, ShoppingCart, X } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useGetStartedDrawer } from "@/components/layout/get-started-drawer"
import { clientLogout } from "@/lib/client-logout"
import { getRoleHomePath } from "@/lib/role-routing"
import { useAuthStore, useCartStore } from "@/lib/store"

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "U"
  )
}

function hasUsableAvatar(src?: string | null) {
  if (!src) return false
  return !src.includes("placeholder")
}

export function PublicHeader() {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const { items } = useCartStore()
  const { openDrawer } = useGetStartedDrawer()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const dashboardHref = user ? getRoleHomePath(user.role) : "/dashboard"
  const avatarSrc = useMemo(() => (hasUsableAvatar(user?.avatar) ? user?.avatar : undefined), [user?.avatar])
  const initials = getInitials(user?.name || "User")

  const handleLogout = async () => {
    clearAuth()
    await clientLogout()
    router.replace("/")
  }

  const navLinks = [
    { href: "/#programmes", label: "Programmes", match: "/#programmes" },
    { href: "/courses", label: "Courses", match: "/courses" },
    { href: "/about", label: "About", match: "/about" },
    { href: "/verify", label: "Verify", match: "/verify" },
  ]

  const isActive = (match: string) => {
    if (match === "/courses") return pathname.startsWith("/courses")
    if (match === "/verify") return pathname.startsWith("/verify")
    return pathname === match
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6 lg:gap-9">
          <Logo variant="compact" />

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive(link.match)
                    ? "bg-[#F3EFFA] text-[#231651]"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-[#231651]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/cart" aria-label="Shopping cart">
            <Button variant="ghost" size="icon" className="relative rounded-xl border border-border/70 bg-card">
              <ShoppingCart className="h-4 w-4 text-[#231651]" />
              {items.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#613399] font-mono text-[10px] font-bold text-white">
                  {items.length}
                </span>
              )}
            </Button>
          </Link>

          {isAuthenticated() && user ? (
            <>
              <Button variant="cta" size="sm" asChild className="hidden md:inline-flex">
                <Link href={dashboardHref}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-full p-0" aria-label="Account menu">
                    <Avatar className="h-9 w-9 border border-border">
                      {avatarSrc ? <AvatarImage src={avatarSrc} alt={user.name} /> : null}
                      <AvatarFallback className="bg-[#231651] text-xs font-bold text-[#D6FFF6]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={dashboardHref}>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button variant="cta" size="sm" onClick={openDrawer}>
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation menu" className="lg:hidden">
                <Menu className="h-5 w-5 text-[#231651]" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 border-l border-border bg-card p-0">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <Logo variant="compact" href={null} />
                  <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 p-4">
                  <nav aria-label="Mobile navigation" className="space-y-1.5">
                    {[
                      { href: "/", label: "Home" },
                      { href: "/#programmes", label: "Programmes" },
                      { href: "/courses", label: "Courses" },
                      { href: "/about", label: "About" },
                      { href: "/verify", label: "Verify Certificate" },
                      { href: "/faq", label: "FAQ" },
                      { href: "/contact", label: "Contact" },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                          pathname === link.href
                            ? "bg-[#231651] text-white"
                            : "text-muted-foreground hover:bg-secondary hover:text-[#231651]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>

                {isAuthenticated() && user ? (
                  <div className="space-y-2 border-t border-border p-4">
                    <Button variant="cta" className="w-full" asChild>
                      <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
                        <LayoutDashboard className="h-4 w-4" />
                        Open Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleLogout()
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 border-t border-border p-4">
                    <Button variant="outline" className="w-full" asChild onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button
                      variant="cta"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        openDrawer()
                      }}
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
