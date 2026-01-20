import { createFileRoute } from '@tanstack/react-router'
import { MediaAssetsSettings } from '@/features/settings/media-assets'

export const Route = createFileRoute('/_authenticated/settings/media-assets')({
  component: MediaAssetsSettings,
})
