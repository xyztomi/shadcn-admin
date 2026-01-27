export enum ServiceTag {
  VIUFINDER = 'viufinder',
  VIUFINDER_XP = 'viufinder_xp',
}

export enum BoothTag {
  KING_PADEL_KEMANG = 'king_padel_kemang',
  KYZN_KUNINGAN = 'kyzn_kuningan',
  MR_PADEL_CIPETE = 'mr_padel_cipete',
  OTHER = 'other',
  ALL = 'all',
}

export interface ContactTag {
  id: number
  name: string
  color: string
}

export interface Contact {
  wa_id: string
  name: string | null
  phone_number: string
  service_tag: ServiceTag | null
  booth_tag: BoothTag | null
  is_active: boolean
  is_resolved: boolean
  resolved_by_agent_id: number | null
  resolved_at: string | null
  notes: string | null
  last_message_at: string | null
  /** When customer last sent a message (for 24-hour WhatsApp window tracking) */
  last_inbound_message_at: string | null
  unread_count: number
  tags: ContactTag[]
  created_at: string
  updated_at: string
}
