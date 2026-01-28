import { z } from 'zod'

export const serviceTagSchema = z.enum(['viufinder', 'viufinder_xp'])
export type ServiceTag = z.infer<typeof serviceTagSchema>

export const boothTagSchema = z.enum([
  'king_padel_kemang',
  'kyzn_kuningan',
  'mr_padel_cipete',
  'other',
  'all',
])
export type BoothTag = z.infer<typeof boothTagSchema>

export const contactTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
})
export type ContactTag = z.infer<typeof contactTagSchema>

export const contactSchema = z.object({
  wa_id: z.string(),
  name: z.string().nullable(),
  phone_number: z.string(),
  service_tag: serviceTagSchema.nullable(),
  booth_tag: boothTagSchema.nullable(),
  is_active: z.boolean(),
  is_resolved: z.boolean().optional(),
  resolved_by_agent_id: z.number().nullable().optional(),
  resolved_at: z.string().nullable().optional(),
  notes: z.string().nullable(),
  last_message_at: z.string().nullable(),
  unread_count: z.number().optional(),
  tags: z.array(contactTagSchema).default([]),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Contact = z.infer<typeof contactSchema>

export const serviceTags = [
  { value: 'viufinder', label: 'VIU Finder' },
  { value: 'viufinder_xp', label: 'VIU Finder XP' },
] as const

export const boothTags = [
  { value: 'king_padel_kemang', label: 'King Padel Kemang' },
  { value: 'kyzn_kuningan', label: 'KYZN Kuningan' },
  { value: 'mr_padel_cipete', label: 'Mr Padel Cipete' },
  { value: 'other', label: 'Other' },
] as const
