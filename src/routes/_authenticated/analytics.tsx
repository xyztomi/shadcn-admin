import { createFileRoute } from '@tanstack/react-router'
import { Analytics } from '@/features/analytics'
import { requireRole } from '@/lib/require-role'

export const Route = createFileRoute('/_authenticated/analytics')({
  beforeLoad: () => requireRole(['superuser', 'admin']),
  component: Analytics,
})
