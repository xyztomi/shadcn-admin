import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  MessageSquare,
  Users,
  TrendingUp,
  BarChart3,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Search } from '@/components/search'
import {
  useAnalyticsOverview,
  useMessagesByDate,
  useMessagesByHour,
  useMessagesByType,
  useContactsByDate,
  useAgentPerformance,
  exportAgentPerformance,
  exportOverviewAnalytics,
} from '@/api/analytics'
import { useDepartmentStore, type Department } from '@/stores/department-store'
import { toast } from 'sonner'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

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

// Custom tooltip for charts
interface TooltipEntry {
  name: string
  value: number
  color: string
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className='rounded-lg border bg-background/95 p-3 text-sm shadow-sm backdrop-blur'>
      <p className='font-semibold'>{label}</p>
      {payload.map((entry: TooltipEntry, index: number) => (
        <div key={index} className='flex items-center gap-2'>
          <div
            className='h-2 w-2 rounded-full'
            style={{ backgroundColor: entry.color }}
          />
          <span className='text-muted-foreground'>{entry.name}:</span>
          <span className='font-medium'>{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export function Analytics() {
  const { selectedDepartment, setDepartment } = useDepartmentStore()
  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('14')

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview()
  const { data: messagesByDate, isLoading: messagesLoading } = useMessagesByDate(
    Number(dateRange)
  )
  const { data: messagesByHour, isLoading: hourlyLoading } = useMessagesByHour()
  const { data: messagesByType, isLoading: typesLoading } = useMessagesByType()
  const { data: contactsByDate, isLoading: contactsLoading } = useContactsByDate(
    Number(dateRange)
  )
  const { data: agentPerformance, isLoading: agentsLoading } = useAgentPerformance()

  // Transform messages by date for chart
  const messagesChartData = useMemo(() => {
    return (
      messagesByDate?.map((day) => {
        try {
          const parsed = parseISO(day.date)
          return {
            name: format(parsed, 'MMM d'),
            inbound: day.inbound,
            outbound: day.outbound,
            total: day.total,
          }
        } catch {
          return null
        }
      }).filter(Boolean) ?? []
    )
  }, [messagesByDate])

  // Transform contacts by date for chart
  const contactsChartData = useMemo(() => {
    return (
      contactsByDate?.map((day) => {
        try {
          const parsed = parseISO(day.date)
          return {
            name: format(parsed, 'MMM d'),
            contacts: day.new_contacts,
          }
        } catch {
          return null
        }
      }).filter(Boolean) ?? []
    )
  }, [contactsByDate])

  // Transform hourly data
  const hourlyChartData = useMemo(() => {
    return (
      messagesByHour?.map((h) => ({
        hour: `${h.hour.toString().padStart(2, '0')}:00`,
        count: h.count,
      })) ?? []
    )
  }, [messagesByHour])

  // Transform message types for pie chart
  const typesPieData = useMemo(() => {
    return (
      messagesByType?.map((t, i) => ({
        name: t.type.charAt(0).toUpperCase() + t.type.slice(1),
        value: t.count,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })) ?? []
    )
  }, [messagesByType])

  // Top agents by resolved
  const topAgents = useMemo(() => {
    return [...(agentPerformance ?? [])]
      .sort((a, b) => b.total_resolved - a.total_resolved)
      .slice(0, 5)
  }, [agentPerformance])

  const handleExportOverview = async () => {
    await toast.promise(exportOverviewAnalytics(), {
      loading: 'Preparing download…',
      success: 'Report download started.',
      error: 'Unable to generate report.',
    })
  }

  const handleExportAgents = async () => {
    await toast.promise(exportAgentPerformance(), {
      loading: 'Preparing download…',
      success: 'Report download started.',
      error: 'Unable to generate report.',
    })
  }

  const totalMessages = overview?.messages.total ?? 0
  const totalContacts = overview?.contacts.total ?? 0
  const activeConversations = overview?.conversations.active ?? 0
  const resolvedConversations = overview?.conversations.resolved ?? 0

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
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Analytics</h1>
            <p className='text-sm text-muted-foreground'>
              In-depth metrics and performance insights
            </p>
          </div>
          <div className='flex items-center gap-3'>
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
            <Select
              value={dateRange}
              onValueChange={(value) => setDateRange(value as '7' | '14' | '30')}
            >
              <SelectTrigger className='w-28'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='7'>7 days</SelectItem>
                <SelectItem value='14'>14 days</SelectItem>
                <SelectItem value='30'>30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='outline' size='sm' onClick={handleExportOverview}>
              <Download className='mr-2 h-4 w-4' />
              Export
            </Button>
          </div>
        </div>

        <div className='space-y-6'>
          {/* Key Metrics */}
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <StatCard
              title='Total Messages'
              value={totalMessages.toLocaleString()}
              description='All time'
              icon={MessageSquare}
              isLoading={overviewLoading}
            />
            <StatCard
              title='Total Contacts'
              value={totalContacts.toLocaleString()}
              icon={Users}
              isLoading={overviewLoading}
            />
            <StatCard
              title='Active Conversations'
              value={activeConversations.toLocaleString()}
              icon={TrendingUp}
              isLoading={overviewLoading}
            />
            <StatCard
              title='Resolved'
              value={resolvedConversations.toLocaleString()}
              description='All time'
              icon={BarChart3}
              isLoading={overviewLoading}
            />
          </div>

          {/* Message Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Message Volume</CardTitle>
              <CardDescription>
                Inbound vs outbound messages over the last {dateRange} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <Skeleton className='h-80 w-full' />
              ) : (
                <ResponsiveContainer width='100%' height={320}>
                  <AreaChart data={messagesChartData}>
                    <defs>
                      <linearGradient id='colorInbound' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='var(--chart-2)' stopOpacity={0.6} />
                        <stop offset='95%' stopColor='var(--chart-2)' stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id='colorOutbound' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='var(--chart-1)' stopOpacity={0.6} />
                        <stop offset='95%' stopColor='var(--chart-1)' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' vertical={false} />
                    <XAxis dataKey='name' stroke='var(--muted-foreground)' fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke='var(--muted-foreground)' fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Area type='monotone' dataKey='outbound' name='Outbound' stroke='var(--chart-1)' fill='url(#colorOutbound)' strokeWidth={2} />
                    <Area type='monotone' dataKey='inbound' name='Inbound' stroke='var(--chart-2)' fill='url(#colorInbound)' strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Two column charts */}
          <div className='grid gap-4 lg:grid-cols-2'>
            {/* Hourly Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Activity</CardTitle>
                <CardDescription>Message distribution by hour of day</CardDescription>
              </CardHeader>
              <CardContent>
                {hourlyLoading ? (
                  <Skeleton className='h-64 w-full' />
                ) : (
                  <ResponsiveContainer width='100%' height={260}>
                    <BarChart data={hourlyChartData}>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-muted' vertical={false} />
                      <XAxis dataKey='hour' stroke='var(--muted-foreground)' fontSize={10} tickLine={false} axisLine={false} interval={2} />
                      <YAxis stroke='var(--muted-foreground)' fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey='count' name='Messages' fill='var(--chart-1)' radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Message Types Pie */}
            <Card>
              <CardHeader>
                <CardTitle>Message Types</CardTitle>
                <CardDescription>Distribution by message type</CardDescription>
              </CardHeader>
              <CardContent>
                {typesLoading ? (
                  <Skeleton className='h-64 w-full' />
                ) : typesPieData.length === 0 ? (
                  <div className='flex h-64 items-center justify-center text-sm text-muted-foreground'>
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width='100%' height={260}>
                    <PieChart>
                      <Pie
                        data={typesPieData}
                        cx='50%'
                        cy='50%'
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey='value'
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {typesPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* New Contacts Chart */}
          <Card>
            <CardHeader>
              <CardTitle>New Contacts</CardTitle>
              <CardDescription>
                Daily new contact registrations over the last {dateRange} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contactsLoading ? (
                <Skeleton className='h-64 w-full' />
              ) : (
                <ResponsiveContainer width='100%' height={260}>
                  <BarChart data={contactsChartData}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' vertical={false} />
                    <XAxis dataKey='name' stroke='var(--muted-foreground)' fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke='var(--muted-foreground)' fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey='contacts' name='New Contacts' fill='var(--chart-3)' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Agent Performance */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>Top performing agents by resolved conversations</CardDescription>
              </div>
              <Button variant='outline' size='sm' onClick={handleExportAgents}>
                <Download className='mr-2 h-4 w-4' />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <div className='space-y-3'>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className='h-16 w-full' />
                  ))}
                </div>
              ) : (
                <div className='space-y-3'>
                  {topAgents.map((agent, index) => (
                    <div
                      key={agent.id}
                      className='flex items-center justify-between rounded-lg border p-4'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary'>
                          {index + 1}
                        </div>
                        <div>
                          <p className='font-medium'>{agent.full_name || agent.username}</p>
                          <p className='text-xs text-muted-foreground'>
                            {agent.department === 'viufinder_xp' ? 'Viufinder XP' : 'Viufinder'}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-6 text-sm'>
                        <div className='text-center'>
                          <p className='font-semibold'>{agent.total_resolved.toLocaleString()}</p>
                          <p className='text-xs text-muted-foreground'>Resolved</p>
                        </div>
                        <div className='text-center'>
                          <p className='font-semibold'>{agent.total_messages_sent.toLocaleString()}</p>
                          <p className='text-xs text-muted-foreground'>Messages</p>
                        </div>
                        <div className='text-center'>
                          <p className='font-semibold'>
                            {agent.avg_response_time
                              ? `${Math.round(agent.avg_response_time / 60)}m`
                              : '—'}
                          </p>
                          <p className='text-xs text-muted-foreground'>Avg Response</p>
                        </div>
                        <div className='text-center'>
                          <p className='font-semibold'>
                            {agent.avg_rating ? agent.avg_rating.toFixed(1) : '—'}
                          </p>
                          <p className='text-xs text-muted-foreground'>Rating</p>
                        </div>
                      </div>
                    </div>
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
