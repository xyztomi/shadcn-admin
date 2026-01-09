import { createFileRoute } from '@tanstack/react-router'
import { QuickRepliesSettings } from '@/features/settings/quick-replies'

export const Route = createFileRoute('/_authenticated/settings/quick-replies')({
  component: QuickRepliesSettings,
})
