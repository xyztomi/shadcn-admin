export interface Tag {
  id: number
  name: string
  color: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TagWithCount extends Tag {
  contact_count: number
}
