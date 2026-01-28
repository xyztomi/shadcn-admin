import { createFileRoute } from '@tanstack/react-router'
import { MediaAssetsSettings } from '@/features/settings/media-assets'
import { requireRole } from '@/lib/require-role'

export const Route = createFileRoute('/_authenticated/settings/media-assets')({
  beforeLoad: () => requireRole(['superuser', 'admin']),
  component: MediaAssetsSettings,
})
