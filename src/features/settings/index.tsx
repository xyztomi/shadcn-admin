import { Outlet } from '@tanstack/react-router'
import { Bell, Palette, Clock, Tags, Zap, Link2, ImageIcon } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SidebarNav } from './components/sidebar-nav'

const sidebarNavItems = [
  // Operations group
  {
    title: 'Operations',
    isGroup: true,
  },
  {
    title: 'Shifts',
    href: '/settings',
    icon: <Clock size={18} />,
  },
  {
    title: 'Quick Replies',
    href: '/settings/quick-replies',
    icon: <Zap size={18} />,
  },
  // Content group
  {
    title: 'Content',
    isGroup: true,
  },
  {
    title: 'Tags',
    href: '/settings/tags',
    icon: <Tags size={18} />,
  },
  {
    title: 'Media Assets',
    href: '/settings/media-assets',
    icon: <ImageIcon size={18} />,
  },
  // System group (admin only)
  {
    title: 'System',
    isGroup: true,
    adminOnly: true,
  },
  {
    title: 'Webhook',
    href: '/settings/webhook',
    icon: <Link2 size={18} />,
    adminOnly: true,
  },
  // Preferences group
  {
    title: 'Preferences',
    isGroup: true,
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: <Palette size={18} />,
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: <Bell size={18} />,
  },
]

export function Settings() {
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Settings
          </h1>
          <p className='text-muted-foreground'>
            Manage your account settings and set e-mail preferences.
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className='flex w-full overflow-y-hidden p-1'>
            <Outlet />
          </div>
        </div>
      </Main>
    </>
  )
}
