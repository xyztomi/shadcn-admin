import { createFileRoute } from '@tanstack/react-router'
import { ShiftsSettings } from '@/features/settings/shifts'
import { requireRole } from '@/lib/require-role'

export const Route = createFileRoute('/_authenticated/settings/')({
  beforeLoad: () => requireRole(['superuser', 'admin']),
  component: ShiftsSettings,
})

