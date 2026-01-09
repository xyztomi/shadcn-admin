import { createFileRoute } from '@tanstack/react-router'
import { TagsSettings } from '@/features/settings/tags'

export const Route = createFileRoute('/_authenticated/settings/tags')({
  component: TagsSettings,
})
