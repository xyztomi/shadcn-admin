export enum ConversationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface Conversation {
  id: number
  wa_id: string
  status: ConversationStatus
  last_message_at: string | null
  created_at: string
  updated_at: string
}
