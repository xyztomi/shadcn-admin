import { createFileRoute } from '@tanstack/react-router'
import { BroadcastPage } from '@/features/broadcast'

export const Route = createFileRoute('/_authenticated/broadcast/')({
  component: BroadcastPage,
})
