import { createFileRoute } from '@tanstack/react-router'
import { TagsSettings } from '@/features/settings/tags'
import { requireRole } from '@/lib/require-role'

export const Route = createFileRoute('/_authenticated/settings/tags')({
  beforeLoad: () => requireRole(['superuser', 'admin']),
  component: TagsSettings,
})
