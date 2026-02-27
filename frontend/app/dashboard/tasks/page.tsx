"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Calendar, Check, CheckCircle, Clock, Edit, Mic, Plus, Search, Trash2, X } from "lucide-react"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

type Task = {
  id: number
  title: string
  description: string
  priority: "low" | "medium" | "high"
  status: "pending" | "completed"
  dueDate: string
  dueTime: string
  alexa: boolean
}

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Take morning medication",
    description: "Blood pressure and heart medication",
    priority: "high",
    status: "completed",
    dueDate: "Today",
    dueTime: "9:00 AM",
    alexa: true,
  },
  {
    id: 2,
    title: "Lunch",
    description: "Prepared meal in refrigerator",
    priority: "medium",
    status: "pending",
    dueDate: "Today",
    dueTime: "12:30 PM",
    alexa: true,
  },
  {
    id: 3,
    title: "Doctor appointment",
    description: "Checkup with Dr. Johnson",
    priority: "high",
    status: "pending",
    dueDate: "Today",
    dueTime: "3:30 PM",
    alexa: true,
  },
  {
    id: 4,
    title: "Evening medication",
    description: "Take before dinner",
    priority: "high",
    status: "pending",
    dueDate: "Today",
    dueTime: "6:00 PM",
    alexa: true,
  },
  {
    id: 5,
    title: "Physical therapy exercises",
    description: "Gentle stretching routine",
    priority: "medium",
    status: "pending",
    dueDate: "Tomorrow",
    dueTime: "10:00 AM",
    alexa: true,
  },
  {
    id: 6,
    title: "Grocery delivery",
    description: "Delivery from Whole Foods",
    priority: "low",
    status: "pending",
    dueDate: "Tomorrow",
    dueTime: "2:00 PM",
    alexa: false,
  },
]

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [status, setStatus] = useState<"pending" | "completed">("pending")
  const [dueDate, setDueDate] = useState("")
  const [dueTime, setDueTime] = useState("")
  const [alexaEnabled, setAlexaEnabled] = useState(true)
  const { toast } = useToast()

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setPriority("medium")
    setStatus("pending")
    setDueDate("")
    setDueTime("")
    setAlexaEnabled(true)
    setEditingTaskId(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsAddingTask(true)
  }

  const openEditDialog = (task: Task) => {
    setEditingTaskId(task.id)
    setTitle(task.title)
    setDescription(task.description)
    setPriority(task.priority)
    setStatus(task.status)
    setDueDate(task.dueDate === "Today" || task.dueDate === "Tomorrow" ? "" : task.dueDate)
    setDueTime(task.dueTime)
    setAlexaEnabled(task.alexa)
    setIsAddingTask(true)
  }

  const handleSaveTask = () => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a task title.",
        variant: "destructive",
      })
      return
    }

    const normalizedDueDate = dueDate || "Today"

    if (editingTaskId === null) {
      const newTask: Task = {
        id: Date.now(),
        title,
        description,
        priority,
        status,
        dueDate: normalizedDueDate,
        dueTime: dueTime || "9:00 AM",
        alexa: alexaEnabled,
      }
      setTasks((prev) => [...prev, newTask])
      toast({
        title: "Task added",
        description: `"${title}" has been created.`,
      })
    } else {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                title,
                description,
                priority,
                status,
                dueDate: normalizedDueDate,
                dueTime: dueTime || task.dueTime,
                alexa: alexaEnabled,
              }
            : task,
        ),
      )
      toast({
        title: "Task updated",
        description: `"${title}" has been updated.`,
      })
    }

    setIsAddingTask(false)
    resetForm()
  }

  const handleToggleComplete = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, status: task.status === "completed" ? "pending" : "completed" }
          : task,
      ),
    )
  }

  const handleDeleteTask = (id: number) => {
    const toDelete = tasks.find((t) => t.id === id)
    setTasks((prev) => prev.filter((task) => task.id !== id))
    toast({
      title: "Task deleted",
      description: toDelete ? `"${toDelete.title}" has been removed.` : "Task removed.",
    })
  }

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const todayTasks = filteredTasks.filter((t) => t.dueDate === "Today")
  const upcomingTasks = filteredTasks.filter((t) => t.dueDate !== "Today")
  const completedTasks = filteredTasks.filter((t) => t.status === "completed")
  const pendingTasks = filteredTasks.filter((t) => t.status === "pending")

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">Manage daily tasks and to-do items with Alexa integration</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tasks..."
                className="pl-8 w-[200px] md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog
              open={isAddingTask}
              onOpenChange={(open) => {
                setIsAddingTask(open)
                if (!open) resetForm()
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={openAddDialog}>
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTaskId ? "Edit Task" : "Add New Task"}</DialogTitle>
                  <DialogDescription>
                    {editingTaskId
                      ? "Update the task details and save your changes."
                      : "Create a new task that can be announced by Alexa."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Take Medication"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Add details about this task"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={priority} onValueChange={(v: "low" | "medium" | "high") => setPriority(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={status} onValueChange={(v: "pending" | "completed") => setStatus(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueTime">Due Time</Label>
                      <Input
                        id="dueTime"
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="alexa" className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Alexa Reminder
                    </Label>
                    <Switch
                      id="alexa"
                      checked={alexaEnabled}
                      onCheckedChange={(checked) => setAlexaEnabled(!!checked)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingTask(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveTask}>{editingTaskId ? "Save Changes" : "Add Task"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Alexa Integration</AlertTitle>
          <AlertDescription>
            Tasks with Alexa integration will be announced by your Alexa device at the scheduled time.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="today" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>Tasks scheduled for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayTasks.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No tasks for today</p>
                    </div>
                  ) : (
                    todayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-3 rounded-md ${
                          task.status === "completed" ? "bg-muted/50" : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              task.status === "completed"
                                ? "bg-primary/10 text-primary"
                                : task.priority === "high"
                                  ? "bg-destructive/10 text-destructive"
                                  : task.priority === "medium"
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-secondary/10 text-secondary"
                            }`}
                          >
                            {task.status === "completed" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p
                              className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{task.description}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {task.dueTime}
                              </div>
                              <Badge
                                variant={
                                  task.priority === "high"
                                    ? "destructive"
                                    : task.priority === "medium"
                                      ? "default"
                                      : "secondary"
                                }
                                className="text-xs"
                              >
                                {task.priority}
                              </Badge>
                              {task.alexa && (
                                <Badge variant="outline" className="text-xs">
                                  Alexa
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {task.status === "pending" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleToggleComplete(task.id)}
                            >
                              <Check className="h-3 w-3" />
                              Complete
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleToggleComplete(task.id)}
                            >
                              <X className="h-3 w-3" />
                              Undo
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full gap-2" onClick={openAddDialog}>
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Tasks scheduled for the future</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingTasks.length === 0 ? (
                    <div className="text-center py-4">
                      <Calendar className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No upcoming tasks</p>
                    </div>
                  ) : (
                    upcomingTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              task.priority === "high"
                                ? "bg-destructive/10 text-destructive"
                                : task.priority === "medium"
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-secondary/10 text-secondary"
                            }`}
                          >
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{task.description}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {task.dueDate}
                              </Badge>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {task.dueTime}
                              </div>
                              <Badge
                                variant={
                                  task.priority === "high"
                                    ? "destructive"
                                    : task.priority === "medium"
                                      ? "default"
                                      : "secondary"
                                }
                                className="text-xs"
                              >
                                {task.priority}
                              </Badge>
                              {task.alexa && (
                                <Badge variant="outline" className="text-xs">
                                  Alexa
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
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

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Tasks</CardTitle>
                  <CardDescription>Tasks that need to be completed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingTasks.length === 0 ? (
                      <div className="text-center py-4">
                        <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">No pending tasks</p>
                      </div>
                    ) : (
                      pendingTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                task.priority === "high"
                                  ? "bg-destructive/10 text-destructive"
                                  : task.priority === "medium"
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-secondary/10 text-secondary"
                              }`}
                            >
                              <Clock className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {task.dueDate}
                                </Badge>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {task.dueTime}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleToggleComplete(task.id)}
                          >
                            <Check className="h-3 w-3" />
                            Complete
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completed Tasks</CardTitle>
                  <CardDescription>Tasks that have been completed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completedTasks.length === 0 ? (
                      <div className="text-center py-4">
                        <Check className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">No completed tasks</p>
                      </div>
                    ) : (
                      completedTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium line-through text-muted-foreground">{task.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {task.dueDate}
                                </Badge>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {task.dueTime}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleToggleComplete(task.id)}
                          >
                            <X className="h-3 w-3" />
                            Undo
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
