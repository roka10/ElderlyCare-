"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Calendar, Check, Clock, Edit, Plus, Repeat, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

export default function RemindersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingReminder, setIsAddingReminder] = useState(false)

  const reminders = [
    {
      id: 1,
      title: "Blood Pressure Medication",
      description: "Take 1 pill with water",
      time: "9:00 AM",
      frequency: "Daily",
      alexa: true,
      completed: true,
    },
    {
      id: 2,
      title: "Heart Medication",
      description: "Take 1 pill after lunch",
      time: "1:00 PM",
      frequency: "Daily",
      alexa: true,
      completed: false,
    },
    {
      id: 3,
      title: "Evening Medication",
      description: "Take 1 pill before dinner",
      time: "6:00 PM",
      frequency: "Daily",
      alexa: true,
      completed: false,
    },
    {
      id: 4,
      title: "Doctor Appointment",
      description: "Checkup with Dr. Johnson",
      time: "3:30 PM",
      frequency: "Once",
      date: "Tomorrow",
      alexa: true,
      completed: false,
    },
    {
      id: 5,
      title: "Physical Therapy",
      description: "Gentle stretching exercises",
      time: "10:00 AM",
      frequency: "Weekly",
      date: "Every Monday",
      alexa: true,
      completed: false,
    },
  ]

  const filteredReminders = reminders.filter(
    (reminder) =>
      reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const todayReminders = filteredReminders.filter((r) => !r.date)
  const upcomingReminders = filteredReminders.filter((r) => r.date)

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
            <p className="text-muted-foreground">Manage medication and task reminders with Alexa integration</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reminders..."
                className="pl-8 w-[200px] md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={isAddingReminder} onOpenChange={setIsAddingReminder}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Reminder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Reminder</DialogTitle>
                  <DialogDescription>Create a new reminder that can be announced by Alexa.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Reminder Title</Label>
                    <Input id="title" placeholder="e.g., Take Medication" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Add details about this reminder" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input id="time" type="time" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="once">Once</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="alexa" className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Alexa Announcement
                    </Label>
                    <Switch id="alexa" defaultChecked />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingReminder(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsAddingReminder(false)}>Add Reminder</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="today" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Reminders</CardTitle>
                <CardDescription>Scheduled reminders for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayReminders.length === 0 ? (
                    <div className="text-center py-4">
                      <Bell className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No reminders for today</p>
                    </div>
                  ) : (
                    todayReminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`flex items-center justify-between p-3 rounded-md ${
                          reminder.completed ? "bg-muted/50" : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              reminder.completed ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                            }`}
                          >
                            {reminder.completed ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                          </div>
                          <div>
                            <p
                              className={`font-medium ${reminder.completed ? "line-through text-muted-foreground" : ""}`}
                            >
                              {reminder.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{reminder.description}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {reminder.time}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {reminder.frequency}
                              </Badge>
                              {reminder.alexa && (
                                <Badge variant="secondary" className="text-xs">
                                  Alexa
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!reminder.completed && (
                            <Button variant="outline" size="sm" className="gap-1">
                              <Check className="h-3 w-3" />
                              Complete
                            </Button>
                          )}
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full gap-2" onClick={() => setIsAddingReminder(true)}>
                  <Plus className="h-4 w-4" />
                  Add Reminder
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Reminders</CardTitle>
                <CardDescription>Scheduled reminders for the future</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingReminders.length === 0 ? (
                    <div className="text-center py-4">
                      <Calendar className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No upcoming reminders</p>
                    </div>
                  ) : (
                    upcomingReminders.map((reminder) => (
                      <div key={reminder.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="bg-secondary/10 p-2 rounded-full">
                            <Calendar className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="font-medium">{reminder.title}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{reminder.description}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {reminder.date}
                              </Badge>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {reminder.time}
                              </div>
                              {reminder.alexa && (
                                <Badge variant="secondary" className="text-xs">
                                  Alexa
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Reminders</CardTitle>
                <CardDescription>Reminders that have been marked as completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reminders.filter((r) => r.completed).length === 0 ? (
                    <div className="text-center py-4">
                      <Check className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No completed reminders</p>
                    </div>
                  ) : (
                    reminders
                      .filter((r) => r.completed)
                      .map((reminder) => (
                        <div key={reminder.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium line-through text-muted-foreground">{reminder.title}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{reminder.description}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {reminder.time}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {reminder.frequency}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-1">
                              <Repeat className="h-3 w-3" />
                              Restore
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
