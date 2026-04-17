"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertTriangle, Camera, CameraOff, Maximize2, Minimize2,
  PhoneCall, Activity, Smile, PersonStanding, Wifi, WifiOff,
  UserPlus, Users, Trash2, CheckCircle, Loader2, Bone, Footprints,
} from "lucide-react"

const BACKEND = "http://127.0.0.1:5000"

interface DetectionState {
  face_name: string
  emotion: string
  emotion_confidence: number
  motion: string
  fall: string
  faces_count: number
  pose_status: string
  activity: string
  landmark_count: number
}

interface AlertEntry {
  id: number
  type: "fall" | "motion" | "face" | "emotion"
  message: string
  time: string
}

const EMOTION_EMOJI: Record<string, string> = {
  Happy: "😊", Sad: "😢", Angry: "😠", Fear: "😨",
  Surprise: "😮", Disgust: "🤢", Neutral: "😐", "N/A": "❓",
}

export default function LiveFeedPage() {
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [feedKey, setFeedKey] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [detection, setDetection] = useState<DetectionState>({
    face_name: "No Face", emotion: "N/A", emotion_confidence: 0,
    motion: "No Motion", fall: "No Fall", faces_count: 0,
    pose_status: "No Person", activity: "Idle", landmark_count: 0,
  })
  const [alerts, setAlerts] = useState<AlertEntry[]>([])
  const [knownPeople, setKnownPeople] = useState<string[]>([])
  const [showRegister, setShowRegister] = useState(false)
  const [registerName, setRegisterName] = useState("")
  const [registerStatus, setRegisterStatus] = useState<"idle" | "capturing" | "done" | "error">("idle")
  const alertIdRef = useRef(0)

  // ── Fetch known faces ────────────────────────────────────────────────────
  const fetchKnownFaces = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/known_faces`)
      if (res.ok) {
        const data = await res.json()
        const names = (data.people || []).map((p: any) => typeof p === 'string' ? p : p.name)
        setKnownPeople(names)
      }
    } catch { /* offline */ }
  }, [])

  useEffect(() => { fetchKnownFaces() }, [fetchKnownFaces])

  // ── Poll detection status ────────────────────────────────────────────────
  useEffect(() => {
    if (!isCameraOn) { setIsConnected(false); return }

    setIsConnected(true)
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND}/detection_status`)
        if (!res.ok) { setIsConnected(false); return }
        const data: DetectionState = await res.json()
        setIsConnected(true)
        setDetection(data)

        // Auto-generate alerts
        if (data.fall.includes("FALL")) addAlert("fall", `⚠️ FALL DETECTED!`)
        if (data.motion === "Motion Detected" && data.faces_count === 0)
          addAlert("motion", "Motion without visible person")
        if (data.face_name === "Unknown" && data.faces_count > 0)
          addAlert("face", "Unknown person detected in frame")
      } catch { setIsConnected(false) }
    }, 1000)

    return () => clearInterval(interval)
  }, [isCameraOn])

  function addAlert(type: AlertEntry["type"], message: string) {
    setAlerts(prev => {
      if (prev[0]?.message === message) return prev
      alertIdRef.current += 1
      return [{ id: alertIdRef.current, type, message, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15)
    })
  }

  // ── Register Face ────────────────────────────────────────────────────────
  async function handleRegisterFace() {
    if (!registerName.trim()) return
    setRegisterStatus("capturing")
    try {
      const res = await fetch(`${BACKEND}/register_face`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: registerName.trim() }),
      })
      if (res.ok) {
        setRegisterStatus("done")
        await fetchKnownFaces()
        setTimeout(() => { setShowRegister(false); setRegisterName(""); setRegisterStatus("idle") }, 2000)
      } else {
        setRegisterStatus("error")
      }
    } catch {
      setRegisterStatus("error")
    }
  }

  async function handleDeleteFace(name: string) {
    try {
      await fetch(`${BACKEND}/delete_face/${encodeURIComponent(name)}`, { method: "DELETE" })
      await fetchKnownFaces()
    } catch { /* offline */ }
  }

  // ── UI helpers ───────────────────────────────────────────────────────────
  const fallColor = detection.fall.includes("FALL") ? "text-red-500" :
    detection.fall === "Possible Fall" ? "text-amber-500" : "text-green-500"
  const motionColor = detection.motion === "Motion Detected" ? "text-blue-400" : "text-green-500"

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Live Feed</h1>
            <p className="text-muted-foreground">
              Real-time AI — face recognition · emotion · motion · fall detection
            </p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <Badge variant={isConnected ? "default" : "secondary"} className="gap-1.5 px-3 py-1">
              {isConnected ? <><Wifi className="h-3.5 w-3.5" /> Connected</> : <><WifiOff className="h-3.5 w-3.5" /> Offline</>}
            </Badge>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => { setShowRegister(true); setRegisterStatus("idle") }}>
              <UserPlus className="h-4 w-4" /> Register Face
            </Button>
            <Button size="lg" className="gap-2" variant="destructive">
              <PhoneCall className="h-4 w-4" /> SOS Call
            </Button>
          </div>
        </div>

        {/* ── 4 Detection Cards (always visible) ── */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">

          {/* Face ID */}
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PersonStanding className="h-4 w-4 text-blue-500" />
                Face Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-lg truncate">
                {isCameraOn ? detection.face_name : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isCameraOn ? `${detection.faces_count} face(s) in frame` : "Camera off"}
              </p>
            </CardContent>
          </Card>

          {/* Emotion */}
          <Card className="border-yellow-200 dark:border-yellow-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smile className="h-4 w-4 text-yellow-500" />
                Emotion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-lg flex items-center gap-2">
                <span className="text-2xl">{EMOTION_EMOJI[detection.emotion] ?? "❓"}</span>
                <span>{isCameraOn ? detection.emotion : "—"}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isCameraOn && detection.emotion_confidence > 0
                  ? `${(detection.emotion_confidence * 100).toFixed(0)}% confidence`
                  : "Camera off"}
              </p>
            </CardContent>
          </Card>

          {/* Motion (Landmark-Based) */}
          <Card className="border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                Motion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`font-semibold text-lg ${isCameraOn ? motionColor : "text-muted-foreground"}`}>
                {isCameraOn ? detection.motion : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isCameraOn ? "Landmark tracking (33 pts)" : "Camera off"}
              </p>
            </CardContent>
          </Card>

          {/* Pose Status */}
          <Card className="border-cyan-200 dark:border-cyan-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bone className="h-4 w-4 text-cyan-500" />
                Pose
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`font-semibold text-lg ${isCameraOn ? (detection.pose_status === "Lying Down" ? "text-red-400" : detection.pose_status === "Sitting" ? "text-amber-400" : "text-cyan-400") : "text-muted-foreground"}`}>
                {isCameraOn ? (detection.pose_status || "No Person") : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isCameraOn ? `${detection.landmark_count || 0}/33 landmarks` : "Camera off"}
              </p>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card className="border-indigo-200 dark:border-indigo-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Footprints className="h-4 w-4 text-indigo-500" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`font-semibold text-lg ${isCameraOn ? "text-indigo-400" : "text-muted-foreground"}`}>
                {isCameraOn ? (detection.activity || "Idle") : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isCameraOn ? "Body posture analysis" : "Camera off"}
              </p>
            </CardContent>
          </Card>

          {/* Fall */}
          <Card className={`${detection.fall.includes("FALL") && isCameraOn ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-green-200 dark:border-green-900"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${detection.fall.includes("FALL") && isCameraOn ? "text-red-500 animate-pulse" : "text-green-500"}`} />
                Fall Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`font-semibold text-lg ${isCameraOn ? fallColor : "text-muted-foreground"}`}>
                {isCameraOn ? detection.fall : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isCameraOn ? "Landmark geometry AI" : "Camera off"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Video Stream ── */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${isCameraOn && isConnected ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
              <span className="text-sm font-medium">
                {isCameraOn ? (isConnected ? "Live · MediaPipe Pose + Emotion + Face AI" : "Connecting…") : "Camera Off"}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant={isCameraOn ? "default" : "outline"} size="sm" className="gap-1.5"
                disabled={isStarting}
                onClick={async () => {
                  if (isCameraOn) {
                    setIsCameraOn(false)
                    setIsConnected(false)
                    try { await fetch(`${BACKEND}/camera_stop`, { method: "POST" }) } catch { }
                  } else {
                    setIsStarting(true)
                    try {
                      const res = await fetch(`${BACKEND}/camera_start`, { method: "POST" })
                      if (res.ok) {
                        setFeedKey(Date.now())
                        setIsCameraOn(true)
                      }
                    } catch { } finally {
                      // isStarting will be cleared when the first frame loads (onLoad)
                    }
                  }
                }}>
                {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : isCameraOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                {isStarting ? "Starting…" : isCameraOn ? "Stop" : "Start Camera"}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsFullscreen(v => !v)}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            <div className={`relative bg-black flex items-center justify-center overflow-hidden ${isFullscreen ? "h-[calc(100vh-16rem)]" : "aspect-video"}`}>
              {isCameraOn ? (
                <>
                  <img
                    key={feedKey}
                    src={`${BACKEND}/video_feed?t=${feedKey}`}
                    alt="Live AI detection feed"
                    className="w-full h-full object-contain"
                    onError={() => { setIsConnected(false); setIsStarting(false) }}
                    onLoad={() => { setIsConnected(true); setIsStarting(false) }}
                  />
                  {/* Loading overlay while camera is initialising */}
                  {isStarting && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                      <div className="relative">
                        <div className="h-20 w-20 rounded-full border-4 border-primary/20 flex items-center justify-center">
                          <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" style={{ animationDuration: "1.5s" }} />
                      </div>
                      <p className="text-white font-medium mt-6 text-lg">Initializing Camera…</p>
                      <p className="text-white/50 text-sm mt-1">Loading AI Models</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center space-y-4 p-8">
                  <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <Camera className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Click <b>Start Camera</b> to begin live AI monitoring</p>
                  <Button disabled={isStarting} onClick={async () => {
                    setIsStarting(true)
                    try {
                      const res = await fetch(`${BACKEND}/camera_start`, { method: "POST" })
                      if (res.ok) {
                        setFeedKey(Date.now())
                        setIsCameraOn(true)
                      } else {
                        setIsStarting(false)
                      }
                    } catch { setIsStarting(false) }
                  }} className="gap-2">
                    {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    {isStarting ? "Starting…" : "Start Camera"}
                  </Button>
                </div>
              )}
              {detection.fall.includes("FALL") && isCameraOn && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white font-bold px-6 py-2 rounded-full text-sm animate-bounce shadow-lg">
                  ⚠️ FALL DETECTED — CHECK IMMEDIATELY
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Bottom Row: Known People + Live Alerts ── */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* Known People */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" /> Registered Faces
              </CardTitle>
              <CardDescription>
                People the system will recognise in the live feed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {knownPeople.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm text-muted-foreground">No faces registered yet</p>
                  <Button size="sm" variant="outline" className="gap-2"
                    onClick={() => { setShowRegister(true); setRegisterStatus("idle") }}>
                    <UserPlus className="h-4 w-4" /> Register First Person
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {knownPeople.map(name => (
                    <li key={name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-300">
                          {name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium">{name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteFace(name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Live Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Live Alerts</CardTitle>
              <CardDescription>Auto-generated by the AI detection system</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {isCameraOn ? "All clear ✅" : "Start camera to begin monitoring"}
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3">
                      <div className={`p-2 rounded-full flex-shrink-0 ${alert.type === "fall" ? "bg-red-500/10" : alert.type === "face" ? "bg-amber-500/10" : "bg-blue-500/10"}`}>
                        <AlertTriangle className={`h-4 w-4 ${alert.type === "fall" ? "text-red-500" : alert.type === "face" ? "text-amber-500" : "text-blue-500"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Register Face Dialog ── */}
      <Dialog open={showRegister} onOpenChange={open => { setShowRegister(open); if (!open) { setRegisterName(""); setRegisterStatus("idle") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Register a Known Face
            </DialogTitle>
            <DialogDescription>
              Make sure the person is clearly visible in the live feed camera, then enter their name and click Capture.
            </DialogDescription>
          </DialogHeader>

          {registerStatus === "done" ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-semibold text-green-600">Face registered successfully!</p>
              <p className="text-sm text-muted-foreground text-center">The system will start recognising this person in ~3 seconds.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Person&apos;s Name</label>
                  <Input
                    id="register-name-input"
                    placeholder="e.g. Grandma, John Doe…"
                    value={registerName}
                    onChange={e => setRegisterName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleRegisterFace()}
                    disabled={registerStatus === "capturing"}
                  />
                </div>
                {!isCameraOn && (
                  <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                    ⚠️ Camera must be running to register a face. Please start the camera first.
                  </p>
                )}
                {registerStatus === "error" && (
                  <p className="text-sm text-red-600">Registration failed. Make sure the backend is running and camera is on.</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRegister(false)}>Cancel</Button>
                <Button
                  onClick={handleRegisterFace}
                  disabled={!registerName.trim() || !isCameraOn || registerStatus === "capturing"}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {registerStatus === "capturing" ? "Capturing…" : "Capture & Register"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
