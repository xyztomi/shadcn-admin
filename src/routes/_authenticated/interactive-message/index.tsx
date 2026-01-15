import { createFileRoute } from '@tanstack/react-router'
import { InteractiveMessage } from '@/features/interactive-message'
import { requireRole } from '@/lib/require-role'

export const Route = createFileRoute('/_authenticated/interactive-message/')({
  beforeLoad: () => requireRole(['superuser', 'admin']),
  component: InteractiveMessage,
})
