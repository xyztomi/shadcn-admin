import { type LinkProps } from '@tanstack/react-router'

type User = {
  name: string
  email: string
  avatar: string
}

type Team = {
  name: string
  logo: React.ElementType
  plan: string
}

// Roles that can access a nav item (empty = all roles)
type UserRole = 'superuser' | 'admin' | 'manager' | 'agent'

type BaseNavItem = {
  title: string
  badge?: string
  icon?: React.ElementType
  roles?: UserRole[] // If undefined, accessible to all roles
}

type NavLink = BaseNavItem & {
  url: LinkProps['to'] | (string & {})
  items?: never
}

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['to'] | (string & {}) })[]
  url?: never
}

type NavItem = NavCollapsible | NavLink

type NavGroup = {
  title: string
  items: NavItem[]
  roles?: UserRole[] // If undefined, accessible to all roles
}

type SidebarData = {
  user: User
  teams: Team[]
  navGroups: NavGroup[]
}

export type {
  SidebarData,
  NavGroup,
  NavItem,
  NavCollapsible,
  NavLink,
  UserRole,
}
