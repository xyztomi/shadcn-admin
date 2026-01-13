export enum ServiceTag {
  VIUFINDER = 'viufinder',
  VIUFINDER_XP = 'viufinder_xp',
}

export interface Contact {
  wa_id: string
  name: string | null
  phone_number: string
  service_tag: ServiceTag | null
  is_active: boolean
  notes: string | null
  last_message_at: string | null
  unread_count: number
  created_at: string
  updated_at: string
}
