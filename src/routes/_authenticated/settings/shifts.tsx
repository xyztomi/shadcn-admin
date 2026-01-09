import { createFileRoute } from '@tanstack/react-router'
import { ShiftsSettings } from '@/features/settings/shifts'

export const Route = createFileRoute('/_authenticated/settings/shifts')({
  component: ShiftsSettings,
})
