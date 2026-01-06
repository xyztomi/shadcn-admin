import { z } from 'zod'

export const serviceTagSchema = z.enum(['viufinder', 'viufinder_xp'])
export type ServiceTag = z.infer<typeof serviceTagSchema>

export const contactSchema = z.object({
  wa_id: z.string(),
  name: z.string().nullable(),
  phone_number: z.string(),
  service_tag: serviceTagSchema.nullable(),
  assigned_agent_id: z.number().nullable(),
  assigned_agent_name: z.string().nullable(),
  is_active: z.boolean(),
  notes: z.string().nullable(),
  last_message_at: z.string().nullable(),
  unread_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Contact = z.infer<typeof contactSchema>

export const serviceTags = [
  { value: 'viufinder', label: 'VIU Finder' },
  { value: 'viufinder_xp', label: 'VIU Finder XP' },
] as const
