import { useState, type JSX } from 'react'
import { useLocation, useNavigate, Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrentAgent } from '@/api/auth'

type NavItem = {
  href?: string
  title: string
  icon?: JSX.Element
  isGroup?: boolean
  adminOnly?: boolean
}

type SidebarNavProps = React.HTMLAttributes<HTMLElement> & {
  items: NavItem[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [val, setVal] = useState(pathname ?? '/settings')
  const { data: currentAgent } = useCurrentAgent()

  const isAdmin = currentAgent?.role === 'superuser' || currentAgent?.role === 'admin'

  // Filter items based on role
  const filteredItems = items.filter(item => {
    if (item.adminOnly && !isAdmin) return false
    return true
  })

  // Get only link items for mobile select
  const linkItems = filteredItems.filter(item => item.href)

  const handleSelect = (e: string) => {
    setVal(e)
    navigate({ to: e })
  }

  return (
    <>
      <div className='p-1 md:hidden'>
        <Select value={val} onValueChange={handleSelect}>
          <SelectTrigger className='h-12 sm:w-48'>
            <SelectValue placeholder='Theme' />
          </SelectTrigger>
          <SelectContent>
            {linkItems.map((item) => (
              <SelectItem key={item.href} value={item.href!}>
                <div className='flex gap-x-4 px-2 py-1'>
                  <span className='scale-125'>{item.icon}</span>
                  <span className='text-md'>{item.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea
        orientation='horizontal'
        type='always'
        className='hidden w-full min-w-40 bg-background px-1 py-2 md:block'
      >
        <nav
          className={cn(
            'flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0',
            className
          )}
          {...props}
        >
          {filteredItems.map((item, index) =>
            item.isGroup ? (
              <div
                key={`group-${item.title}`}
                className={cn(
                  'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                  index > 0 && 'mt-4'
                )}
              >
                {item.title}
              </div>
            ) : (
              <Link
                key={item.href}
                to={item.href!}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  pathname === item.href
                    ? 'bg-muted hover:bg-accent'
                    : 'hover:bg-accent hover:underline',
                  'justify-start'
                )}
              >
                <span className='me-2'>{item.icon}</span>
                {item.title}
              </Link>
            )
          )}
        </nav>
      </ScrollArea>
    </>
  )
}
