"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  name: string
  email: string
  role: "caregiver" | "family"
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, role: "caregiver" | "family") => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  // Mock login function with fixed credentials for prototype
  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      // Fixed credentials for prototype
      const VALID_EMAIL = "priyanshr230@gmail.com"
      const VALID_PASSWORD = "1234"

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Validate credentials
      if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
        throw new Error("Invalid credentials")
      }

      // Mock user data
      const mockUser: User = {
        id: "user-1",
        name: "Priyansh",
        email: VALID_EMAIL,
        role: "family",
      }

      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))
      router.push("/dashboard")
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Mock signup function
  const signup = async (name: string, email: string, password: string, role: "caregiver" | "family") => {
    setLoading(true)
    try {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock user data
      const mockUser: User = {
        id: "user-" + Math.random().toString(36).substr(2, 9),
        name,
        email,
        role,
      }

      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))
      router.push("/dashboard")
    } catch (error) {
      console.error("Signup failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
