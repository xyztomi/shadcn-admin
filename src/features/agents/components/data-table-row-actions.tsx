import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { CircleUser, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { type Agent, useUpdateAgentStatus } from '@/api/agents'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAgentsContext } from './agents-provider'

interface DataTableRowActionsProps {
  row: Row<Agent>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useAgentsContext()
  const updateStatusMutation = useUpdateAgentStatus()

  const handleToggleAvailable = () => {
    updateStatusMutation.mutate({
      agentId: row.original.id,
      data: { is_available: !row.original.is_available },
    })
  }

  const handleToggleOnline = () => {
    updateStatusMutation.mutate({
      agentId: row.original.id,
      data: { is_online: !row.original.is_online },
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-45'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original)
            setOpen('edit')
          }}
        >
          <Edit className='me-2 h-4 w-4' />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleOnline}>
          {row.original.is_online ? (
            <>
              <ToggleLeft className='me-2 h-4 w-4' />
              Set Offline
            </>
          ) : (
            <>
              <ToggleRight className='me-2 h-4 w-4' />
              Set Online
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleToggleAvailable}
          disabled={!row.original.is_online}
        >
          <CircleUser className='me-2 h-4 w-4' />
          {row.original.is_available ? 'Set Busy' : 'Set Available'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original)
            setOpen('delete')
          }}
          className='text-destructive focus:text-destructive'
        >
          <Trash2 className='me-2 h-4 w-4' />
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
