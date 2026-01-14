import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Contact } from '../data/schema'
import { ContactsRowActions } from './contacts-row-actions'

// Convert UTC date to Jakarta time (UTC+7)
function toJakartaTime(date: Date): Date {
  const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
}

export const contactsColumns: ColumnDef<Contact>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const name = row.getValue('name') as string | null
      const phone = row.original.phone_number
      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{name || 'Unknown'}</span>
          <span className='text-xs text-muted-foreground'>{phone}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'wa_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='WhatsApp ID' />
    ),
    cell: ({ row }) => (
      <span className='font-mono text-xs'>{row.getValue('wa_id')}</span>
    ),
  },
  {
    accessorKey: 'service_tag',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Service' />
    ),
    cell: ({ row }) => {
      const tag = row.getValue('service_tag') as string | null
      if (!tag) return <span className='text-muted-foreground'>-</span>
      return (
        <Badge variant={tag === 'viufinder' ? 'default' : 'secondary'}>
          {tag === 'viufinder' ? 'VIU Finder' : 'VIU Finder XP'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'unread_count',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Unread' />
    ),
    cell: ({ row }) => {
      const count = row.getValue('unread_count') as number
      return count > 0 ? (
        <Badge variant='destructive'>{count}</Badge>
      ) : (
        <span className='text-muted-foreground'>0</span>
      )
    },
  },
  {
    accessorKey: 'last_message_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Last Message' />
    ),
    cell: ({ row }) => {
      const date = row.getValue('last_message_at') as string | null
      if (!date) return <span className='text-muted-foreground'>-</span>
      const jakartaDate = toJakartaTime(new Date(date))
      return (
        <span className='text-sm'>
          {format(jakartaDate, 'MMM d, HH:mm')}
        </span>
      )
    },
  },
  {
    accessorKey: 'is_active',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean
      return (
        <Badge variant={isActive ? 'outline' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ContactsRowActions row={row} />,
  },
]
