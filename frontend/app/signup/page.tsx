"use client"

import type React from "react"

import { useState, useMemo, useRef } from "react"
import Link from "next/link"
import { Heart, Eye, EyeOff, UserPlus, Mail, Lock, User, Sparkles, Check, X, ArrowLeft, Camera, ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [role, setRole] = useState<"caregiver" | "family">("family")
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const { signup } = useAuth()
  const { toast } = useToast()

  // ── Photo Upload Handler ────────────────────────────────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Preview immediately
    setAvatarPreview(URL.createObjectURL(file))
    // Compress to base64
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX = 200
        let w = img.width, h = img.height
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
        canvas.width = w; canvas.height = h
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
        setAvatarDataUrl(canvas.toDataURL("image/jpeg", 0.7))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  // ── Password Strength ─────────────────────────────────────────────────────
  const ruleResults = useMemo(() => PASSWORD_RULES.map(r => r.test(password)), [password])
  const passedCount = ruleResults.filter(Boolean).length
  const allPassed = passedCount === PASSWORD_RULES.length
  const passwordsMatch = password.length > 0 && password === confirmPassword

  const strengthPercent = (passedCount / PASSWORD_RULES.length) * 100
  const strengthColor =
    strengthPercent <= 20 ? "bg-red-500" :
      strengthPercent <= 40 ? "bg-orange-500" :
        strengthPercent <= 60 ? "bg-amber-500" :
          strengthPercent <= 80 ? "bg-lime-500" :
            "bg-green-500"
  const strengthLabel =
    strengthPercent <= 20 ? "Very Weak" :
      strengthPercent <= 40 ? "Weak" :
        strengthPercent <= 60 ? "Fair" :
          strengthPercent <= 80 ? "Strong" :
            "Excellent"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!avatarDataUrl) {
      toast({
        title: "Photo required",
        description: "Please upload a profile photo to create your account.",
        variant: "destructive",
      })
      return
    }

    if (!allPassed) {
      toast({
        title: "Password too weak",
        description: "Your password must meet all the requirements listed below.",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await signup(name, email, password, role, avatarDataUrl)
      toast({
        title: "Account created",
        description: "Welcome to CareCompanion!",
      })
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "There was an error creating your account.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* ── Animated Background ── */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-emerald-950/30 dark:to-blue-950/30" />
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "5s" }} />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "7s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-300/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "9s" }} />
      </div>

      {/* ── Top Nav ── */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <div className="relative">
            <Heart className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
            <Sparkles className="h-3 w-3 text-primary/60 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
            CareCompanion
          </span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* ── Signup Card ── */}
      <div className="w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-white/40 dark:border-slate-700/40 shadow-2xl shadow-emerald-500/10">
          <CardHeader className="space-y-1 pb-4">
            <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <UserPlus className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Enter your information to get started
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Profile Photo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Profile Photo <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className={`relative h-20 w-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all hover:border-primary group ${avatarPreview ? "border-green-500" : "border-muted-foreground/30"
                      }`}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                    {avatarPreview && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      {avatarPreview ? "Change Photo" : "Upload Photo"}
                    </Button>
                    <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG or WebP · Required</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="pl-10 h-11 transition-all border-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 h-11 transition-all border-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="pl-10 pr-11 h-11 transition-all border-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* ── Strength Meter ── */}
                {password.length > 0 && (
                  <div className="space-y-2.5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${strengthColor}`}
                          style={{ width: `${strengthPercent}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium min-w-[70px] text-right ${strengthPercent <= 40 ? "text-red-500" :
                        strengthPercent <= 60 ? "text-amber-500" :
                          "text-green-500"
                        }`}>
                        {strengthLabel}
                      </span>
                    </div>
                    <ul className="grid grid-cols-1 gap-1">
                      {PASSWORD_RULES.map((rule, i) => (
                        <li key={i} className={`flex items-center gap-1.5 text-xs transition-colors ${ruleResults[i] ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                          }`}>
                          {ruleResults[i]
                            ? <Check className="h-3 w-3 flex-shrink-0" />
                            : <X className="h-3 w-3 flex-shrink-0" />
                          }
                          {rule.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm Password"
                    className={`pl-10 pr-11 h-11 transition-all border-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20 ${confirmPassword.length > 0
                      ? passwordsMatch
                        ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                        : "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : ""
                      }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-500 flex items-center gap-1 animate-in fade-in-0 duration-200">
                    <X className="h-3 w-3" /> Passwords do not match
                  </p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in-0 duration-200">
                    <Check className="h-3 w-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-sm font-medium">I am a:</Label>
                <RadioGroup
                  defaultValue="family"
                  value={role}
                  onValueChange={(value) => setRole(value as "caregiver" | "family")}
                  className="grid grid-cols-2 gap-3"
                >
                  <label
                    htmlFor="family"
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${role === "family"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-muted-foreground/20 hover:border-muted-foreground/40"
                      }`}
                  >
                    <RadioGroupItem value="family" id="family" className="sr-only" />
                    <span className="text-lg">👨‍👩‍👦</span>
                    <span className="text-sm font-medium">Family Member</span>
                  </label>
                  <label
                    htmlFor="caregiver"
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${role === "caregiver"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-muted-foreground/20 hover:border-muted-foreground/40"
                      }`}
                  >
                    <RadioGroupItem value="caregiver" id="caregiver" className="sr-only" />
                    <span className="text-lg">🩺</span>
                    <span className="text-sm font-medium">Caregiver</span>
                  </label>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                disabled={isLoading || !allPassed || !passwordsMatch || !avatarDataUrl}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </span>
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline transition-colors">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
