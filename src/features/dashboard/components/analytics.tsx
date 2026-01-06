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
import {
  useAnalyticsOverview,
  useContactsByService,
  useAgentPerformance,
  useMessagesByType,
} from '@/api/analytics'
import { AnalyticsChart } from './analytics-chart'

export function Analytics() {
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview()
  const { data: contactsByService, isLoading: contactsLoading } = useContactsByService()
  const { data: agentPerformance, isLoading: agentsLoading } = useAgentPerformance()
  const { data: messagesByType, isLoading: messagesLoading } = useMessagesByType()

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Message Activity</CardTitle>
          <CardDescription>Daily message trends over time</CardDescription>
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
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
        <Card className='col-span-1 lg:col-span-4'>
          <CardHeader>
            <CardTitle>Referrers</CardTitle>
            <CardDescription>Top sources driving traffic</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={[
                { name: 'Direct', value: 512 },
                { name: 'Product Hunt', value: 238 },
                { name: 'Twitter', value: 174 },
                { name: 'Blog', value: 104 },
              ]}
              barClass='bg-primary'
              valueFormatter={(n) => `${n}`}
            />
          </CardContent>
        </Card>
        <Card className='col-span-1 lg:col-span-3'>
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
                valueFormatter={(n) => `${n}`}
              />
            )}
          </CardContent>
        </Card>
        <Card className='col-span-1 lg:col-span-3'>
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
                valueFormatter={(n) => `${n}`}
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
                          {agent.department === 'viufinder_xp' ? 'VF XP' : 'VIUFinder'}
                        </p>
                      </div>
                    </div>
                    <div className='flex gap-4 text-sm'>
                      <div className='text-center'>
                        <div className='font-medium'>{agent.active_chats}</div>
                        <div className='text-xs text-muted-foreground'>Active</div>
                      </div>
                      <div className='text-center'>
                        <div className='font-medium'>{agent.total_resolved}</div>
                        <div className='text-xs text-muted-foreground'>Resolved</div>
                      </div>
                      <div className='text-center'>
                        <div className='font-medium'>{agent.total_messages_sent}</div>
                        <div className='text-xs text-muted-foreground'>Messages</div>
                      </div>
                      <div className='text-center'>
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
}: {
  items: { name: string; value: number }[]
  valueFormatter: (n: number) => string
  barClass: string
}) {
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
