import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from '@/api/tags'
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { TagWithCount } from '@/types'

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6366f1', // indigo (default)
]

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
  description: z.string().max(255).optional(),
})

type TagFormValues = z.infer<typeof tagSchema>

export function TagsSettings() {
  const [editingTag, setEditingTag] = useState<TagWithCount | null>(null)
  const [deletingTag, setDeletingTag] = useState<TagWithCount | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: tags, isLoading } = useTags()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      color: TAG_COLORS[8],
      description: '',
    },
  })

  const handleCreate = () => {
    form.reset({
      name: '',
      color: TAG_COLORS[8],
      description: '',
    })
    setIsCreateOpen(true)
  }

  const handleEdit = (tag: TagWithCount) => {
    form.reset({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
    })
    setEditingTag(tag)
  }

  const onSubmit = async (data: TagFormValues) => {
    try {
      if (editingTag) {
        await updateTag.mutateAsync({ id: editingTag.id, ...data })
        toast.success('Tag updated')
        setEditingTag(null)
      } else {
        await createTag.mutateAsync(data)
        toast.success('Tag created')
        setIsCreateOpen(false)
      }
      form.reset()
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deletingTag) return
    try {
      await deleteTag.mutateAsync(deletingTag.id)
      toast.success('Tag deleted')
      setDeletingTag(null)
    } catch {
      toast.error('Failed to delete tag')
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Tags</h3>
        <p className='text-sm text-muted-foreground'>
          Manage custom tags for categorizing contacts in chats.
        </p>
      </div>
      <Separator />

      <div className='flex justify-end'>
        <Button onClick={handleCreate}>
          <Plus className='mr-2 h-4 w-4' />
          New Tag
        </Button>
      </div>

      {isLoading ? (
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-16 w-full' />
          ))}
        </div>
      ) : !tags?.length ? (
        <Card>
          <CardContent className='py-8 text-center text-muted-foreground'>
            No tags created yet. Create your first tag to categorize contacts.
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {tags.map((tag) => (
            <Card key={tag.id}>
              <CardHeader className='pb-2'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-2'>
                    <div
                      className='h-4 w-4 rounded-full'
                      style={{ backgroundColor: tag.color }}
                    />
                    <CardTitle className='text-base'>{tag.name}</CardTitle>
                  </div>
                  <Badge variant='secondary'>{tag.contact_count} contacts</Badge>
                </div>
                {tag.description && (
                  <CardDescription>{tag.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleEdit(tag)}
                  >
                    <Pencil className='mr-1 h-3 w-3' />
                    Edit
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='text-destructive hover:text-destructive'
                    onClick={() => setDeletingTag(tag)}
                  >
                    <Trash2 className='mr-1 h-3 w-3' />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editingTag}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingTag(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
            <DialogDescription>
              {editingTag
                ? 'Update the tag details.'
                : 'Create a new tag to categorize contacts.'}
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
                      <Input placeholder='VIP' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='color'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className='flex flex-wrap gap-2'>
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            type='button'
                            className={cn(
                              'h-8 w-8 rounded-full ring-offset-background transition-all',
                              field.value === color &&
                              'ring-2 ring-ring ring-offset-2'
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Select a color for the tag badge
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='High priority customers' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsCreateOpen(false)
                    setEditingTag(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={createTag.isPending || updateTag.isPending}
                >
                  {(createTag.isPending || updateTag.isPending) && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {editingTag ? 'Save Changes' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingTag} onOpenChange={() => setDeletingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the tag "{deletingTag?.name}"? This
              will remove the tag from all {deletingTag?.contact_count} contacts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeletingTag(null)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={deleteTag.isPending}
            >
              {deleteTag.isPending && (
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
