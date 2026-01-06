import { useMemo } from 'react'
import {
  MessageSquare,
  Users,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  useAnalyticsOverview,
  useContactsByService,
  useAgentPerformance,
  useMessagesByType,
  useDepartmentsSummary,
} from '@/api/analytics'
import { cn } from '@/lib/utils'
import { AnalyticsChart } from './analytics-chart'
import { format, parseISO } from 'date-fns'

const safeFormatDate = (dateString: string | null | undefined, pattern: string): string | null => {
  if (!dateString) return null
  try {
    return format(parseISO(dateString), pattern)
  } catch {
    return null
  }
}

export function Analytics() {
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview()
  const { data: contactsByService, isLoading: contactsLoading } = useContactsByService()
  const { data: agentPerformance, isLoading: agentsLoading } = useAgentPerformance()
  const { data: messagesByType, isLoading: messagesLoading } = useMessagesByType()
  const { data: departmentsSummary, isLoading: departmentsLoading } = useDepartmentsSummary()

  const periodLabel = useMemo(() => {
    if (!overview?.period) return null
    const start = safeFormatDate(overview.period.start_date, 'MMM d')
    const end = safeFormatDate(overview.period.end_date, 'MMM d')
    if (!start || !end) return null
    return `${start} – ${end}`
  }, [overview])

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Message Activity</CardTitle>
          <CardDescription>
            {periodLabel ? `Queue pulse · ${periodLabel}` : 'Daily message trends over time'}
          </CardDescription>
        </CardHeader>
        <CardContent className='px-6'>
          <AnalyticsChart />
        </CardContent>
      </Card>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Messages</CardTitle>
            <MessageSquare className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className='h-8 w-20' />
            ) : (
              <>
                <div className='text-2xl font-bold'>{overview?.messages.total ?? 0}</div>
                <p className='text-xs text-muted-foreground'>
                  {overview?.messages.today ?? 0} today
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Contacts</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className='h-8 w-20' />
            ) : (
              <>
                <div className='text-2xl font-bold'>{overview?.contacts.total ?? 0}</div>
                <p className='text-xs text-muted-foreground'>
                  {overview?.contacts.new_today ?? 0} new today
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Conversations</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className='h-8 w-20' />
            ) : (
              <>
                <div className='text-2xl font-bold'>{overview?.conversations.active ?? 0}</div>
                <p className='text-xs text-muted-foreground'>
                  {overview?.conversations.pending ?? 0} pending
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Agents Online</CardTitle>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className='h-8 w-20' />
            ) : (
              <>
                <div className='text-2xl font-bold'>{overview?.agents.online ?? 0}</div>
                <p className='text-xs text-muted-foreground'>
                  {overview?.agents.available ?? 0} available
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-7'>
        <Card className='col-span-1 xl:col-span-4'>
          <CardHeader>
            <CardTitle>Department Load</CardTitle>
            <CardDescription>Contacts per online agent by service tag</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentsLoading ? (
              <div className='space-y-3'>
                {[1, 2].map((i) => (
                  <Skeleton key={i} className='h-24 w-full' />
                ))}
              </div>
            ) : (
              <div className='grid gap-4 sm:grid-cols-2'>
                {(['viufinder', 'viufinder_xp'] as const).map((key) => {
                  const summary = departmentsSummary?.[key]
                  const label = key === 'viufinder' ? 'Viufinder' : 'Viufinder XP'
                  const contacts = summary?.contacts.total ?? 0
                  const unassigned = summary?.contacts.unassigned ?? 0
                  const onlineAgents = summary?.agents.online ?? 0
                  const totalAgents = summary?.agents.total ?? 0
                  const loadPerAgent = onlineAgents > 0 ? contacts / onlineAgents : contacts
                  const loadPercent = Math.min((loadPerAgent / 6) * 100, 100)
                  const badgeStyle = loadPerAgent > 6 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  return (
                    <div key={key} className='rounded-xl border bg-card/50 p-4'>
                      <div className='flex items-center justify-between gap-2'>
                        <div>
                          <p className='text-sm font-semibold'>{label}</p>
                          <p className='text-xs text-muted-foreground'>{unassigned.toLocaleString()} waiting assignment</p>
                        </div>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', badgeStyle)}>
                          {loadPerAgent.toFixed(1)} chats/agent
                        </span>
                      </div>
                      <div className='mt-3 h-2 w-full rounded-full bg-muted'>
                        <div className='h-full rounded-full bg-primary' style={{ width: `${loadPercent}%` }} />
                      </div>
                      <dl className='mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground'>
                        <div>
                          <p>Contacts</p>
                          <p className='text-base font-semibold text-foreground'>{contacts.toLocaleString()}</p>
                        </div>
                        <div>
                          <p>Agents Online</p>
                          <p className='text-base font-semibold text-foreground'>
                            {onlineAgents}/{totalAgents}
                          </p>
                        </div>
                      </dl>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className='col-span-1 xl:col-span-3'>
          <CardHeader>
            <CardTitle>Message Types</CardTitle>
            <CardDescription>Distribution of message types</CardDescription>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className='space-y-3'>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className='h-12 w-full' />
                ))}
              </div>
            ) : (
              <SimpleBarList
                items={
                  messagesByType?.map((m) => ({
                    name: m.type,
                    value: m.count,
                  })) ?? []
                }
                barClass='bg-primary'
                valueFormatter={(n) => n.toLocaleString()}
                emptyMessage='No message traffic recorded yet.'
              />
            )}
          </CardContent>
        </Card>
        <Card className='col-span-1 xl:col-span-3'>
          <CardHeader>
            <CardTitle>Contacts by Service</CardTitle>
            <CardDescription>Distribution by department</CardDescription>
          </CardHeader>
          <CardContent>
            {contactsLoading ? (
              <div className='space-y-3'>
                {[1, 2].map((i) => (
                  <Skeleton key={i} className='h-12 w-full' />
                ))}
              </div>
            ) : (
              <SimpleBarList
                items={
                  contactsByService?.map((c) => ({
                    name: c.service === 'viufinder_xp' ? 'VF XP' : 'VIUFinder',
                    value: c.count,
                  })) ?? []
                }
                barClass='bg-muted-foreground'
                valueFormatter={(n) => n.toLocaleString()}
                emptyMessage='No contacts synced for this period.'
              />
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>Top performing agents by metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {agentsLoading ? (
            <div className='space-y-4'>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className='h-16 w-full' />
              ))}
            </div>
          ) : (
            <div className='space-y-4'>
              {agentPerformance
                ?.sort((a, b) => b.total_resolved - a.total_resolved)
                .slice(0, 10)
                .map((agent) => (
                  <div
                    key={agent.id}
                    className='flex items-center justify-between gap-4 rounded-lg border p-3'
                  >
                    <div className='flex items-center gap-3'>
                      <div
                        className={`h-2 w-2 rounded-full ${agent.is_online ? 'bg-green-500' : 'bg-gray-300'}`}
                      />
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium'>{agent.full_name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {agent.department === 'viufinder_xp' ? 'Viufinder XP' : 'Viufinder'} ·{' '}
                          {agent.is_available ? 'Available' : 'Busy'}
                        </p>
                      </div>
                      {agent.avg_rating ? (
                        <Badge variant='outline' className='text-[0.65rem]'>
                          {agent.avg_rating.toFixed(1)} ★
                        </Badge>
                      ) : null}
                    </div>
                    <div className='grid grid-cols-4 gap-2 text-center text-sm'>
                      <div>
                        <div className='font-medium'>{agent.active_chats}</div>
                        <div className='text-xs text-muted-foreground'>Active</div>
                      </div>
                      <div>
                        <div className='font-medium'>{agent.total_resolved}</div>
                        <div className='text-xs text-muted-foreground'>Resolved</div>
                      </div>
                      <div>
                        <div className='font-medium'>{agent.total_messages_sent}</div>
                        <div className='text-xs text-muted-foreground'>Messages</div>
                      </div>
                      <div>
                        <div className='font-medium'>
                          {Math.round(agent.avg_response_time / 60)}m
                        </div>
                        <div className='text-xs text-muted-foreground'>Avg Time</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SimpleBarList({
  items,
  valueFormatter,
  barClass,
  emptyMessage,
}: {
  items: { name: string; value: number }[]
  valueFormatter: (n: number) => string
  barClass: string
  emptyMessage?: string
}) {
  if (items.length === 0) {
    return <p className='text-sm text-muted-foreground'>{emptyMessage ?? 'No data available.'}</p>
  }

  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className='space-y-3'>
      {items.map((i) => {
        const width = `${Math.round((i.value / max) * 100)}%`
        return (
          <li key={i.name} className='flex items-center justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='mb-1 truncate text-xs text-muted-foreground'>
                {i.name}
              </div>
              <div className='h-2.5 w-full rounded-full bg-muted'>
                <div
                  className={`h-2.5 rounded-full ${barClass}`}
                  style={{ width }}
                />
              </div>
            </div>
            <div className='ps-2 text-xs font-medium tabular-nums'>
              {valueFormatter(i.value)}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
