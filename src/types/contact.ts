export enum ServiceTag {
  VIUFINDER = 'viufinder',
  VIUFINDER_XP = 'viufinder_xp',
}

export enum BoothTag {
  KING_PADEL_KEMANG = 'king_padel_kemang',
  KYZN_KUNINGAN = 'kyzn_kuningan',
  MR_PADEL_CIPETE = 'mr_padel_cipete',
  OTHER = 'other',
}

export interface Contact {
  wa_id: string
  name: string | null
  phone_number: string
  service_tag: ServiceTag | null
  booth_tag: BoothTag | null
  is_active: boolean
  is_resolved: boolean
  notes: string | null
  last_message_at: string | null
  unread_count: number
  created_at: string
  updated_at: string
}
