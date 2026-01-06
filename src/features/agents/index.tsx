import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useAgents } from '@/api/agents'
import { AgentsDialogs } from './components/agents-dialogs'
import { AgentsPrimaryButtons } from './components/agents-primary-buttons'
import { AgentsProvider } from './components/agents-provider'
import { AgentsTable } from './components/agents-table'

const route = getRouteApi('/_authenticated/agents/')

export function Agents() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data: agents = [], isLoading } = useAgents()

  return (
    <AgentsProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Agents</h2>
            <p className='text-muted-foreground'>
              Manage customer service agents and their availability.
            </p>
          </div>
          <AgentsPrimaryButtons />
        </div>
        <AgentsTable data={agents} search={search} navigate={navigate} isLoading={isLoading} />
      </Main>

      <AgentsDialogs />
    </AgentsProvider>
  )
}
