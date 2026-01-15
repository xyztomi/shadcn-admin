import { createFileRoute } from '@tanstack/react-router'
import { BotHandlers } from '@/features/bot-handlers'
import { requireRole } from '@/lib/require-role'

export const Route = createFileRoute('/_authenticated/bot-handlers/')({
  beforeLoad: () => requireRole(['superuser', 'admin']),
  component: BotHandlers,
})
