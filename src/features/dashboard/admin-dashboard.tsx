import { Link } from '@tanstack/react-router'
import {
  MessageSquare,
  Users,
  Headphones,
  CalendarClock,
  ExternalLink,
  TrendingUp,
  Download,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format, parseISO } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useOverviewStats, useAgentStats } from '@/api/stats'
import { useAnalyticsOverview, useDepartmentsSummary, exportOverviewAnalytics } from '@/api/analytics'
import { useDepartmentStore, type Department } from '@/stores/department-store'
import { Overview } from './components/overview'
import { toast } from 'sonner'

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

function safeFormatDate(dateString: string | null | undefined, pattern: string): string | null {
  if (!dateString) return null
  try {
    return format(parseISO(dateString), pattern)
  } catch {
    return null
  }
}

export function AdminDashboard() {
  const { selectedDepartment, setDepartment } = useDepartmentStore()
  const { data: stats, isLoading: statsLoading } = useOverviewStats()
  const { data: agentStats, isLoading: agentsLoading } = useAgentStats()
  const { data: analyticsOverview, isLoading: analyticsLoading } = useAnalyticsOverview()
  const { data: departmentsSummary, isLoading: departmentsLoading } = useDepartmentsSummary()

  const onlineAgents = agentStats?.filter((a) => a.is_online).length ?? 0
  const inShiftAgents = agentStats?.filter((a) => a.is_in_shift).length ?? stats?.agents.in_shift ?? 0
  const contactsTotal = analyticsOverview?.contacts.total ?? stats?.total_contacts ?? 0
  const newContactsToday = analyticsOverview?.contacts.new_today ?? 0
  const activeConversations = analyticsOverview?.conversations.active ?? stats?.active_conversations ?? 0
  const inboundToday = analyticsOverview?.messages.inbound ?? 0
  const outboundToday = analyticsOverview?.messages.outbound ?? 0
  const messagesToday = stats?.messages_today ?? analyticsOverview?.messages.today ?? 0
  const agentsOnlineTotal = stats?.online_agents ?? analyticsOverview?.agents.online ?? 0

  const overviewPeriodLabel = (() => {
    if (!analyticsOverview?.period) return null
    const start = safeFormatDate(analyticsOverview.period.start_date, 'MMM d')
    const end = safeFormatDate(analyticsOverview.period.end_date, 'MMM d')
    if (!start || !end) return null
    return `${start} – ${end}`
  })()

  const handleExport = async () => {
    await toast.promise(exportOverviewAnalytics(), {
      loading: 'Preparing download…',
      success: 'Report download started.',
      error: 'Unable to generate report.',
    })
  }

  const isLoading = statsLoading || analyticsLoading

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
            <p className='text-sm text-muted-foreground'>
              {overviewPeriodLabel ?? 'Overview of your WhatsApp CRM'}
            </p>
          </div>
          <Button variant='outline' size='sm' onClick={handleExport}>
            <Download className='mr-2 h-4 w-4' />
            Export
          </Button>
        </div>

        <div className='space-y-6'>
          {/* Key Metrics */}
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <StatCard
              title='Total Contacts'
              value={formatNumber(contactsTotal)}
              description={`+${formatNumber(newContactsToday)} today`}
              icon={Users}
              isLoading={isLoading}
            />
            <StatCard
              title='Active Chats'
              value={formatNumber(activeConversations)}
              description='Ongoing conversations'
              icon={MessageSquare}
              isLoading={isLoading}
            />
            <StatCard
              title='Messages Today'
              value={formatNumber(messagesToday)}
              description={`${formatNumber(inboundToday)} in · ${formatNumber(outboundToday)} out`}
              icon={TrendingUp}
              isLoading={isLoading}
            />
            <StatCard
              title='Agents Online'
              value={formatNumber(agentsOnlineTotal)}
              description={`${formatNumber(inShiftAgents)} in shift`}
              icon={Headphones}
              isLoading={isLoading}
            />
          </div>

          {/* Charts & Department Load */}
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
            <Card className='col-span-1 lg:col-span-4'>
              <CardHeader className='flex flex-row items-center justify-between'>
                <div>
                  <CardTitle>Message Volume</CardTitle>
                  <CardDescription>Last 14 days activity</CardDescription>
                </div>
                <Select
                  value={selectedDepartment}
                  onValueChange={(value) => setDepartment(value as Department)}
                >
                  <SelectTrigger className='w-35'>
                    <SelectValue placeholder='Department' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='viufinder'>Viufinder</SelectItem>
                    <SelectItem value='viufinder_xp'>Viufinder XP</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className='ps-2'>
                <Overview />
              </CardContent>
            </Card>

            <Card className='col-span-1 lg:col-span-3'>
              <CardHeader>
                <CardTitle>Department Load</CardTitle>
                <CardDescription>Contacts per online agent</CardDescription>
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
                    const online = summary?.agents.online ?? 0
                    const total = summary?.agents.total ?? 0
                    const loadPercent = Math.min(
                      ((online > 0 ? contacts / online : contacts) / TARGET_LOAD) * 100,
                      100
                    )
                    return (
                      <div key={key} className='rounded-xl border bg-card/60 p-3'>
                        <div className='flex items-center justify-between'>
                          <p className='text-sm font-semibold'>{label}</p>
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
                        <p className='mt-2 text-2xl font-semibold'>{contacts.toLocaleString()}</p>
                        <p className='text-xs text-muted-foreground'>contacts</p>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team Status */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle>Team</CardTitle>
                <CardDescription>
                  {agentsLoading ? 'Loading…' : `${onlineAgents} online`}
                </CardDescription>
              </div>
              <Button variant='ghost' size='sm' asChild>
                <Link to='/agents'>View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <div className='space-y-3'>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className='h-14 w-full' />
                  ))}
                </div>
              ) : (
                <div className='space-y-2'>
                  {agentStats?.slice(0, 5).map((agent) => (
                    <Link
                      key={agent.id}
                      to='/dashboard/agents/$agentId'
                      params={{ agentId: String(agent.id) }}
                      className='flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50'
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className={`h-2 w-2 rounded-full ${agent.is_online ? 'bg-green-500' : 'bg-gray-400'}`}
                        />
                        <div>
                          <p className='text-sm font-medium'>
                            {agent.full_name || agent.username}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {agent.department === 'viufinder_xp' ? 'VF XP' : 'VF'}
                            {agent.shift && (
                              <span className='ml-2'>
                                <CalendarClock className='mr-1 inline h-3 w-3' />
                                {agent.is_in_shift ? agent.shift.name : 'Off shift'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right text-xs'>
                          <p className='font-medium'>{agent.resolved_today ?? 0} resolved</p>
                        </div>
                        <ExternalLink className='h-4 w-4 text-muted-foreground' />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
