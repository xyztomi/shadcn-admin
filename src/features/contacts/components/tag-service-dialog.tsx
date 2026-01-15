import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useTagContact, useRemoveServiceTag, ServiceTag } from '@/api/contacts'
import { serviceTags } from '../data/schema'
import { useContactsContext } from './contacts-provider'

export function TagServiceDialog() {
  const { open, setOpen, currentContact, setCurrentContact } = useContactsContext()
  const tagMutation = useTagContact()
  const removeMutation = useRemoveServiceTag()

  const isOpen = open === 'tag'

  const handleClose = () => {
    setOpen(null)
    setTimeout(() => setCurrentContact(null), 300)
  }

  const handleTag = async (serviceTag: ServiceTag) => {
    if (!currentContact) return

    await tagMutation.mutateAsync({
      waId: currentContact.wa_id,
      serviceTag,
    })
    toast.success('Service tag updated')
    handleClose()
  }

  const handleRemove = async () => {
    if (!currentContact) return

    await removeMutation.mutateAsync(currentContact.wa_id)
    toast.success('Service tag removed')
    handleClose()
  }

  if (!currentContact) return null

  const isPending = tagMutation.isPending || removeMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Service Tag</DialogTitle>
          <DialogDescription>
            Update service tag for {currentContact.name || currentContact.phone_number}
          </DialogDescription>
        </DialogHeader>

        <Select
          onValueChange={(value) => handleTag(value as ServiceTag)}
          defaultValue={currentContact.service_tag || undefined}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select a service...' />
          </SelectTrigger>
          <SelectContent>
            {serviceTags.map((tag) => (
              <SelectItem key={tag.value} value={tag.value}>
                {tag.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter className='gap-2 sm:gap-0'>
          {currentContact.service_tag && (
            <Button
              variant='destructive'
              onClick={handleRemove}
              disabled={isPending}
            >
              {removeMutation.isPending ? 'Removing...' : 'Remove Tag'}
            </Button>
          )}
          <Button variant='outline' onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
