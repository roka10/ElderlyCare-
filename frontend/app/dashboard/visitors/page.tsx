"use client"

import { useState, useRef, useEffect } from "react"

const BACKEND = "http://127.0.0.1:5000"

interface KnownVisitor {
  id: number
  name: string
  role: string
  status: string
  lastVisit: string
  image: string
  relationship?: string
  notes?: string
}
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

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // Load known visitors from Supabase-backed API on mount
  useEffect(() => {
    fetch(`${BACKEND}/known_faces`)
      .then(r => r.json())
      .then(data => {
        const people: KnownVisitor[] = (data.people || []).map((p: Record<string, string>, i: number) => ({
          id: i + 1,
          name: p.name,
          role: p.relationship || "Guest",
          status: "approved",
          lastVisit: "—",
          image: p.photo_url || "/placeholder.svg?height=40&width=40",
          relationship: p.relationship,
          notes: p.notes,
        }))
        if (people.length > 0) setKnownVisitors(people)
      })
      .catch(() => { /* offline — keep local static data */ })
  }, [])

  const initialKnownVisitors = [
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

  const initialUnknownVisitors = [
    { id: 101, timestamp: "Today, 11:23 AM", status: "unidentified", image: "/placeholder.svg?height=40&width=40" },
    { id: 102, timestamp: "Yesterday, 4:15 PM", status: "unidentified", image: "/placeholder.svg?height=40&width=40" },
    { id: 103, timestamp: "3 days ago", status: "delivery", image: "/placeholder.svg?height=40&width=40" },
  ]

  const [knownVisitors, setKnownVisitors] = useState(initialKnownVisitors)
  const [unknownVisitors, setUnknownVisitors] = useState(initialUnknownVisitors)
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
    setPhotoFile(null)
    setPhotoPreview(null)
    setUploadStatus("idle")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAddVisitor = async () => {
    if (!visitorName.trim()) {
      toast({ title: "Error", description: "Please enter a visitor name", variant: "destructive" })
      return
    }
    if (scheduleVisit && (!visitDate || !visitTime)) {
      toast({ title: "Error", description: "Please enter both date and time for the scheduled visit", variant: "destructive" })
      return
    }

    // ── Upload photo to backend for face recognition ──
    if (photoFile) {
      setUploadStatus("uploading")
      try {
        const formData = new FormData()
        formData.append("name", visitorName.trim())
        formData.append("relationship", visitorRole)
        formData.append("notes", visitorNotes)
        formData.append("photo", photoFile)
        const res = await fetch(`${BACKEND}/register_face_upload`, { method: "POST", body: formData })
        if (res.ok) {
          const json = await res.json()
          setUploadStatus("done")
          toast({ title: "Face Registered ✅", description: `${visitorName}'s face saved to Supabase. Live feed will now recognise them.` })
          // Update avatar image to use Supabase photo_url if available
          if (json.photo_url) {
            setPhotoPreview(json.photo_url)
          }
        } else {
          const err = await res.json().catch(() => ({}))
          setUploadStatus("error")
          toast({ title: "Upload failed", description: err.error || "Could not register face.", variant: "destructive" })
        }
      } catch {
        setUploadStatus("error")
        toast({ title: "Backend offline", description: "Could not reach backend. Face not registered.", variant: "destructive" })
      }
    }

    // ── Add to local known visitors list ──
    const newVisitor = {
      id: Date.now(),
      name: visitorName.trim(),
      role: visitorRole || "Guest",
      status: "approved",
      lastVisit: "Just added",
      image: photoPreview || "/placeholder.svg?height=40&width=40",
    }
    setKnownVisitors(prev => [newVisitor, ...prev])

    if (scheduleVisit) {
      const newVisit: UpcomingVisit = {
        id: Date.now() + 1,
        name: visitorName.trim(),
        role: visitorRole || "Guest",
        date: visitDate,
        time: visitTime,
        image: photoPreview || "/placeholder.svg?height=40&width=40",
      }
      setUpcomingVisits(prev => [...prev, newVisit])
      toast({ title: "Success", description: `Visit scheduled for ${visitorName}` })
    } else if (!photoFile) {
      toast({ title: "Success", description: `${visitorName} added to known visitors` })
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

  const handleDeleteKnownVisitor = (id: number) => {
    const toDelete = knownVisitors.find((v) => v.id === id)
    setKnownVisitors((prev) => prev.filter((v) => v.id !== id))
    toast({
      title: "Visitor removed",
      description: toDelete ? `${toDelete.name} has been removed from known visitors.` : "Visitor removed.",
    })
  }

  const handleAddUnknownToKnown = (id: number) => {
    const visitor = unknownVisitors.find((v) => v.id === id)
    if (!visitor) return

    const newKnown = {
      id: Date.now(),
      name: visitor.status === "delivery" ? "Delivery Person" : "Unknown Visitor",
      role: visitor.status === "delivery" ? "Delivery" : "Unknown",
      status: "approved",
      lastVisit: visitor.timestamp,
      image: visitor.image,
    }

    setKnownVisitors((prev) => [...prev, newKnown])
    setUnknownVisitors((prev) => prev.filter((v) => v.id !== id))
    toast({
      title: "Added to known visitors",
      description: `${newKnown.name} has been added to your known visitors list.`,
    })
  }

  const handleDeleteUnknownVisitor = (id: number) => {
    setUnknownVisitors((prev) => prev.filter((v) => v.id !== id))
    toast({
      title: "Unknown visitor removed",
      description: "The selected visitor has been removed from the list.",
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
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />

                  <div className="flex flex-col items-center gap-3 mb-4">
                    <Avatar className="h-24 w-24 ring-2 ring-muted">
                      <AvatarImage src={photoPreview || "/placeholder.svg?height=80&width=80"} />
                      <AvatarFallback className="text-2xl">{visitorName?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
                    </Avatar>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {photoFile ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {photoFile && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <span>✅</span> {photoFile.name} — face will be registered for live recognition
                      </p>
                    )}
                    {uploadStatus === "uploading" && (
                      <p className="text-xs text-blue-500">Uploading &amp; training model…</p>
                    )}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toast({
                                title: "Edit not implemented",
                                description: "Editing visitors is not yet available in this prototype.",
                              })
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteKnownVisitor(visitor.id)}
                          >
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleAddUnknownToKnown(visitor.id)}
                        >
                          <Plus className="h-3 w-3" />
                          Add to Known
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUnknownVisitor(visitor.id)}
                        >
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
