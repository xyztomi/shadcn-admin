import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useQuickReplies,
  useQuickReplyCategories,
  useCreateQuickReply,
  useUpdateQuickReply,
  useDeleteQuickReply,
} from '@/api/quick-replies'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { QuickReply } from '@/types'

const quickReplySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  shortcut: z
    .string()
    .max(20, 'Shortcut too long')
    .regex(/^[a-zA-Z0-9]*$/, 'Only letters and numbers allowed')
    .optional()
    .or(z.literal('')),
  category: z.string().max(50).optional().or(z.literal('')),
  is_shared: z.boolean(),
})

type QuickReplyFormValues = z.infer<typeof quickReplySchema>

export function QuickRepliesSettings() {
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null)
  const [deletingReply, setDeletingReply] = useState<QuickReply | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: quickReplies, isLoading } = useQuickReplies(
    selectedCategory ? { category: selectedCategory } : undefined
  )
  const { data: categories = [] } = useQuickReplyCategories()
  const createReply = useCreateQuickReply()
  const updateReply = useUpdateQuickReply()
  const deleteReply = useDeleteQuickReply()

  const form = useForm<QuickReplyFormValues>({
    resolver: zodResolver(quickReplySchema),
    defaultValues: {
      title: '',
      content: '',
      shortcut: '',
      category: '',
      is_shared: true,
    },
  })

  const handleCreate = () => {
    form.reset({
      title: '',
      content: '',
      shortcut: '',
      category: '',
      is_shared: true,
    })
    setIsCreateOpen(true)
  }

  const handleEdit = (reply: QuickReply) => {
    form.reset({
      title: reply.title,
      content: reply.content,
      shortcut: reply.shortcut?.replace('/', '') || '',
      category: reply.category || '',
      is_shared: true,
    })
    setEditingReply(reply)
  }

  const onSubmit = async (data: QuickReplyFormValues) => {
    try {
      const payload = {
        title: data.title,
        content: data.content,
        shortcut: data.shortcut || undefined,
        category: data.category || undefined,
        is_shared: data.is_shared,
      }

      if (editingReply) {
        await updateReply.mutateAsync({ id: editingReply.id, ...payload })
        toast.success('Quick reply updated')
        setEditingReply(null)
      } else {
        await createReply.mutateAsync(payload)
        toast.success('Quick reply created')
        setIsCreateOpen(false)
      }
      form.reset()
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deletingReply) return
    try {
      await deleteReply.mutateAsync(deletingReply.id)
      toast.success('Quick reply deleted')
      setDeletingReply(null)
    } catch {
      toast.error('Failed to delete quick reply')
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Quick Replies</h3>
        <p className='text-sm text-muted-foreground'>
          Create pre-written messages to respond faster in chats. Press{' '}
          <kbd className='rounded bg-muted px-1 py-0.5 text-xs'>/</kbd> in the
          message field to use them.
        </p>
      </div>
      <Separator />

      <div className='flex flex-wrap items-center gap-4'>
        {/* Category filter */}
        <div className='flex gap-1'>
          <Badge
            variant={selectedCategory === null ? 'default' : 'outline'}
            className='cursor-pointer'
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Badge>
          {categories.map((cat: string) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className='cursor-pointer'
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>

        <div className='ms-auto'>
          <Button onClick={handleCreate}>
            <Plus className='mr-2 h-4 w-4' />
            New Quick Reply
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-24 w-full' />
          ))}
        </div>
      ) : !quickReplies?.length ? (
        <Card>
          <CardContent className='py-8 text-center text-muted-foreground'>
            <Zap className='mx-auto mb-4 h-12 w-12 opacity-50' />
            <p>No quick replies yet.</p>
            <p className='text-sm'>
              Create your first quick reply to speed up conversations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {quickReplies.map((reply) => (
            <Card key={reply.id}>
              <CardHeader className='pb-2'>
                <div className='flex items-start justify-between'>
                  <div>
                    <CardTitle className='text-base'>{reply.title}</CardTitle>
                    <div className='flex items-center gap-2 mt-1'>
                      {reply.shortcut && (
                        <Badge variant='secondary' className='text-xs'>
                          {reply.shortcut}
                        </Badge>
                      )}
                      {reply.category && (
                        <Badge variant='outline' className='text-xs'>
                          {reply.category}
                        </Badge>
                      )}
                      <span className='text-xs text-muted-foreground'>
                        Used {reply.usage_count ?? 0}x
                      </span>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => handleEdit(reply)}
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      className='text-destructive hover:text-destructive'
                      onClick={() => setDeletingReply(reply)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className='whitespace-pre-wrap'>
                  {reply.content}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editingReply}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingReply(null)
          }
        }}
      >
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {editingReply ? 'Edit Quick Reply' : 'Create Quick Reply'}
            </DialogTitle>
            <DialogDescription>
              {editingReply
                ? 'Update the quick reply details.'
                : 'Create a pre-written message for quick responses.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Greeting' {...field} />
                    </FormControl>
                    <FormDescription>
                      A short name to identify this reply
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='content'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Hello! Thank you for reaching out...'
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The message that will be inserted in the chat
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='shortcut'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shortcut (optional)</FormLabel>
                      <FormControl>
                        <div className='flex items-center'>
                          <span className='rounded-l-md border border-r-0 bg-muted px-3 py-2 text-sm text-muted-foreground'>
                            /
                          </span>
                          <Input
                            placeholder='hi'
                            className='rounded-l-none'
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Type /shortcut to quickly insert
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='category'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (optional)</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select or type new' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=''>None</SelectItem>
                            {categories.map((cat: string) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>Group related replies</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsCreateOpen(false)
                    setEditingReply(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={createReply.isPending || updateReply.isPending}
                >
                  {(createReply.isPending || updateReply.isPending) && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {editingReply ? 'Save Changes' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingReply} onOpenChange={() => setDeletingReply(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quick Reply</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingReply?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeletingReply(null)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={deleteReply.isPending}
            >
              {deleteReply.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
