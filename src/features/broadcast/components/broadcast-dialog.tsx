import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateBroadcast, useUpdateBroadcast } from '@/api/broadcast'
import { useTags } from '@/api/tags'
import { Button } from '@/components/ui/button'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Broadcast, Tag } from '@/types'

const broadcastSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  message: z.string().min(1, 'Message is required').max(4096),
  target_type: z.enum(['all_contacts', 'by_tags', 'selected_contacts'] as const),
  tag_ids: z.array(z.number()),
  contact_ids: z.array(z.number()),
})

type BroadcastFormValues = z.infer<typeof broadcastSchema>

interface BroadcastDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  broadcast?: Broadcast | null
}

export function BroadcastDialog({
  open,
  onOpenChange,
  broadcast,
}: BroadcastDialogProps) {
  const { data: tags } = useTags()
  const createMutation = useCreateBroadcast()
  const updateMutation = useUpdateBroadcast()

  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      name: '',
      message: '',
      target_type: 'all_contacts',
      tag_ids: [],
      contact_ids: [],
    },
  })

  const targetType = useWatch({ control: form.control, name: 'target_type' })
  const selectedTagIds = useWatch({ control: form.control, name: 'tag_ids' }) ?? []

  useEffect(() => {
    if (broadcast) {
      form.reset({
        name: broadcast.name,
        message: broadcast.message,
        target_type: broadcast.target_type,
        tag_ids: broadcast.tag_ids,
        contact_ids: broadcast.contact_ids,
      })
    } else {
      form.reset({
        name: '',
        message: '',
        target_type: 'all_contacts',
        tag_ids: [],
        contact_ids: [],
      })
    }
  }, [broadcast, form])

  const onSubmit = async (values: BroadcastFormValues) => {
    try {
      if (broadcast) {
        await updateMutation.mutateAsync({ id: broadcast.id, ...values })
        toast.success('Broadcast updated')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Broadcast created')
      }
      onOpenChange(false)
    } catch {
      toast.error(broadcast ? 'Failed to update broadcast' : 'Failed to create broadcast')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-125'>
        <DialogHeader>
          <DialogTitle>
            {broadcast ? 'Edit Broadcast' : 'New Broadcast'}
          </DialogTitle>
          <DialogDescription>
            {broadcast
              ? 'Update your broadcast message settings'
              : 'Create a new broadcast to send messages to multiple contacts'}
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
                    <Input
                      placeholder='e.g., Weekly Newsletter'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A name to identify this broadcast
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='message'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter your message...'
                      className='min-h-25'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The message to send to all recipients
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='target_type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipients</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select recipients' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='all_contacts'>
                        All Contacts
                      </SelectItem>
                      <SelectItem value='by_tags'>
                        By Tags
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose which contacts should receive this broadcast
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {targetType === 'by_tags' && (
              <FormField
                control={form.control}
                name='tag_ids'
                render={() => (
                  <FormItem>
                    <FormLabel>Select Tags</FormLabel>
                    <FormDescription>
                      Contacts with any of these tags will receive the message
                    </FormDescription>
                    <ScrollArea className='h-37.5 rounded-md border p-2'>
                      {tags?.length ? (
                        tags.map((tag: Tag) => (
                          <FormField
                            key={tag.id}
                            control={form.control}
                            name='tag_ids'
                            render={({ field }) => (
                              <FormItem
                                key={tag.id}
                                className='flex items-center space-x-2 space-y-0 py-1'
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value.includes(tag.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([
                                          ...field.value,
                                          tag.id,
                                        ])
                                      } else {
                                        field.onChange(
                                          field.value.filter(
                                            (id) => id !== tag.id
                                          )
                                        )
                                      }
                                    }}
                                  />
                                </FormControl>
                                <span
                                  className='inline-flex items-center rounded-full px-2 py-1 text-xs'
                                  style={{
                                    backgroundColor: `${tag.color}20`,
                                    color: tag.color,
                                  }}
                                >
                                  {tag.name}
                                </span>
                              </FormItem>
                            )}
                          />
                        ))
                      ) : (
                        <p className='text-sm text-muted-foreground py-4 text-center'>
                          No tags found. Create tags first.
                        </p>
                      )}
                    </ScrollArea>
                    {selectedTagIds.length > 0 && (
                      <p className='text-xs text-muted-foreground'>
                        {selectedTagIds.length} tag(s) selected
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                {broadcast ? 'Update' : 'Create'} Broadcast
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
