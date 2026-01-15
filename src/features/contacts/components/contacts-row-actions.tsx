import { type Row } from '@tanstack/react-table'
import { useNavigate } from '@tanstack/react-router'
import { MoreHorizontal, MessageSquare, UserPlus, Tag, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Contact } from '../data/schema'
import { useContactsContext } from './contacts-provider'
import { useAuthStore } from '@/stores/auth-store'

interface ContactsRowActionsProps {
  row: Row<Contact>
}

export function ContactsRowActions({ row }: ContactsRowActionsProps) {
  const navigate = useNavigate()
  const { setOpen, setCurrentContact } = useContactsContext()
  const currentUser = useAuthStore((state) => state.auth.user)
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superuser'

  const handleOpenChat = () => {
    navigate({ to: '/chats', search: { wa_id: row.original.wa_id } })
  }

  const handleAssign = () => {
    setCurrentContact(row.original)
    setOpen('assign')
  }

  const handleTag = () => {
    setCurrentContact(row.original)
    setOpen('tag')
  }

  const handleEdit = () => {
    setCurrentContact(row.original)
    setOpen('edit')
  }

  const handleDelete = () => {
    setCurrentContact(row.original)
    setOpen('delete')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Open menu</span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={handleOpenChat}>
          <MessageSquare className='mr-2 h-4 w-4' />
          Open Chat
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleAssign}>
          <UserPlus className='mr-2 h-4 w-4' />
          Assign Agent
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTag}>
          <Tag className='mr-2 h-4 w-4' />
          Change Service Tag
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className='mr-2 h-4 w-4' />
          Edit Contact
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className='text-destructive focus:text-destructive'
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete Contact
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
