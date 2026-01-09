export interface QuickReply {
  id: number
  title: string
  content: string
  category: string | null
  shortcut: string | null
  is_active: boolean
  usage_count: number
  created_by_agent_id: number | null
  created_at: string
  updated_at: string
}
