import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeleteContact } from '@/api/contacts'
import { useContactsContext } from './contacts-provider'

export function DeleteContactDialog() {
  const { open, setOpen, currentContact, setCurrentContact } = useContactsContext()
  const deleteMutation = useDeleteContact()

  const isOpen = open === 'delete'

  const handleClose = () => {
    setOpen(null)
    setTimeout(() => setCurrentContact(null), 300)
  }

  const handleConfirm = async () => {
    if (!currentContact) return

    try {
      await deleteMutation.mutateAsync(currentContact.wa_id)
      toast.success('Contact deleted successfully')
      handleClose()
    } catch {
      toast.error('Failed to delete contact')
    }
  }

  if (!currentContact) return null

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={handleClose}
      title='Delete Contact'
      desc={
        <>
          Are you sure you want to delete{' '}
          <strong>{currentContact.name || currentContact.phone_number}</strong>?
          <br />
          <br />
          <span className='text-destructive'>
            This will permanently delete the contact and all their chat history.
            This action cannot be undone.
          </span>
        </>
      }
      confirmText='Delete Contact'
      destructive
      handleConfirm={handleConfirm}
      isLoading={deleteMutation.isPending}
    />
  )
}
