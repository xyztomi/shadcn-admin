export type BroadcastStatus =
  | 'draft'
  | 'pending'
  | 'sending'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type BroadcastTargetType =
  | 'all_contacts'
  | 'by_tags'
  | 'selected_contacts'

export interface Broadcast {
  id: number
  name: string
  message: string
  target_type: BroadcastTargetType
  tag_ids: number[]
  contact_ids: number[]
  status: BroadcastStatus
  total_recipients: number
  sent_count: number
  delivered_count: number
  failed_count: number
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_by_agent_id: number | null
  created_at: string
  updated_at: string
}

export interface BroadcastPreview {
  total_recipients: number
  sample_contacts: {
    id: number
    wa_id: string
    name: string | null
    phone_number: string | null
  }[]
}

export interface BroadcastRecipient {
  id: number
  contact_id: number
  wa_id: string
  status: string
  wa_message_id: string | null
  error: string | null
  sent_at: string | null
  delivered_at: string | null
}
