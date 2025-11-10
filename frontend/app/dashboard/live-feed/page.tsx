// "use client"

// import { useState } from "react"
// import { DashboardLayout } from "@/components/dashboard-layout"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import {
//   AlertTriangle,
//   Camera,
//   CameraOff,
//   Maximize2,
//   Mic,
//   MicOff,
//   PhoneCall,
//   Video,
//   Volume2,
//   VolumeX,
// } from "lucide-react"

// export default function LiveFeedPage() {
//   const [isMuted, setIsMuted] = useState(false)
//   const [isCameraOn, setIsCameraOn] = useState(true)
//   const [isSpeakerOn, setIsSpeakerOn] = useState(true)
//   const [isFullscreen, setIsFullscreen] = useState(false)

//   const rooms = [
//     { id: "living-room", name: "Living Room" },
//     { id: "kitchen", name: "Kitchen" },
//     { id: "bedroom", name: "Bedroom" },
//     { id: "entrance", name: "Entrance" },
//   ]

//   return (
//     <DashboardLayout>
//       <div className="p-6 space-y-6">
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">Live Feed</h1>
//             <p className="text-muted-foreground">Monitor your loved one in real-time through connected cameras</p>
//           </div>
//           <Button size="lg" className="gap-2" variant="destructive">
//             <PhoneCall className="h-4 w-4" />
//             SOS Call
//           </Button>
//         </div>

//         <Tabs defaultValue="living-room" className="space-y-4">
//           <div className="flex justify-between items-center">
//             <TabsList>
//               {rooms.map((room) => (
//                 <TabsTrigger key={room.id} value={room.id}>
//                   {room.name}
//                 </TabsTrigger>
//               ))}
//             </TabsList>
//             <div className="flex gap-2">
//               <Button variant="outline" size="icon" onClick={() => setIsMuted(!isMuted)}>
//                 {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
//               </Button>
//               <Button variant="outline" size="icon" onClick={() => setIsCameraOn(!isCameraOn)}>
//                 {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
//               </Button>
//               <Button variant="outline" size="icon" onClick={() => setIsSpeakerOn(!isSpeakerOn)}>
//                 {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
//               </Button>
//               <Button variant="outline" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
//                 <Maximize2 className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>

//           {rooms.map((room) => (
//             <TabsContent key={room.id} value={room.id} className="space-y-4">
//               <Card>
//                 <CardContent className="p-0">
//                   <div
//                     className={`relative ${isFullscreen ? "h-[calc(100vh-12rem)]" : "aspect-video"} bg-muted rounded-md flex items-center justify-center overflow-hidden`}
//                   >
//                     {isCameraOn ? (
//                       <div className="text-center space-y-2">
//                         <Video className="h-12 w-12 mx-auto text-muted-foreground" />
//                         <p className="text-muted-foreground">Live feed from {room.name}</p>
//                         <Button variant="outline" size="sm">
//                           Connect Camera
//                         </Button>
//                       </div>
//                     ) : (
//                       <div className="text-center space-y-2">
//                         <CameraOff className="h-12 w-12 mx-auto text-muted-foreground" />
//                         <p className="text-muted-foreground">Camera is turned off</p>
//                         <Button variant="outline" size="sm" onClick={() => setIsCameraOn(true)}>
//                           Turn On Camera
//                         </Button>
//                       </div>
//                     )}

//                     {/* Status indicator */}
//                     <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 p-2 rounded-md">
//                       <div className="h-2 w-2 rounded-full bg-green-500"></div>
//                       <span className="text-xs font-medium">Live</span>
//                     </div>

//                     {/* Controls overlay */}
//                     <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-background/80 p-2 rounded-md">
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="h-8 w-8 rounded-full"
//                         onClick={() => setIsMuted(!isMuted)}
//                       >
//                         {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="h-8 w-8 rounded-full"
//                         onClick={() => setIsCameraOn(!isCameraOn)}
//                       >
//                         {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="h-8 w-8 rounded-full"
//                         onClick={() => setIsSpeakerOn(!isSpeakerOn)}
//                       >
//                         {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
//                       </Button>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <div className="grid gap-4 md:grid-cols-3">
//                 <Card>
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-sm font-medium">Status</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="flex items-center gap-2">
//                       <div className="h-3 w-3 rounded-full bg-green-500"></div>
//                       <span className="font-medium">Normal Activity</span>
//                     </div>
//                     <p className="text-xs text-muted-foreground mt-1">Last updated: 2 minutes ago</p>
//                   </CardContent>
//                 </Card>

