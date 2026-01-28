import { createFileRoute } from '@tanstack/react-router'
import { WebhookSettings } from '@/features/settings/webhook'
import { requireRole } from '@/lib/require-role'

export const Route = createFileRoute('/_authenticated/settings/webhook')({
  beforeLoad: () => requireRole(['superuser', 'admin']),
  component: WebhookSettings,
})
