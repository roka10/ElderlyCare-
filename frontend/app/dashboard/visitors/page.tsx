"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Edit, Plus, Search, Trash2, Upload, User, UserPlus, X, CalendarIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"

interface UpcomingVisit {
  id: number
  name: string
  role: string
  date: string
  time: string
  image: string
}

export default function VisitorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingVisitor, setIsAddingVisitor] = useState(false)
  const [isSchedulingVisit, setIsSchedulingVisit] = useState(false)
  
  // Form state
  const [visitorName, setVisitorName] = useState("")
  const [visitorRole, setVisitorRole] = useState("")
  const [visitorNotes, setVisitorNotes] = useState("")
  const [scheduleVisit, setScheduleVisit] = useState(false)
  const [visitDate, setVisitDate] = useState("")
  const [visitTime, setVisitTime] = useState("")

  const knownVisitors = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Nurse",
      status: "approved",
      lastVisit: "Today, 9:45 AM",
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      role: "Doctor",
      status: "approved",
      lastVisit: "Yesterday, 3:30 PM",
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "Emma Wilson",
      role: "Family",
      status: "approved",
      lastVisit: "3 days ago",
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 4,
      name: "Robert Davis",
      role: "Caregiver",
      status: "approved",
      lastVisit: "1 week ago",
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 5,
      name: "Lisa Thompson",
      role: "Friend",
      status: "approved",
      lastVisit: "2 weeks ago",
      image: "/placeholder.svg?height=40&width=40",
    },
  ]

  const unknownVisitors = [
    { id: 101, timestamp: "Today, 11:23 AM", status: "unidentified", image: "/placeholder.svg?height=40&width=40" },
    { id: 102, timestamp: "Yesterday, 4:15 PM", status: "unidentified", image: "/placeholder.svg?height=40&width=40" },
    { id: 103, timestamp: "3 days ago", status: "delivery", image: "/placeholder.svg?height=40&width=40" },
  ]

  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([
    {
      id: 201,
      name: "Dr. Michael Chen",
      role: "Doctor",
      date: "Tomorrow",
      time: "10:00 AM",
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 202,
      name: "Sarah Johnson",
      role: "Nurse",
      date: "Tomorrow",
      time: "2:30 PM",
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 203,
      name: "Emma Wilson",
      role: "Family",
      date: "Saturday",
      time: "11:00 AM",
      image: "/placeholder.svg?height=40&width=40",
    },
  ])

  const resetForm = () => {
    setVisitorName("")
    setVisitorRole("")
    setVisitorNotes("")
    setScheduleVisit(false)
    setVisitDate("")
    setVisitTime("")
  }

  const handleAddVisitor = () => {
    if (!visitorName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a visitor name",
        variant: "destructive",
      })
      return
    }

    if (scheduleVisit && (!visitDate || !visitTime)) {
      toast({
        title: "Error",
        description: "Please enter both date and time for the scheduled visit",
        variant: "destructive",
      })
      return
    }

    if (scheduleVisit) {
      const newVisit: UpcomingVisit = {
        id: Date.now(),
        name: visitorName,
        role: visitorRole || "Guest",
        date: visitDate,
        time: visitTime,
        image: "/placeholder.svg?height=40&width=40",
      }
      setUpcomingVisits([...upcomingVisits, newVisit])
      toast({
        title: "Success",
        description: `Visit scheduled for ${visitorName}`,
      })
    } else {
      toast({
        title: "Success",
        description: `${visitorName} added to known visitors`,
      })
    }

    resetForm()
    setIsAddingVisitor(false)
  }

  const handleScheduleVisit = () => {
    if (!visitorName.trim() || !visitorRole || !visitDate || !visitTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const newVisit: UpcomingVisit = {
      id: Date.now(),
      name: visitorName,
      role: visitorRole,
      date: visitDate,
      time: visitTime,
      image: "/placeholder.svg?height=40&width=40",
    }

    setUpcomingVisits([...upcomingVisits, newVisit])
    toast({
      title: "Success",
      description: `Visit scheduled for ${visitorName}`,
    })
    
    resetForm()
    setIsSchedulingVisit(false)
  }

  const handleDeleteVisit = (id: number) => {
    setUpcomingVisits(upcomingVisits.filter((visit) => visit.id !== id))
    toast({
      title: "Success",
      description: "Visit removed from schedule",
    })
  }

  const filteredVisitors = knownVisitors.filter(
    (visitor) =>
      visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Visitors</h1>
            <p className="text-muted-foreground">Manage known visitors and view visitor history</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search visitors..."
                className="pl-8 w-[200px] md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={isAddingVisitor} onOpenChange={setIsAddingVisitor}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Visitor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Visitor</DialogTitle>
                  <DialogDescription>Add a new trusted visitor and optionally schedule a visit.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex flex-col items-center gap-4 mb-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="/placeholder.svg?height=80&width=80" />
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter visitor's name" 
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Relationship</Label>
                    <Select value={visitorRole} onValueChange={setVisitorRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Family">Family</SelectItem>
                        <SelectItem value="Friend">Friend</SelectItem>
                        <SelectItem value="Caregiver">Caregiver</SelectItem>
                        <SelectItem value="Doctor">Doctor</SelectItem>
                        <SelectItem value="Nurse">Nurse</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Add any additional information"
                      value={visitorNotes}
                      onChange={(e) => setVisitorNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-4 border-t">
                    <Checkbox 
                      id="schedule" 
                      checked={scheduleVisit}
                      onCheckedChange={(checked) => setScheduleVisit(checked as boolean)}
                    />
                    <Label htmlFor="schedule" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Schedule an upcoming visit
                    </Label>
                  </div>

                  {scheduleVisit && (
                    <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="visit-date" className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Visit Date *
                          </Label>
                          <Input 
                            id="visit-date" 
                            type="date"
                            value={visitDate}
                            onChange={(e) => setVisitDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="visit-time" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Visit Time *
                          </Label>
                          <Input 
                            id="visit-time" 
                            type="time"
                            value={visitTime}
                            onChange={(e) => setVisitTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resetForm()
                      setIsAddingVisitor(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddVisitor}>
                    {scheduleVisit ? "Add & Schedule Visit" : "Add Visitor"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="known" className="space-y-4">
          <TabsList>
            <TabsTrigger value="known">Known Visitors</TabsTrigger>
            <TabsTrigger value="unknown">Unknown Visitors</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Visits</TabsTrigger>
          </TabsList>

          <TabsContent value="known" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Known Visitors</CardTitle>
                <CardDescription>People who have been approved for recognition</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredVisitors.length === 0 ? (
                    <div className="text-center py-4">
                      <User className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No visitors found</p>
                    </div>
                  ) : (
                    filteredVisitors.map((visitor) => (
                      <div key={visitor.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={visitor.image || "/placeholder.svg"} alt={visitor.name} />
                            <AvatarFallback>{visitor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{visitor.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{visitor.role}</Badge>
                              <span className="text-xs text-muted-foreground">Last visit: {visitor.lastVisit}</span>
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

          <TabsContent value="unknown" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Unknown Visitors</CardTitle>
                <CardDescription>Recent unidentified visitors detected by the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {unknownVisitors.map((visitor) => (
                    <div key={visitor.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={visitor.image || "/placeholder.svg"} />
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {visitor.status === "delivery" ? "Delivery Person" : "Unknown Visitor"}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant={visitor.status === "delivery" ? "outline" : "destructive"}>
                              {visitor.status === "delivery" ? "Delivery" : "Unidentified"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Detected: {visitor.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Plus className="h-3 w-3" />
                          Add to Known
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Visits</CardTitle>
                <CardDescription>Scheduled visits for the next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingVisits.map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={visit.image || "/placeholder.svg"} alt={visit.name} />
                          <AvatarFallback>{visit.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{visit.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{visit.role}</Badge>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {visit.date}, {visit.time}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteVisit(visit.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Dialog open={isSchedulingVisit} onOpenChange={setIsSchedulingVisit}>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      Schedule New Visit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Schedule Visit</DialogTitle>
                      <DialogDescription>Schedule an upcoming visit for a known visitor.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="schedule-name">Visitor Name *</Label>
                        <Input 
                          id="schedule-name" 
                          placeholder="Enter visitor's name" 
                          value={visitorName}
                          onChange={(e) => setVisitorName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="schedule-role">Relationship *</Label>
                        <Select value={visitorRole} onValueChange={setVisitorRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Family">Family</SelectItem>
                            <SelectItem value="Friend">Friend</SelectItem>
                            <SelectItem value="Caregiver">Caregiver</SelectItem>
                            <SelectItem value="Doctor">Doctor</SelectItem>
                            <SelectItem value="Nurse">Nurse</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="schedule-date" className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Visit Date *
                          </Label>
                          <Input 
                            id="schedule-date" 
                            type="date"
                            value={visitDate}
                            onChange={(e) => setVisitDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="schedule-time" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Visit Time *
                          </Label>
                          <Input 
                            id="schedule-time" 
                            type="time"
                            value={visitTime}
                            onChange={(e) => setVisitTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="schedule-notes">Notes</Label>
                        <Textarea 
                          id="schedule-notes" 
                          placeholder="Add any additional information"
                          value={visitorNotes}
                          onChange={(e) => setVisitorNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          resetForm()
                          setIsSchedulingVisit(false)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleScheduleVisit}>
                        Schedule Visit
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
