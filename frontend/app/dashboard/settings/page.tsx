"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Check, Cog, Lock, LogOut, Moon, Save, Sun } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

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
            onClick={handleSave} 
            disabled={isSaving} 
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Check className="h-4 w-4" />
                Saved
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
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/placeholder.svg?height=80&width=80" alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-medium">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Change Avatar
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user?.name} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select defaultValue={user?.role}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family">Family Member</SelectItem>
                        <SelectItem value="caregiver">Caregiver</SelectItem>
                      </SelectContent>
                    </Select>
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
