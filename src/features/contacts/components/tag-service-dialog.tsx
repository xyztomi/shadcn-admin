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
import { useTagContact } from '@/api/contacts'
import { serviceTags } from '../data/schema'
import { useContactsContext } from './contacts-provider'

export function TagServiceDialog() {
  const { open, setOpen, currentContact, setCurrentContact } = useContactsContext()
  const tagMutation = useTagContact()

  const isOpen = open === 'tag'

  const handleClose = () => {
    setOpen(null)
    setTimeout(() => setCurrentContact(null), 300)
  }

  const handleTag = async (serviceTag: string) => {
    if (!currentContact) return

    await tagMutation.mutateAsync({
      waId: currentContact.wa_id,
      serviceTag: serviceTag as 'viufinder' | 'viufinder_xp',
    })
    toast.success('Service tag updated')
    handleClose()
  }

  if (!currentContact) return null

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
          onValueChange={handleTag}
          defaultValue={currentContact.service_tag || undefined}
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

        <DialogFooter>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
