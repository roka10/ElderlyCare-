import { useEffect, useMemo, useState } from "react"

import { supabase } from "@/lib/supabase/client"
import { getCached, invalidate, setCached } from "@/lib/data/cache"
import { getElderlyPersonId } from "@/lib/data/env"
import type { ReminderRow, UUID } from "@/lib/supabase/types"

export type Reminder = {
  id: UUID
  title: string
  description: string
  time: string
  frequency: string
  alexa: boolean
  completed: boolean
  date?: string
}

const CACHE_KEY = "reminders:list:"
const STALE_MS = 15_000

function rowToReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    time: (row.reminder_time ?? "").slice(0, 5) || "09:00",
    frequency: row.frequency ?? "once",
    alexa: !!row.alexa_enabled,
    completed: !!row.completed,
    date: row.reminder_date ?? undefined,
  }
}

function reminderToInsert(input: Omit<Reminder, "id">) {
  const elderlyId = getElderlyPersonId()
  if (!elderlyId) {
    throw new Error("Missing elderly person id. Set NEXT_PUBLIC_ELDERLY_PERSON_ID or ELDERLY_PERSON_ID.")
  }
  return {
    elderly_person_id: elderlyId,
    title: input.title,
    description: input.description || null,
    reminder_time: input.time,
    reminder_date: input.date ?? null,
    frequency: input.frequency ?? "once",
    alexa_enabled: input.alexa,
    completed: input.completed,
    status: input.completed ? "completed" : "active",
  }
}

async function fetchReminders(): Promise<Reminder[]> {
  const elderlyId = getElderlyPersonId()
  if (!elderlyId) return []
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("elderly_person_id", elderlyId)
    .order("reminder_date", { ascending: true })
    .order("reminder_time", { ascending: true })

  if (error) throw error
  return (data as ReminderRow[]).map(rowToReminder)
}

export async function prefetchReminders() {
  const elderlyId = getElderlyPersonId()
  if (!elderlyId) return []
  const key = `${CACHE_KEY}${elderlyId}`
  const cached = getCached<Reminder[]>(key, STALE_MS)
  if (cached) return cached
  const data = await fetchReminders()
  setCached(key, data)
  return data
}

export function useReminders() {
  const elderlyId = useMemo(() => getElderlyPersonId(), [])
  const cacheKey = `${CACHE_KEY}${elderlyId}`

  const [data, setData] = useState<Reminder[] | null>(() => getCached(cacheKey, STALE_MS) ?? null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(!data)

  const refresh = async () => {
    if (!elderlyId) {
      setData([])
      setError("Missing elderly person id. Set NEXT_PUBLIC_ELDERLY_PERSON_ID or ELDERLY_PERSON_ID.")
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const next = await fetchReminders()
      setCached(cacheKey, next)
      setData(next)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load reminders")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  const addReminder = async (input: Omit<Reminder, "id">) => {
    const optimistic: Reminder = { ...input, id: `tmp-${Date.now()}` }
    setData((prev) => (prev ? [...prev, optimistic] : [optimistic]))

    const { data: inserted, error: insertError } = await supabase
      .from("reminders")
      .insert(reminderToInsert(input))
      .select("*")
      .single()

    if (insertError) {
      // rollback
      await refresh()
      throw insertError
    }

    const saved = rowToReminder(inserted as ReminderRow)
    setData((prev) => (prev ? prev.map((r) => (r.id === optimistic.id ? saved : r)) : [saved]))
    invalidate(CACHE_KEY)
    return saved
  }

  const updateReminder = async (id: UUID, patch: Partial<Omit<Reminder, "id">>) => {
    setData((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, ...patch } as Reminder : r)) : prev))

    const updatePayload: any = {}
    if (patch.title !== undefined) updatePayload.title = patch.title
    if (patch.description !== undefined) updatePayload.description = patch.description || null
    if (patch.time !== undefined) updatePayload.reminder_time = patch.time
    if (patch.date !== undefined) updatePayload.reminder_date = patch.date || null
    if (patch.frequency !== undefined) updatePayload.frequency = patch.frequency
    if (patch.alexa !== undefined) updatePayload.alexa_enabled = patch.alexa
    if (patch.completed !== undefined) {
      updatePayload.completed = patch.completed
      updatePayload.status = patch.completed ? "completed" : "active"
    }

    const { error: updateError } = await supabase.from("reminders").update(updatePayload).eq("id", id)
    if (updateError) {
      await refresh()
      throw updateError
    }
    invalidate(CACHE_KEY)
  }

  const deleteReminder = async (id: UUID) => {
    const prev = data
    setData((curr) => (curr ? curr.filter((r) => r.id !== id) : curr))

    const { error: delError } = await supabase.from("reminders").delete().eq("id", id)
    if (delError) {
      setData(prev ?? null)
      throw delError
    }
    invalidate(CACHE_KEY)
  }

  return {
    data: data ?? [],
    error,
    isLoading,
    refresh,
    addReminder,
    updateReminder,
    deleteReminder,
  }
}

