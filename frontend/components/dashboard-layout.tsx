"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, Home, Video, Bell, Users, Calendar, Settings, Menu, LogOut, Moon, Sun } from "lucide-react"
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-2 py-4">
                <Heart className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">CareCompanion</span>
              </div>
              <nav className="flex-1 overflow-auto py-2">
                <ul className="flex flex-col gap-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                          pathname === item.href ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="border-t py-4">
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 flex-1">
          <Heart className="h-5 w-5 text-primary" />
          <span className="font-bold">CareCompanion</span>
        </div>
        <div className="flex items-center gap-2">
          {isMounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt={user?.name || "User"} />
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex h-screen w-64 flex-col fixed inset-y-0 z-30 border-r bg-background">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">CareCompanion</span>
          </div>
          <nav className="flex-1 overflow-auto py-6 px-3">
            <ul className="flex flex-col gap-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                      pathname === item.href ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user?.name || "User"} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isMounted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full justify-start gap-2"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      Dark Mode
                    </>
                  )}
                </Button>
              )}
            </div>
            <Button variant="ghost" className="w-full justify-start gap-2 mt-2" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">{children}</main>
      </div>
    </div>
  )
}
