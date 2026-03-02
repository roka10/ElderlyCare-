"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, Home, Video, Bell, Users, Calendar, Settings, Menu, LogOut, Moon, Sun, Sparkles, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Live Feed", href: "/dashboard/live-feed", icon: Video },
    { name: "Reminders", href: "/dashboard/reminders", icon: Bell },
    { name: "Visitors", href: "/dashboard/visitors", icon: Users },
    { name: "Tasks", href: "/dashboard/tasks", icon: Calendar },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  const NavItem = ({ item, compact = false }: { item: typeof navigation[0]; compact?: boolean }) => {
    const isActive = pathname === item.href
    return (
      <Link
        href={item.href}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
          ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/25"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
      >
        <item.icon className={`h-[18px] w-[18px] transition-transform group-hover:scale-110 ${isActive ? "text-white" : ""}`} />
        {!compact && item.name}
        {isActive && !compact && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-70" />}
      </Link>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative">

      {/* ── Subtle background glow for the dashboard ── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-background dark:from-slate-950 dark:via-blue-950/10 dark:to-background" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-3xl" />
      </div>

      {/* ══════════ Mobile Header ══════════ */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-white/40 dark:border-slate-800/40 glass px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden h-9 w-9">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0">
            <div className="flex h-full flex-col">
              {/* Sheet header */}
              <div className="flex items-center gap-2 p-5 border-b">
                <div className="relative">
                  <Heart className="h-6 w-6 text-primary" />
                  <Sparkles className="h-2.5 w-2.5 text-primary/60 absolute -top-0.5 -right-0.5 animate-pulse" />
                </div>
                <span className="font-bold text-lg gradient-text">CareCompanion</span>
              </div>
              {/* Sheet nav */}
              <nav className="flex-1 overflow-auto py-4 px-3">
                <ul className="flex flex-col gap-1">
                  {navigation.map((item) => (
                    <li key={item.name}><NavItem item={item} /></li>
                  ))}
                </ul>
              </nav>
              {/* Sheet footer */}
              <div className="border-t p-4 space-y-2">
                {isMounted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-full justify-start gap-2"
                  >
                    {theme === "dark" ? <><Sun className="h-4 w-4" /> Light Mode</> : <><Moon className="h-4 w-4" /> Dark Mode</>}
                  </Button>
                )}
                <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={logout}>
                  <LogOut className="h-4 w-4" /> Log out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 flex-1">
          <Heart className="h-5 w-5 text-primary" />
          <span className="font-bold gradient-text">CareCompanion</span>
        </div>

        <div className="flex items-center gap-2">
          {isMounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full h-9 w-9"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user?.name || "User"} />}
                  <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white text-xs font-bold">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* ══════════ Desktop Sidebar ══════════ */}
        <aside className="hidden lg:flex h-screen w-64 flex-col fixed inset-y-0 z-30 border-r border-white/40 dark:border-slate-800/40 glass">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center gap-2 border-b border-white/40 dark:border-slate-800/20 px-6">
            <div className="relative">
              <Heart className="h-6 w-6 text-primary" />
              <Sparkles className="h-2.5 w-2.5 text-primary/60 absolute -top-0.5 -right-0.5 animate-pulse" />
            </div>
            <span className="font-bold text-lg gradient-text">CareCompanion</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-auto py-6 px-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 mb-3">Navigation</p>
            <ul className="flex flex-col gap-1">
              {navigation.map((item) => (
                <li key={item.name}><NavItem item={item} /></li>
              ))}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-white/40 dark:border-slate-800/20 p-4 space-y-3">
            {/* User Profile */}
            <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/50">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user?.name || "User"} />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white text-xs font-bold">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Theme Toggle */}
            {isMounted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full justify-start gap-2 h-9"
              >
                {theme === "dark" ? (
                  <><Sun className="h-4 w-4 text-amber-500" /> Light Mode</>
                ) : (
                  <><Moon className="h-4 w-4 text-indigo-500" /> Dark Mode</>
                )}
              </Button>
            )}

            {/* Logout */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </aside>

        {/* ══════════ Main Content ══════════ */}
        <main className="flex-1 lg:ml-64">{children}</main>
      </div>
    </div>
  )
}
