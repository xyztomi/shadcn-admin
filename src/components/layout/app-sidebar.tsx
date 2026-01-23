import { useMemo } from 'react'
import { useLayout } from '@/context/layout-provider'
import { useAuthStore } from '@/stores/auth-store'
import { useUnreadSummary } from '@/api/chat'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { type NavGroup as NavGroupType, type UserRole } from './types'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'

// Filter nav groups and items based on user role
function filterNavByRole(navGroups: NavGroupType[], userRole: UserRole | undefined): NavGroupType[] {
  if (!userRole) return []

  return navGroups
    .filter((group) => {
      // If no roles specified, show to everyone
      if (!group.roles || group.roles.length === 0) return true
      return group.roles.includes(userRole)
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        // If no roles specified, show to everyone
        if (!item.roles || item.roles.length === 0) return true
        return item.roles.includes(userRole)
      }),
    }))
    .filter((group) => group.items.length > 0) // Remove empty groups
}

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { auth } = useAuthStore()
  const userRole = auth.user?.role as UserRole | undefined
  const { data: unreadSummary } = useUnreadSummary()

  // Filter sidebar based on user role
  const filteredNavGroups = useMemo(
    () => filterNavByRole(sidebarData.navGroups, userRole),
    [userRole]
  )

  const navGroupsWithBadges = useMemo(() => {
    const unreadCount = unreadSummary?.contacts_with_unread ?? 0

    return filteredNavGroups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        if (item.title === 'Chats') {
          return {
            ...item,
            badge: unreadCount > 0 ? String(unreadCount) : undefined,
          }
        }
        return item
      }),
    }))
  }, [filteredNavGroups, unreadSummary?.contacts_with_unread])

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher />

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent>
        {navGroupsWithBadges.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
