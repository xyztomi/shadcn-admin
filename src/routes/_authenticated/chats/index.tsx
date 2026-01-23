import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Chats } from '@/features/chats'

const chatsSearchSchema = z.object({
  contact: z.string().optional(),
})

function ChatsPage() {
  const { contact } = Route.useSearch()
  return <Chats initialContactWaId={contact} />
}

export const Route = createFileRoute('/_authenticated/chats/')({
  component: ChatsPage,
  validateSearch: chatsSearchSchema,
})
