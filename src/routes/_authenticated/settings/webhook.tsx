import { createFileRoute } from '@tanstack/react-router'
import { WebhookSettings } from '@/features/settings/webhook'

export const Route = createFileRoute('/_authenticated/settings/webhook')({
  component: WebhookSettings,
})
