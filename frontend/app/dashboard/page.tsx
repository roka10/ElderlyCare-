"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { Activity, AlertTriangle, Bell, Calendar, Clock, Heart, Users, Video, PhoneCall } from "lucide-react"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}. Here's what's happening today.</p>
          </div>
          <Button size="lg" className="gap-2">
            <PhoneCall className="h-4 w-4" />
            SOS Call
          </Button>
        </div>

        {/* Status Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">Normal</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reminders</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Upcoming today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Expected today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>
        </div>

        {/* Live Feed */}
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Live Feed</CardTitle>
              <CardDescription>Real-time camera feed from the living room</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Video className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Live feed will appear here</p>
                  <Button variant="outline" size="sm">
                    Connect Camera
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest events and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Medication Reminder</p>
                    <p className="text-xs text-muted-foreground">Blood pressure medication at 9:00 AM</p>
                    <p className="text-xs text-muted-foreground mt-1">10 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-secondary/10 p-2 rounded-full">
                    <Users className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Visitor Detected</p>
                    <p className="text-xs text-muted-foreground">Nurse Sarah arrived</p>
                    <p className="text-xs text-muted-foreground mt-1">45 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-accent/10 p-2 rounded-full">
                    <Heart className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Health Check</p>
                    <p className="text-xs text-muted-foreground">Heart rate normal at 72 BPM</p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-destructive/10 p-2 rounded-full">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Alert Resolved</p>
                    <p className="text-xs text-muted-foreground">Unknown visitor identified as delivery person</p>
                    <p className="text-xs text-muted-foreground mt-1">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Reminders</CardTitle>
            <CardDescription>Scheduled reminders and tasks for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Blood Pressure Medication</p>
                    <p className="text-sm text-muted-foreground">Take 1 pill with water</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">9:00 AM</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Lunch</p>
                    <p className="text-sm text-muted-foreground">Prepared meal in refrigerator</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">12:30 PM</p>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Heart Medication</p>
                    <p className="text-sm text-muted-foreground">Take 1 pill after lunch</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">1:00 PM</p>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Doctor Visit</p>
                    <p className="text-sm text-muted-foreground">Dr. Johnson for checkup</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">3:30 PM</p>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Evening Medication</p>
                    <p className="text-sm text-muted-foreground">Take 1 pill before dinner</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">6:00 PM</p>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
