export enum ServiceTag {
  VIUFINDER = 'viufinder',
  VIUFINDER_XP = 'viufinder_xp',
}

export enum CityTag {
  JAKARTA = 'jakarta',
  BANDUNG = 'bandung',
  SURABAYA = 'surabaya',
  MEDAN = 'medan',
  SEMARANG = 'semarang',
  MAKASSAR = 'makassar',
  PALEMBANG = 'palembang',
  TANGERANG = 'tangerang',
  DEPOK = 'depok',
  BEKASI = 'bekasi',
  OTHER = 'other',
}

export interface Contact {
  wa_id: string
  name: string | null
  phone_number: string
  service_tag: ServiceTag | null
  city_tag: CityTag | null
  is_active: boolean
  notes: string | null
  last_message_at: string | null
  unread_count: number
  created_at: string
  updated_at: string
}
