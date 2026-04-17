export type UUID = string

export type ReminderRow = {
  id: UUID
  elderly_person_id: UUID
  created_by: UUID | null
  title: string
  description: string | null
  reminder_time: string // "HH:MM:SS" or "HH:MM"
  reminder_date: string | null // "YYYY-MM-DD"
  frequency: string | null
  alexa_enabled: boolean | null
  completed: boolean | null
  status: string | null
  created_at: string | null
  updated_at: string | null
}

export type TaskRow = {
  id: UUID
  elderly_person_id: UUID
  created_by: UUID | null
  title: string
  description: string | null
  priority: "low" | "medium" | "high" | string | null
  status: "pending" | "completed" | "cancelled" | string | null
  due_date: string
  due_time: string
  alexa_enabled: boolean | null
  completed_at: string | null
  created_at: string | null
  updated_at: string | null
}

export type VisitorRow = {
  id: UUID
  elderly_person_id: UUID
  name: string
  role: string | null
  photo_url: string | null
  notes: string | null
  last_visit: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
}

export type UnknownVisitorRow = {
  id: UUID
  elderly_person_id: UUID
  detection_timestamp: string
  photo_url: string | null
  status: string | null
  notes: string | null
  created_at: string | null
}

export type ScheduledVisitRow = {
  id: UUID
  elderly_person_id: UUID
  visitor_id: UUID
  visit_date: string
  visit_time: string
  status: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type CameraRow = {
  id: UUID
  elderly_person_id: UUID
  name: string
  location: string | null
  stream_url: string | null
  status: string | null
  is_online: boolean | null
  created_at: string | null
  updated_at: string | null
}

export type ActivityLogRow = {
  id: UUID
  elderly_person_id: UUID
  camera_id: UUID | null
  activity_type: string
  description: string | null
  severity: string | null
  timestamp: string
  metadata: unknown
  resolved: boolean | null
}

