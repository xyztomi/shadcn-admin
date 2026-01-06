export enum ConversationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface Conversation {
  id: number
  wa_id: string
  assigned_agent_id: number | null
  status: ConversationStatus
  last_message_at: string | null
  created_at: string
  updated_at: string
}
