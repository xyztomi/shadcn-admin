import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useUpdateContact } from '@/api/contacts'
import type { ServiceTag, BoothTag } from '@/types/contact'
import { serviceTags, boothTags } from '../data/schema'
import { useContactsContext } from './contacts-provider'

const editContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  notes: z.string().optional(),
  service_tag: z.string().optional(),
  booth_tag: z.string().optional(),
  is_active: z.boolean(),
})

type EditContactForm = z.infer<typeof editContactSchema>

export function EditContactDialog() {
  const { open, setOpen, currentContact, setCurrentContact } = useContactsContext()
  const updateMutation = useUpdateContact()

  const isOpen = open === 'edit'

  const form = useForm<EditContactForm>({
    resolver: zodResolver(editContactSchema),
    defaultValues: {
      name: '',
      notes: '',
      service_tag: '',
      booth_tag: '',
      is_active: true,
    },
  })

  // Reset form when dialog opens with current contact data
  useEffect(() => {
    if (isOpen && currentContact) {
      form.reset({
        name: currentContact.name || '',
        notes: currentContact.notes || '',
        service_tag: currentContact.service_tag || '',
        booth_tag: currentContact.booth_tag || '',
        is_active: currentContact.is_active ?? true,
      })
    }
  }, [isOpen, currentContact, form])

  const handleClose = () => {
    setOpen(null)
    setTimeout(() => setCurrentContact(null), 300)
  }

  const onSubmit = async (data: EditContactForm) => {
    if (!currentContact) return

    try {
      await updateMutation.mutateAsync({
        waId: currentContact.wa_id,
        data: {
          name: data.name,
          notes: data.notes || null,
          service_tag: (data.service_tag || null) as ServiceTag | null,
          booth_tag: (data.booth_tag || null) as BoothTag | null,
          is_active: data.is_active,
        },
      })
      toast.success('Contact updated successfully')
      handleClose()
    } catch {
      toast.error('Failed to update contact')
    }
  }

  if (!currentContact) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update contact information for {currentContact.phone_number}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Contact name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Add notes about this contact...'
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='service_tag'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select service' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='__none__'>No service</SelectItem>
                        {serviceTags.map((tag) => (
                          <SelectItem key={tag.value} value={tag.value}>
                            {tag.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='booth_tag'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booth</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select booth' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='__none__'>No booth</SelectItem>
                        {boothTags.map((tag) => (
                          <SelectItem key={tag.value} value={tag.value}>
                            {tag.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='is_active'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                  <div className='space-y-0.5'>
                    <FormLabel>Active</FormLabel>
                    <p className='text-sm text-muted-foreground'>
                      Inactive contacts won&apos;t appear in the main list
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
