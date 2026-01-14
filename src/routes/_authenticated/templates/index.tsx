import { createFileRoute } from '@tanstack/react-router'
import { Templates } from '@/features/templates'
import { requireRole } from '@/lib/require-role'

export const Route = createFileRoute('/_authenticated/templates/')({
  beforeLoad: () => requireRole(['superuser', 'admin']),
  component: Templates,
})
