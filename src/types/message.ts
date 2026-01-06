export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACTS = 'contacts',
  INTERACTIVE = 'interactive',
}

export interface Message {
  id: string
  wa_id: string
  direction: MessageDirection
  message_type: MessageType
  /**
   * Some endpoints return `content`, others `text`. Keep both to ensure compatibility.
   */
  content?: string | null
  text?: string | null
  message?: string | null
  /** Sender metadata provided by the backend for agent/customer attribution. */
  sender?: string | null
  agent_id?: number | null
  sender_name?: string | null
  sender_username?: string | null
  agent_name?: string | null
  agent_username?: string | null
  contact_name?: string | null
  contact_username?: string | null
  status: MessageStatus
  timestamp: string
  created_at: string
  updated_at: string
}
