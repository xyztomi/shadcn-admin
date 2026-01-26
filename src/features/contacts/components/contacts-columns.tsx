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
      <DataTableColumnHeader column={column} title='Phone Number' />
    ),
    cell: ({ row }) => {
      const waId = row.getValue('wa_id') as string
      // Format as phone number: 628xxx -> +62 8xxx
      const formatted = waId ? `+${waId.slice(0, 2)} ${waId.slice(2, 5)}-${waId.slice(5, 9)}-${waId.slice(9)}` : '-'
      return <span className='font-mono text-xs'>{formatted}</span>
    },
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
    accessorKey: 'booth_tag',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Booth' />
    ),
    cell: ({ row }) => {
      const booth = row.getValue('booth_tag') as string | null
      if (!booth) return <span className='text-muted-foreground'>-</span>
      const boothLabels: Record<string, string> = {
        king_padel_kemang: 'King Padel Kemang',
        kyzn_kuningan: 'KYZN Kuningan',
        mr_padel_cipete: 'Mr Padel Cipete',
        other: 'Other',
      }
      return <span className='text-sm'>{boothLabels[booth] || booth}</span>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'tags',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tags' />
    ),
    cell: ({ row }) => {
      const tags = row.original.tags || []
      if (tags.length === 0) return <span className='text-muted-foreground'>-</span>
      return (
        <div className='flex flex-wrap gap-1'>
          {tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag.id}
              variant='secondary'
              className='text-xs px-1.5'
              style={{ backgroundColor: tag.color ? `${tag.color}30` : undefined }}
            >
              <span
                className='h-1.5 w-1.5 rounded-full mr-1'
                style={{ backgroundColor: tag.color || '#6b7280' }}
              />
              {tag.name}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant='outline' className='text-xs px-1'>
              +{tags.length - 2}
            </Badge>
          )}
        </div>
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
