import * as React from 'react'
import { AudioWaveform, ChevronsUpDown, Command, GalleryVerticalEnd } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth-store'
import { useDepartmentStore, type Department } from '@/stores/department-store'

const departmentConfig: Record<
  string,
  { name: string; logo: React.ElementType; plan: string }
> = {
  all: {
    name: 'All Departments',
    logo: Command,
    plan: '',
  },
  viufinder: {
    name: 'VIUFinder',
    logo: GalleryVerticalEnd,
    plan: 'Department',
  },
  viufinder_xp: {
    name: 'VIUFinder XP',
    logo: AudioWaveform,
    plan: 'Department',
  },
}

const allTeams: Department[] = ['all', 'viufinder', 'viufinder_xp']

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { auth } = useAuthStore()
  const { selectedDepartment, setDepartment } = useDepartmentStore()
  const department = auth.user?.department
  const role = auth.user?.role

  const canSwitchTeams = role === 'admin' || role === 'superuser'

  // For regular agents, always use their department
  const activeDepartment = canSwitchTeams ? selectedDepartment : (department || 'viufinder')

  // Sync store with agent's department on mount
  React.useEffect(() => {
    if (!canSwitchTeams && department) {
      setDepartment(department as Department)
    }
  }, [canSwitchTeams, department, setDepartment])

  const teamInfo = departmentConfig[activeDepartment] || departmentConfig.viufinder
  const Logo = teamInfo.logo

  // For regular agents, show static display
  if (!canSwitchTeams) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' className='cursor-default'>
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
              <Logo className='size-4' />
            </div>
            <div className='grid flex-1 text-start text-sm leading-tight'>
              <span className='truncate font-semibold'>{teamInfo.name}</span>
              <span className='truncate text-xs'>{teamInfo.plan}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // For admin/superuser, show dropdown to switch departments
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <Logo className='size-4' />
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>{teamInfo.name}</span>
                <span className='truncate text-xs'>{teamInfo.plan}</span>
              </div>
              <ChevronsUpDown className='ms-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-xs text-muted-foreground'>
              Departments
            </DropdownMenuLabel>
            {allTeams.map((teamKey, index) => {
              const team = departmentConfig[teamKey]
              const TeamLogo = team.logo
              return (
                <DropdownMenuItem
                  key={teamKey}
                  onClick={() => setDepartment(teamKey)}
                  className='gap-2 p-2'
                >
                  <div className='flex size-6 items-center justify-center rounded-sm border'>
                    <TeamLogo className='size-4 shrink-0' />
                  </div>
                  {team.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
