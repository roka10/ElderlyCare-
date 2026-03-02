"use client"

import { useState, useRef, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Check, Cog, Lock, LogOut, Moon, Save, Sun, Upload, Camera, User, Mail, Phone, MapPin, FileText } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { useToast, toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // ── Profile form state ──────────────────────────────────────────────────
  const [profileName, setProfileName] = useState("")
  const [profileEmail, setProfileEmail] = useState("")
  const [profilePhone, setProfilePhone] = useState("")
  const [profileAddress, setProfileAddress] = useState("")
  const [profileBio, setProfileBio] = useState("")
  const [profileRole, setProfileRole] = useState("family")
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Load profile from Supabase Auth user metadata ───────────────────────
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "")
      setProfileEmail(user.email || "")
      setProfileRole(user.role || "family")
    }
    // Load extended profile from Supabase
    const loadProfile = async () => {
      const { data: { user: supaUser } } = await supabase.auth.getUser()
      if (supaUser) {
        const meta = supaUser.user_metadata || {}
        setProfilePhone(meta.phone || "")
        setProfileAddress(meta.address || "")
        setProfileBio(meta.bio || "")
        setProfilePhotoUrl(meta.avatar_url || null)
      }
    }
    loadProfile()
  }, [user])

  // ── Photo Upload ────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoUploading(true)
    try {
      // Resize + compress the image to a small base64 data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement("canvas")
            const MAX = 200 // max px for profile pic
            let w = img.width, h = img.height
            if (w > h) { h = Math.round(h * MAX / w); w = MAX }
            else { w = Math.round(w * MAX / h); h = MAX }
            canvas.width = w; canvas.height = h
            canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
            resolve(canvas.toDataURL("image/jpeg", 0.7))
          }
          img.onerror = reject
          img.src = reader.result as string
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Save directly to Supabase Auth user metadata (no storage bucket needed)
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: dataUrl }
      })
      if (error) throw error

      setProfilePhotoUrl(dataUrl)
      toast({ title: "Photo updated ✅", description: "Your profile picture has been saved." })
    } catch (err: any) {
      console.error("Photo upload error:", err)
      toast({
        title: "Upload failed",
        description: err.message || "Could not save photo.",
        variant: "destructive"
      })
    } finally {
      setPhotoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // ── Save Profile ────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: profileName,
          role: profileRole,
          phone: profilePhone,
          address: profileAddress,
          bio: profileBio,
          avatar_url: profilePhotoUrl,
        }
      })
      if (error) throw error
      toast({ title: "Profile saved ✅", description: "Your information has been updated." })
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message || "Could not save profile.", variant: "destructive" })
    } finally {
      setTimeout(() => setIsSaving(false), 800)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and application preferences
            </p>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/20"
          >
            {isSaving ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="account" className="space-y-4">
          <TabsList className="grid grid-cols-4 md:w-[400px]">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="notifications">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            {/* ── Profile Card ── */}
            <Card className="glass border-white/60 dark:border-slate-700/40">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details and profile photo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* ── Avatar Upload ── */}
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 ring-4 ring-primary/10 shadow-xl">
                      <AvatarImage src={profilePhotoUrl || "/placeholder.svg?height=96&width=96"} alt={profileName} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white text-2xl font-bold">
                        {profileName?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {/* Hover overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{profileName || "Your Name"}</h3>
                    <p className="text-sm text-muted-foreground">{profileEmail}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      type="button"
                      disabled={photoUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {photoUploading ? "Uploading…" : profilePhotoUrl ? "Change Photo" : "Upload Photo"}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* ── Form Fields ── */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1.5 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settings-email" className="flex items-center gap-1.5 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                    </Label>
                    <Input
                      id="settings-email"
                      type="email"
                      value={profileEmail}
                      disabled
                      className="h-10 opacity-60"
                    />
                    <p className="text-[11px] text-muted-foreground">Email cannot be changed here</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="flex items-center gap-1.5 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" /> Role
                    </Label>
                    <Select value={profileRole} onValueChange={setProfileRole}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family">Family Member</SelectItem>
                        <SelectItem value="caregiver">Caregiver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address" className="flex items-center gap-1.5 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Address
                    </Label>
                    <Input
                      id="address"
                      placeholder="123 Main Street, City, State"
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="bio" className="flex items-center gap-1.5 text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Bio / Notes
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us a little about yourself or your relationship with the elderly person…"
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>

                <Button className="gap-2">
                  <Lock className="h-4 w-4" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible account actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Deleting your account will remove all your data and cannot be undone.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col md:flex-row gap-4">
                  <Button variant="destructive" className="gap-2">
                    Delete Account
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Customize the appearance of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <Label>Color Theme</Label>
                  <RadioGroup defaultValue={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-4">
                    <div>
                      <RadioGroupItem
                        value="light"
                        id="light"
                        className="sr-only peer"
                      />
                      <Label
                        htmlFor="light"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Sun className="h-6 w-6 mb-2" />
                        Light
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="dark"
                        id="dark"
                        className="sr-only peer"
                      />
                      <Label
                        htmlFor="dark"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Moon className="h-6 w-6 mb-2" />
                        Dark
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="system"
                        id="system"
                        className="sr-only peer"
                      />
                      <Label
                        htmlFor="system"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Cog className="h-6 w-6 mb-2" />
                        System
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="reduce-motion" className="flex items-center gap-2">
                    Reduce Motion
                  </Label>
                  <Switch id="reduce-motion" />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="high-contrast" className="flex items-center gap-2">
                    High Contrast
                  </Label>
                  <Switch id="high-contrast" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connected Devices</CardTitle>
                <CardDescription>
                  Manage devices connected to your elderly care system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No devices connected yet.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Preferences</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="fall-alerts">Fall Detection Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts when a fall is detected
                    </p>
                  </div>
                  <Switch id="fall-alerts" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="visitor-alerts">Visitor Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when visitors arrive
                    </p>
                  </div>
                  <Switch id="visitor-alerts" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder-alerts">Reminder Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Reminders for medications and tasks
                    </p>
                  </div>
                  <Switch id="reminder-alerts" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts via email
                    </p>
                  </div>
                  <Switch id="email-notifications" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
