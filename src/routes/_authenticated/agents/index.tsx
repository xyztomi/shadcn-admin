import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Agents } from '@/features/agents'
import { requireRole } from '@/lib/require-role'

const agentsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.union([z.literal('online'), z.literal('offline')]))
    .optional()
    .catch([]),
  name: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/agents/')({
  beforeLoad: () => requireRole(['superuser', 'admin']),
  validateSearch: agentsSearchSchema,
  component: Agents,
})
