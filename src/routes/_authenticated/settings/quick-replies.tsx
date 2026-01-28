import { createFileRoute } from '@tanstack/react-router'
import { QuickRepliesSettings } from '@/features/settings/quick-replies'
import { requireRole } from '@/lib/require-role'

export const Route = createFileRoute('/_authenticated/settings/quick-replies')({
  beforeLoad: () => requireRole(['superuser', 'admin']),
  component: QuickRepliesSettings,
})
