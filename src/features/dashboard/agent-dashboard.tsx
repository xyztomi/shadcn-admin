import { Link } from '@tanstack/react-router'
import {
  MessageSquare,
  CheckCircle2,
  Send,
  ArrowRight,
  CalendarClock,
  AlertTriangle,
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
import { useMyStats } from '@/api/stats'
import { AnalyticsChart } from './components/analytics-chart'

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

export function AgentDashboard() {
  const { data: stats, isLoading } = useMyStats()

  const departmentLabel =
    stats?.agent.department === 'viufinder_xp' ? 'Viufinder XP' : 'Viufinder'

  const shiftName = stats?.shift?.name ?? 'No shift assigned'
  const isInShift = stats?.is_in_shift ?? false

  return (
    <>
      <Header>
        <div className='flex items-center gap-3'>
          <h1 className='text-lg font-semibold'>Dashboard</h1>
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
          {/* Welcome Header */}
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <h2 className='text-2xl font-bold'>
                {isLoading ? (
                  <Skeleton className='h-8 w-48' />
                ) : (
                  `Welcome, ${stats?.agent.full_name || stats?.agent.username}!`
                )}
              </h2>
              <p className='text-muted-foreground'>
                {departmentLabel} • {shiftName}
              </p>
            </div>
            <Button asChild>
              <Link to='/chats'>
                <MessageSquare className='mr-2 h-4 w-4' />
                Open Chats
                <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </Button>
          </div>

          {/* Out of Shift Warning */}
          {!isInShift && stats?.shift && (
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertTitle>Outside shift hours</AlertTitle>
              <AlertDescription>
                Your shift ({stats.shift.name}) is {stats.shift.start_time} - {stats.shift.end_time}.
                Message sending may be disabled.
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Grid */}
          <div className='grid gap-4 sm:grid-cols-3'>
            <StatCard
              title='Active Chats'
              value={stats?.current.active_conversations ?? 0}
              description='Assigned to you'
              icon={MessageSquare}
              isLoading={isLoading}
            />
            <StatCard
              title='Resolved Today'
              value={stats?.today.resolved ?? 0}
              description={`${stats?.week.resolved ?? 0} this week`}
              icon={CheckCircle2}
              isLoading={isLoading}
            />
            <StatCard
              title='Messages Sent'
              value={stats?.today.messages_sent ?? 0}
              description={`${(stats?.all_time.total_messages_sent ?? 0).toLocaleString()} total`}
              icon={Send}
              isLoading={isLoading}
            />
          </div>

          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Last 7 days messaging volume</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsChart />
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
              <CardDescription>Your all-time stats</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className='h-20 w-full' />
              ) : (
                <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
                  <div className='text-center'>
                    <p className='text-2xl font-bold'>
                      {(stats?.all_time.total_conversations ?? 0).toLocaleString()}
                    </p>
                    <p className='text-sm text-muted-foreground'>Conversations</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-2xl font-bold'>
                      {(stats?.all_time.total_resolved ?? 0).toLocaleString()}
                    </p>
                    <p className='text-sm text-muted-foreground'>Resolved</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-2xl font-bold'>
                      {(stats?.all_time.total_messages_sent ?? 0).toLocaleString()}
                    </p>
                    <p className='text-sm text-muted-foreground'>Messages</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-2xl font-bold'>
                      {stats?.all_time.avg_rating?.toFixed(1) ?? '—'}
                    </p>
                    <p className='text-sm text-muted-foreground'>Rating</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
