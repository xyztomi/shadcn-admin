import { createFileRoute } from '@tanstack/react-router'
import { AgentDashboard } from '@/features/dashboard/agent-dashboard'

export const Route = createFileRoute('/_authenticated/dashboard/agent')({
  component: AgentDashboard,
})
