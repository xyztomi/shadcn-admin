import { createFileRoute } from '@tanstack/react-router'
import { useAgentDashboard } from '@/api/stats'
import { AgentDashboardView } from '@/features/dashboard/agent-dashboard-view'

export const Route = createFileRoute('/_authenticated/dashboard/agent/$agentId')({
  component: AgentDashboardPage,
})

function AgentDashboardPage() {
  const { agentId } = Route.useParams()
  const { data: stats, isLoading } = useAgentDashboard(agentId)

  return (
    <AgentDashboardView
      stats={stats}
      isLoading={isLoading}
      isAdminView={true}
      agentId={agentId}
    />
  )
} 
