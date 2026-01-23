import {
  // Construction,
  LayoutDashboard,
  // Monitor,
  // Bug,
  // ListTodo,
  // FileX,
  // FileText,
  // HelpCircle,
  // Lock,
  Bell,
  Palette,
  // ServerOff,
  Settings,
  // UserX,
  MessagesSquare,
  // ShieldCheck,
  Contact,
  Headphones,
  Radio,
  Clock,
  Tag,
  Zap,
  Bot,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    avatar: '/avatars/shadcn.jpg',
  },
  navGroups: [
    {
      title: 'General',
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
        {
          title: 'Broadcast',
          url: '/broadcast',
          icon: Radio,
        },
        // {
        //   title: 'Tasks',
        //   url: '/tasks',
        //   icon: ListTodo,
        // },
      ],
    },
    {
      title: 'Management',
      roles: ['superuser', 'admin', 'manager'], // Only admin+ can see this group
      items: [
        {
          title: 'Agents',
          url: '/agents',
          icon: Headphones,
          roles: ['superuser', 'admin', 'manager'],
        },
        {
          title: 'Contacts',
          url: '/contacts',
          icon: Contact,
        },
        {
          title: 'Interactive Message',
          url: '/interactive-message',
          icon: Zap,
          roles: ['superuser', 'admin'],
        },
        {
          title: 'Bot Handlers',
          url: '/bot-handlers',
          icon: Bot,
          roles: ['superuser', 'admin'],
        },
      ],
    },
    // {
    //   title: 'Pages',
    //   roles: ['superuser', 'admin'], // Only admin can see dev pages
    //   items: [
    //     {
    //       title: 'Auth',
    //       icon: ShieldCheck,
    //       items: [
    //         {
    //           title: 'Sign In',
    //           url: '/sign-in',
    //         },
    //         {
    //           title: 'Sign In (2 Col)',
    //           url: '/sign-in-2',
    //         },
    //         {
    //           title: 'Sign Up',
    //           url: '/sign-up',
    //         },
    //         {
    //           title: 'Forgot Password',
    //           url: '/forgot-password',
    //         },
    //         {
    //           title: 'OTP',
    //           url: '/otp',
    //         },
    //       ],
    //     },
    //     {
    //       title: 'Errors',
    //       icon: Bug,
    //       items: [
    //         {
    //           title: 'Unauthorized',
    //           url: '/errors/unauthorized',
    //           icon: Lock,
    //         },
    //         {
    //           title: 'Forbidden',
    //           url: '/errors/forbidden',
    //           icon: UserX,
    //         },
    //         {
    //           title: 'Not Found',
    //           url: '/errors/not-found',
    //           icon: FileX,
    //         },
    //         {
    //           title: 'Internal Server Error',
    //           url: '/errors/internal-server-error',
    //           icon: ServerOff,
    //         },
    //         {
    //           title: 'Maintenance Error',
    //           url: '/errors/maintenance-error',
    //           icon: Construction,
    //         },
    //       ],
    //     },
    //   ],
    // },
    {
      title: 'Other',
      roles: ['superuser', 'admin', 'manager'], // Only admin+ can see this group
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
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
        // {
        //   title: 'Help Center',
        //   url: '/help-center',
        //   icon: HelpCircle,
        // },
      ],
    },
  ],
}
