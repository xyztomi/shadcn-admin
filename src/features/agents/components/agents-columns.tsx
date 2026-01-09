import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Agent } from '@/api/agents'
import { DataTableRowActions } from './data-table-row-actions'

export const departmentColors: Record<string, string> = {
  viufinder: 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200',
  viufinder_xp: 'bg-violet-100/30 text-violet-900 dark:text-violet-200 border-violet-200',
}

export const roleColors: Record<string, string> = {
  admin: 'bg-red-100/30 text-red-900 dark:text-red-200 border-red-200',
  manager: 'bg-amber-100/30 text-amber-900 dark:text-amber-200 border-amber-200',
  agent: 'bg-blue-100/30 text-blue-900 dark:text-blue-200 border-blue-200',
}

export const shiftColors: Record<string, string> = {
  morning: 'bg-orange-100/30 text-orange-900 dark:text-orange-200 border-orange-200',
  noon: 'bg-sky-100/30 text-sky-900 dark:text-sky-200 border-sky-200',
}

export const agentsColumns: ColumnDef<Agent>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-0.5'
      />
    ),
    meta: {
      className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-0.5'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'username',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Username' />
    ),
    cell: ({ row }) => (
      <div className='max-w-36 truncate ps-3 font-medium'>{row.getValue('username')}</div>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'full_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => <div className='max-w-36 truncate'>{row.getValue('full_name')}</div>,
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>{row.getValue('email') || '-'}</div>
    ),
  },
  {
    accessorKey: 'department',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Department' />
    ),
    cell: ({ row }) => {
      const department = row.getValue<string>('department')
      const badgeColor = departmentColors[department] ?? ''
      return (
        <Badge variant='outline' className={cn('capitalize', badgeColor)}>
          {department === 'viufinder_xp' ? 'VF XP' : department}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const role = row.getValue<string>('role')
      const badgeColor = roleColors[role] ?? ''
      return (
        <Badge variant='outline' className={cn('capitalize', badgeColor)}>
          {role}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'shift_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Shift' />
    ),
    cell: ({ row }) => {
      const shiftName = row.getValue<string | null>('shift_name')
      if (!shiftName) {
        return <span className='text-muted-foreground'>—</span>
      }
      const badgeColor = shiftColors[shiftName.toLowerCase()] ?? 'bg-gray-100/30 text-gray-900 dark:text-gray-200 border-gray-200'
      return (
        <Badge variant='outline' className={cn('capitalize', badgeColor)}>
          {shiftName}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const shiftName = row.getValue<string | null>(id)
      if (!shiftName) return value.includes('unassigned')
      return value.includes(shiftName.toLowerCase())
    },
  },
  {
    id: 'status',
    accessorFn: (row) => {
      if (!row.is_online) return 'offline'
      if (row.is_available) return 'available'
      return 'online'
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const { is_online, is_available } = row.original
      return (
        <div className='flex items-center gap-2'>
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              is_online ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
          <span className='text-sm'>
            {is_online ? (is_available ? 'Available' : 'Busy') : 'Offline'}
          </span>
        </div>
      )
    },
    filterFn: (row, _id, value) => {
      const { is_online, is_available } = row.original
      if (value.includes('online') && is_online) return true
      if (value.includes('offline') && !is_online) return true
      if (value.includes('available') && is_available) return true
      return false
    },
  },
  {
    id: 'workload',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Workload' />
    ),
    cell: ({ row }) => {
      const { active_chats, max_chats } = row.original
      const maxLabel = max_chats === 0 ? '∞' : max_chats
      const percentage = max_chats > 0 ? Math.round((active_chats / max_chats) * 100) : 0
      return (
        <div className='flex items-center gap-2'>
          <span className='text-sm'>
            {active_chats} / {maxLabel}
          </span>
          {max_chats > 0 && (
            <div className='h-2 w-16 rounded-full bg-muted'>
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-green-500'
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          )}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
    meta: {
      className: 'sticky end-0 z-10 bg-card/95 backdrop-blur-xs supports-[backdrop-filter]:bg-card/60',
    },
  },
]
