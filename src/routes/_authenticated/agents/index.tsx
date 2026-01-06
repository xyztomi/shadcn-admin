import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Agents } from '@/features/agents'

const agentsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Facet filters
  department: z
    .array(z.enum(['viufinder', 'viufinder_xp']))
    .optional()
    .catch([]),
  role: z
    .array(z.enum(['admin', 'manager', 'agent']))
    .optional()
    .catch([]),
  status: z
    .array(z.enum(['online', 'offline', 'available']))
    .optional()
    .catch([]),
  // Per-column text filter
  username: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/agents/')({
  validateSearch: agentsSearchSchema,
  component: Agents,
})
