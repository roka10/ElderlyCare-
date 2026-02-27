"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

