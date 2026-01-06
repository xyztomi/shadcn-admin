import {
  MessageSquare,
  Users,
  UserCheck,
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
import { Analytics } from './components/analytics'
import { Overview } from './components/overview'

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

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useOverviewStats()
  const { data: agentStats, isLoading: agentsLoading } = useAgentStats()

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
              <TabsTrigger value='reports' disabled>
                Reports
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
              <StatCard
                title='Total Contacts'
                value={stats?.total_contacts ?? 0}
                icon={Users}
                isLoading={statsLoading}
              />
              <StatCard
                title='Active Conversations'
                value={stats?.active_conversations ?? 0}
                icon={MessageSquare}
                isLoading={statsLoading}
              />
              <StatCard
                title='Messages Today'
                value={stats?.messages_today ?? 0}
                icon={MessageSquare}
                isLoading={statsLoading}
              />
              <StatCard
                title='Avg Response Time'
                value={stats ? `${Math.round(stats.avg_response_time / 60)}m` : '0m'}
                icon={Clock}
                isLoading={statsLoading}
              />
              <StatCard
                title='Unassigned'
                value={stats?.unassigned_contacts ?? 0}
                description='Contacts waiting'
                icon={AlertCircle}
                isLoading={statsLoading}
              />
              <StatCard
                title='Agents Online'
                value={stats?.online_agents ?? 0}
                icon={Headphones}
                isLoading={statsLoading}
              />
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className='ps-2'>
                  <Overview />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Agent Performance</CardTitle>
                  <CardDescription>
                    {agentsLoading
                      ? 'Loading...'
                      : `${agentStats?.filter((a) => a.is_online).length ?? 0} agents online`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {agentsLoading ? (
                    <div className='space-y-4'>
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className='h-12 w-full' />
                      ))}
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {agentStats?.slice(0, 5).map((agent) => (
                        <div key={agent.id} className='flex items-center'>
                          <div className='flex items-center gap-2'>
                            <div
                              className={`h-2 w-2 rounded-full ${agent.is_online ? 'bg-green-500' : 'bg-gray-300'}`}
                            />
                            <UserCheck className='h-4 w-4 text-muted-foreground' />
                          </div>
                          <div className='ms-4 space-y-1'>
                            <p className='text-sm font-medium leading-none'>
                              {agent.full_name || agent.username}
                            </p>
                            <p className='text-sm text-muted-foreground'>
                              {agent.active_chats} active · {agent.resolved_today} resolved today
                            </p>
                          </div>
                          <div className='ms-auto text-sm text-muted-foreground'>
                            {agent.department}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value='analytics' className='space-y-4'>
            <Analytics />
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
