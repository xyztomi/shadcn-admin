import { Link } from '@tanstack/react-router'
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Star,
  Send,
  Users,
  ArrowRight,
  CalendarClock,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import type { MyStats } from '@/api/stats'
import { AnalyticsChart } from './components/analytics-chart'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
  variant = 'default',
}: {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  isLoading?: boolean
  variant?: 'default' | 'success' | 'warning'
}) {
  const variantStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-500',
    warning: 'text-amber-500',
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className={`h-4 w-4 ${variantStyles[variant]}`} />
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

function formatResponseTime(seconds?: number | null): string {
  if (!seconds) return '—'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  if (minutes === 0) return `${remainingSeconds}s`
  if (remainingSeconds === 0) return `${minutes}m`
  return `${minutes}m ${remainingSeconds}s`
}

interface AgentDashboardViewProps {
  stats: MyStats | undefined
  isLoading: boolean
  isAdminView?: boolean
  agentId?: number | string
}

export function AgentDashboardView({
  stats,
  isLoading,
  isAdminView = false,
  agentId,
}: AgentDashboardViewProps) {
  const departmentLabel =
    stats?.agent.department === 'viufinder_xp' ? 'Viufinder XP' : 'Viufinder'

  // Shift status
  const shiftName = stats?.shift?.name ?? 'No shift assigned'
  const isInShift = stats?.is_in_shift ?? false
  const currentActiveShift = stats?.current_active_shift

  return (
    <>
      <Header>
        <div className='flex items-center gap-3'>
          {isAdminView && (
            <Button variant='ghost' size='sm' asChild>
              <Link to='/dashboard/admin'>
                <ArrowLeft className='mr-1 h-4 w-4' />
                Back
              </Link>
            </Button>
          )}
          <h1 className='text-lg font-semibold'>
            {isAdminView ? `Agent Dashboard: ${stats?.agent.full_name || stats?.agent.username || 'Loading...'}` : 'Dashboard'}
          </h1>
          {stats && (
            <>
              <Badge variant={stats.agent.is_online ? 'default' : 'secondary'}>
                {stats.agent.is_online ? 'Online' : 'Offline'}
              </Badge>
              {stats.shift && (
                <Badge variant={isInShift ? 'default' : 'outline'}>
                  <CalendarClock className='mr-1 h-3 w-3' />
                  {stats.shift.name}
                </Badge>
              )}
            </>
          )}
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='space-y-6'>
          {/* Welcome & Availability */}
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <h2 className='text-2xl font-bold'>
                {isLoading ? (
                  <Skeleton className='h-8 w-48' />
                ) : isAdminView ? (
                  `${stats?.agent.full_name || stats?.agent.username}'s Dashboard`
                ) : (
                  `Welcome back, ${stats?.agent.full_name || stats?.agent.username}!`
                )}
              </h2>
              <p className='text-muted-foreground'>
                {departmentLabel} • {shiftName} • {isAdminView ? 'Performance overview' : 'Here\'s your performance today'}
              </p>
            </div>
            <div className='flex flex-wrap gap-4'>
              {/* Shift Status Card */}
              <Card className='flex items-center gap-4 p-4'>
                <CalendarClock className='h-8 w-8 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>
                    {isInShift ? 'In Shift' : 'Off Shift'}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {stats?.shift ? (
                      <>
                        {stats.shift.start_time} - {stats.shift.end_time}
                      </>
                    ) : currentActiveShift ? (
                      <>Currently active: {currentActiveShift.name}</>
                    ) : (
                      'No shift assigned'
                    )}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Out of Shift Warning */}
          {!isInShift && stats?.shift && (
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertTitle>{isAdminView ? 'Agent is outside shift hours' : 'You are outside your shift hours'}</AlertTitle>
              <AlertDescription>
                {isAdminView ? 'This agent\'s' : 'Your'} shift ({stats.shift.name}) is from {stats.shift.start_time} to {stats.shift.end_time}.
                {!isAdminView && ' Message sending is disabled until your shift begins.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Today's Stats */}
          <div>
            <h3 className='mb-3 text-lg font-semibold'>Today</h3>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <StatCard
                title='Active Conversations'
                value={stats?.current.active_conversations ?? 0}
                description={isAdminView ? 'Currently assigned' : 'Currently assigned to you'}
                icon={MessageSquare}
                isLoading={isLoading}
              />
              <StatCard
                title='Resolved Today'
                value={stats?.today.resolved ?? 0}
                description={`${stats?.today.conversations ?? 0} total conversations`}
                icon={CheckCircle2}
                isLoading={isLoading}
                variant='success'
              />
              <StatCard
                title='Messages Sent'
                value={stats?.today.messages_sent ?? 0}
                description='Outbound messages today'
                icon={Send}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Weekly Performance */}
          <div className='grid gap-6 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>This Week</CardTitle>
                <CardDescription>{isAdminView ? 'Agent\'s performance over the last 7 days' : 'Your performance over the last 7 days'}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className='space-y-4'>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className='h-16 w-full' />
                    ))}
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between rounded-lg border p-4'>
                      <div className='flex items-center gap-3'>
                        <MessageSquare className='h-5 w-5 text-muted-foreground' />
                        <div>
                          <p className='font-medium'>Conversations</p>
                          <p className='text-sm text-muted-foreground'>
                            Total handled this week
                          </p>
                        </div>
                      </div>
                      <p className='text-2xl font-bold'>
                        {stats?.week.conversations ?? 0}
                      </p>
                    </div>
                    <div className='flex items-center justify-between rounded-lg border p-4'>
                      <div className='flex items-center gap-3'>
                        <CheckCircle2 className='h-5 w-5 text-green-500' />
                        <div>
                          <p className='font-medium'>Resolved</p>
                          <p className='text-sm text-muted-foreground'>
                            Successfully closed
                          </p>
                        </div>
                      </div>
                      <p className='text-2xl font-bold'>{stats?.week.resolved ?? 0}</p>
                    </div>
                    <div className='flex items-center justify-between rounded-lg border p-4'>
                      <div className='flex items-center gap-3'>
                        <Clock className='h-5 w-5 text-muted-foreground' />
                        <div>
                          <p className='font-medium'>Avg Response Time</p>
                          <p className='text-sm text-muted-foreground'>
                            Time to first reply
                          </p>
                        </div>
                      </div>
                      <p className='text-2xl font-bold'>
                        {formatResponseTime(stats?.week.avg_response_time)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All-Time Stats</CardTitle>
                <CardDescription>{isAdminView ? 'Agent\'s lifetime performance' : 'Your lifetime performance'}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className='space-y-4'>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className='h-12 w-full' />
                    ))}
                  </div>
                ) : (
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='rounded-lg bg-muted/50 p-4 text-center'>
                      <p className='text-3xl font-bold'>
                        {(stats?.all_time.total_conversations ?? 0).toLocaleString()}
                      </p>
                      <p className='text-sm text-muted-foreground'>Conversations</p>
                    </div>
                    <div className='rounded-lg bg-muted/50 p-4 text-center'>
                      <p className='text-3xl font-bold'>
                        {(stats?.all_time.total_resolved ?? 0).toLocaleString()}
                      </p>
                      <p className='text-sm text-muted-foreground'>Resolved</p>
                    </div>
                    <div className='rounded-lg bg-muted/50 p-4 text-center'>
                      <p className='text-3xl font-bold'>
                        {(stats?.all_time.total_messages_sent ?? 0).toLocaleString()}
                      </p>
                      <p className='text-sm text-muted-foreground'>Messages Sent</p>
                    </div>
                    <div className='rounded-lg bg-muted/50 p-4 text-center'>
                      <div className='flex items-center justify-center gap-1'>
                        <p className='text-3xl font-bold'>
                          {stats?.all_time.avg_rating?.toFixed(1) ?? '—'}
                        </p>
                        {stats?.all_time.avg_rating && (
                          <Star className='h-5 w-5 fill-amber-400 text-amber-400' />
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground'>Avg Rating</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Message Activity</CardTitle>
              <CardDescription>Last 7 days messaging volume</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsChart agentId={agentId} />
            </CardContent>
          </Card>

          {/* Quick Actions - only show for personal dashboard */}
          {!isAdminView && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-3'>
                  <Button asChild>
                    <Link to='/chats'>
                      <MessageSquare className='mr-2 h-4 w-4' />
                      Open Chats
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Link>
                  </Button>
                  <Button variant='outline' asChild>
                    <Link to='/contacts'>
                      <Users className='mr-2 h-4 w-4' />
                      View Contacts
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Main>
    </>
  )
}