//                 <Card>
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-sm font-medium">Emotion Analysis</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="font-medium">Calm</div>
//                     <p className="text-xs text-muted-foreground">No signs of distress detected</p>
//                   </CardContent>
//                 </Card>

//                 <Card>
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-sm font-medium">Fall Detection</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="flex items-center gap-2">
//                       <div className="h-3 w-3 rounded-full bg-green-500"></div>
//                       <span className="font-medium">No Falls Detected</span>
//                     </div>
//                     <p className="text-xs text-muted-foreground">System monitoring movement</p>
//                   </CardContent>
//                 </Card>
//               </div>

//               <Card>
//                 <CardHeader>
//                   <CardTitle>Recent Alerts</CardTitle>
//                   <CardDescription>Notifications from this camera in the past 24 hours</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-4">
//                     <div className="flex items-start gap-4">
//                       <div className="bg-amber-500/10 p-2 rounded-full">
//                         <AlertTriangle className="h-4 w-4 text-amber-500" />
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium">Unknown Visitor</p>
//                         <p className="text-xs text-muted-foreground">Delivery person detected at entrance</p>
//                         <p className="text-xs text-muted-foreground mt-1">3 hours ago</p>
//                       </div>
//                     </div>

//                     <div className="flex items-start gap-4">
//                       <div className="bg-primary/10 p-2 rounded-full">
//                         <Camera className="h-4 w-4 text-primary" />
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium">Motion Detected</p>
//                         <p className="text-xs text-muted-foreground">Movement in the living room</p>
//                         <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </TabsContent>
//           ))}
//         </Tabs>
//       </div>
//     </DashboardLayout>
//   )
// }


"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Maximize2,
  Mic,
  MicOff,
  PhoneCall,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react"

export default function LiveFeedPage() {
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const rooms = [
    { id: "living-room", name: "Living Room" },
    { id: "kitchen", name: "Kitchen" },
    { id: "bedroom", name: "Bedroom" },
    { id: "entrance", name: "Entrance" },
  ]

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Live Feed</h1>
            <p className="text-muted-foreground">Monitor your loved one in real-time through connected cameras</p>
          </div>
          <Button size="lg" className="gap-2" variant="destructive">
            <PhoneCall className="h-4 w-4" />
            SOS Call
          </Button>
        </div>

        <Tabs defaultValue="living-room" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              {rooms.map((room) => (
                <TabsTrigger key={room.id} value={room.id}>
                  {room.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsCameraOn(!isCameraOn)}>
                {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsSpeakerOn(!isSpeakerOn)}>
                {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {rooms.map((room) => (
            <TabsContent key={room.id} value={room.id} className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <div
                    className={`relative ${
                      isFullscreen ? "h-[calc(100vh-12rem)]" : "aspect-video"
                    } bg-muted rounded-md flex items-center justify-center overflow-hidden`}
                  >
                    {isCameraOn ? (
                      <img
                        src="http://127.0.0.1:5000/video_feed"
                        alt={`Live feed from ${room.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center space-y-2">
                        <CameraOff className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">Camera is turned off</p>
                        <Button variant="outline" size="sm" onClick={() => setIsCameraOn(true)}>
                          Turn On Camera
                        </Button>
                      </div>
                    )}

                    {/* Status indicator */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 p-2 rounded-md">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-xs font-medium">Live</span>
                    </div>

                    {/* Controls overlay */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-background/80 p-2 rounded-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setIsCameraOn(!isCameraOn)}
                      >
                        {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                      >
                        {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="font-medium">Normal Activity</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Last updated: 2 minutes ago</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Emotion Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-medium">Calm</div>
                    <p className="text-xs text-muted-foreground">No signs of distress detected</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Fall Detection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="font-medium">No Falls Detected</span>
                    </div>
                    <p className="text-xs text-muted-foreground">System monitoring movement</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Alerts</CardTitle>
                  <CardDescription>Notifications from this camera in the past 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-amber-500/10 p-2 rounded-full">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Unknown Visitor</p>
                        <p className="text-xs text-muted-foreground">Delivery person detected at entrance</p>
                        <p className="text-xs text-muted-foreground mt-1">3 hours ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Camera className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Motion Detected</p>
                        <p className="text-xs text-muted-foreground">Movement in the living room</p>
                        <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
