import {
  LayoutDashboard,
  Bell,
  Palette,
  MessagesSquare,
  Contact,
  Headphones,
  Radio,
  Clock,
  Tag,
  Zap,
  Bot,
  ImageIcon,
  Link2,
  Megaphone,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    avatar: '/avatars/shadcn.jpg',
  },
  navGroups: [
    {
      title: 'Main',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Chats',
          url: '/chats',
          icon: MessagesSquare,
        },
      ],
    },
    {
      title: 'Outreach',
      roles: ['superuser', 'admin'],
      items: [
        {
          title: 'Broadcast',
          url: '/broadcast',
          icon: Radio,
        },
        {
          title: 'Interactive',
          url: '/interactive-message',
          icon: Megaphone,
        },
      ],
    },
    {
      title: 'Directory',
      roles: ['superuser', 'admin', 'manager'],
      items: [
        {
          title: 'Contacts',
          url: '/contacts',
          icon: Contact,
        },
        {
          title: 'Agents',
          url: '/agents',
          icon: Headphones,
        },
      ],
    },
    {
      title: 'Configuration',
      roles: ['superuser', 'admin'],
      items: [
        {
          title: 'Bot Handlers',
          url: '/bot-handlers',
          icon: Bot,
        },
        {
          title: 'Shifts',
          url: '/settings',
          icon: Clock,
        },
        {
          title: 'Tags',
          url: '/settings/tags',
          icon: Tag,
        },
        {
          title: 'Quick Replies',
          url: '/settings/quick-replies',
          icon: Zap,
        },
        {
          title: 'Media Assets',
          url: '/settings/media-assets',
          icon: ImageIcon,
        },
        {
          title: 'Webhook',
          url: '/settings/webhook',
          icon: Link2,
          roles: ['superuser', 'admin'],
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          title: 'Appearance',
          url: '/settings/appearance',
          icon: Palette,
        },
        {
          title: 'Notifications',
          url: '/settings/notifications',
          icon: Bell,
        },
      ],
    },
  ],
}
