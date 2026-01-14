import { createFileRoute } from '@tanstack/react-router'
import { AdminDashboard } from '@/features/dashboard/admin-dashboard'
import { requireRole } from '@/lib/require-role'

export const Route = createFileRoute('/_authenticated/dashboard/admin')({
  beforeLoad: () => requireRole(['admin', 'superuser']),
  component: AdminDashboard,
})
