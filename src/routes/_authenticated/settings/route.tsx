import { createFileRoute } from '@tanstack/react-router'
import { Settings } from '@/features/settings'
import { requireRole } from '@/lib/require-role'

export const Route = createFileRoute('/_authenticated/settings')({
  beforeLoad: () => requireRole(['superuser', 'admin']),
  component: Settings,
})
