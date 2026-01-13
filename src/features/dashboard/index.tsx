import {
  MessageSquare,
  Users,
  Clock,
  AlertCircle,
  Headphones,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { format, parseISO } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useOverviewStats, useAgentStats } from '@/api/stats'
import { useAnalyticsOverview, useDepartmentsSummary } from '@/api/analytics'
import { Analytics } from './components/analytics'
import { Overview } from './components/overview'
import { ReportsPanel } from './components/reports'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
}: {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  isLoading?: boolean
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className='h-8 w-20' />
        ) : (
          <div className='text-2xl font-bold'>{value}</div>
        )}
        {description && (
          <p className='text-xs text-muted-foreground'>{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

const numberFormatter = new Intl.NumberFormat('en-US')
const TARGET_LOAD = 6

function formatNumber(value?: number | null): string {
  return numberFormatter.format(value ?? 0)
}

function formatResponseTime(seconds?: number | null): string {
  if (!seconds) return '—'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  if (minutes === 0) {
    return `${remainingSeconds}s`
  }
  if (remainingSeconds === 0) {
    return `${minutes}m`
  }
  return `${minutes}m ${remainingSeconds}s`
}

function safeFormatDate(dateString: string | null | undefined, pattern: string): string | null {
  if (!dateString) return null
  try {
    return format(parseISO(dateString), pattern)
  } catch {
    return null
  }
}

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useOverviewStats()
  const { data: agentStats, isLoading: agentsLoading } = useAgentStats()
  const { data: analyticsOverview, isLoading: analyticsLoading } = useAnalyticsOverview()
  const { data: departmentsSummary, isLoading: departmentsLoading } = useDepartmentsSummary()

  const onlineAgents = agentStats?.filter((a) => a.is_online).length ?? 0
  const availableAgents = agentStats?.filter((a) => a.is_available).length ?? 0
  const contactsTotal = analyticsOverview?.contacts.total ?? stats?.total_contacts ?? 0
  const newContactsToday = analyticsOverview?.contacts.new_today ?? 0
  const activeConversations = analyticsOverview?.conversations.active ?? stats?.active_conversations ?? 0
  const pendingConversations = analyticsOverview?.conversations.pending ?? 0
  const inboundToday = analyticsOverview?.messages.inbound ?? 0
  const outboundToday = analyticsOverview?.messages.outbound ?? 0
  const messagesToday = stats?.messages_today ?? analyticsOverview?.messages.today ?? 0
  const queueUnassigned = analyticsOverview?.contacts.unassigned ?? stats?.unassigned_contacts ?? 0
  const agentsOnlineTotal = stats?.online_agents ?? analyticsOverview?.agents.online ?? 0
  const agentsAvailableTotal = analyticsOverview?.agents.available ?? availableAgents
  const overviewPeriodLabel = (() => {
    if (!analyticsOverview?.period) return null
    const start = safeFormatDate(analyticsOverview.period.start_date, 'MMM d')
    const end = safeFormatDate(analyticsOverview.period.end_date, 'MMM d')
    if (!start || !end) return null
    return `${start} – ${end}`
  })()

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='analytics'>Analytics</TabsTrigger>
              <TabsTrigger value='reports'>Reports</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-5'>
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6'>
              <StatCard
                title='Total Contacts'
                value={formatNumber(contactsTotal)}
                description={`${formatNumber(newContactsToday)} new today`}
                icon={Users}
                isLoading={statsLoading || analyticsLoading}
              />
              <StatCard
                title='Active Conversations'
                value={formatNumber(activeConversations)}
                description={`${formatNumber(pendingConversations)} pending`}
                icon={MessageSquare}
                isLoading={statsLoading || analyticsLoading}
              />
              <StatCard
                title='Messages Today'
                value={formatNumber(messagesToday)}
                description={`${formatNumber(inboundToday)} inbound · ${formatNumber(outboundToday)} outbound`}
                icon={MessageSquare}
                isLoading={statsLoading || analyticsLoading}
              />
              <StatCard
                title='Avg Response Time'
                value={formatResponseTime(stats?.avg_response_time)}
                description='SLA target ≤ 5m'
                icon={Clock}
                isLoading={statsLoading}
              />
              <StatCard
                title='Unassigned Queue'
                value={formatNumber(queueUnassigned)}
                description='Waiting for routing'
                icon={AlertCircle}
                isLoading={statsLoading || analyticsLoading}
              />
              <StatCard
                title='Agents Online'
                value={formatNumber(agentsOnlineTotal)}
                description={`${formatNumber(agentsAvailableTotal)} available`}
                icon={Headphones}
                isLoading={statsLoading || analyticsLoading}
              />
            </div>

            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Messaging Flow</CardTitle>
                  <CardDescription>
                    {overviewPeriodLabel ?? 'Last 14 days of WhatsApp volume'}
                  </CardDescription>
                </CardHeader>
                <CardContent className='ps-2'>
                  <Overview />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Queue Health</CardTitle>
                  <CardDescription>Live load by department</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {departmentsLoading ? (
                    <div className='space-y-3'>
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className='h-20 w-full' />
                      ))}
                    </div>
                  ) : (
                    (['viufinder', 'viufinder_xp'] as const).map((key) => {
                      const summary = departmentsSummary?.[key]
                      const label = key === 'viufinder' ? 'Viufinder' : 'Viufinder XP'
                      const contacts = summary?.contacts.total ?? 0
                      const unassigned = summary?.contacts.unassigned ?? 0
                      const online = summary?.agents.online ?? 0
                      const total = summary?.agents.total ?? 0
                      const loadPercent = Math.min(
                        ((online > 0 ? contacts / online : contacts) / TARGET_LOAD) * 100,
                        100
                      )
                      return (
                        <div key={key} className='rounded-xl border bg-card/60 p-3'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='text-sm font-semibold'>{label}</p>
                              <p className='text-xs text-muted-foreground'>
                                {unassigned.toLocaleString()} waiting
                              </p>
                            </div>
                            <span className='text-xs text-muted-foreground'>
                              {online}/{total} agents
                            </span>
                          </div>
                          <div className='mt-3 h-2 w-full rounded-full bg-muted'>
                            <div
                              className='h-2 rounded-full bg-primary'
                              style={{ width: `${loadPercent}%` }}
                            />
                          </div>
                          <div className='mt-2 flex items-baseline justify-between text-sm'>
                            <div>
                              <p className='text-2xl font-semibold'>{contacts.toLocaleString()}</p>
                              <p className='text-xs text-muted-foreground'>contacts</p>
                            </div>
                            <p className='text-xs text-muted-foreground'>Target ≤ {TARGET_LOAD} chats/agent</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Agent Pulse</CardTitle>
                <CardDescription>
                  {agentsLoading
                    ? 'Loading team status…'
                    : `${onlineAgents} online · ${agentsAvailableTotal} available`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agentsLoading ? (
                  <div className='space-y-4'>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className='h-14 w-full' />
                    ))}
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {agentStats?.slice(0, 5).map((agent) => (
                      <div
                        key={agent.id}
                        className='flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3'
                      >
                        <div>
                          <p className='text-sm font-semibold'>
                            {agent.full_name || agent.username}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {agent.department === 'viufinder_xp' ? 'Viufinder XP' : 'Viufinder'}
                          </p>
                        </div>
                        <div className='text-right text-xs text-muted-foreground'>
                          <p className='text-sm font-semibold'>
                            {agent.resolved_today} resolved
                          </p>
                          <p>{Math.round(agent.avg_response_time / 60)}m avg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='analytics' className='space-y-4'>
            <Analytics />
          </TabsContent>
          <TabsContent value='reports' className='space-y-4'>
            <ReportsPanel />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Overview',
    href: '/',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Contacts',
    href: '/contacts',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Chats',
    href: '/chats',
    isActive: false,
    disabled: true,
  },
]
