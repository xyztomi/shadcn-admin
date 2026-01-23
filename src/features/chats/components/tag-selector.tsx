import { useState } from 'react'
import { Plus, X, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useTags,
  useContactTags,
  useAddTagToContact,
  useRemoveTagFromContact,
  useCreateTag,
} from '@/api/tags'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import type { Tag } from '@/types'

interface TagSelectorProps {
  waId: string
  className?: string
  disabled?: boolean
}

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
]

export function TagSelector({ waId, className, disabled = false }: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0])

  const { data: allTags, isLoading: tagsLoading } = useTags()
  const { data: contactTags, isLoading: contactTagsLoading } =
    useContactTags(waId)
  const addTag = useAddTagToContact()
  const removeTag = useRemoveTagFromContact()
  const createTag = useCreateTag()

  const tags = allTags ?? []
  const currentTags = contactTags ?? []
  const contactTagIds = new Set(currentTags.map((t: Tag) => t.id))

  const handleToggleTag = async (tag: Tag) => {
    if (contactTagIds.has(tag.id)) {
      await removeTag.mutateAsync({ waId, tagId: tag.id })
    } else {
      await addTag.mutateAsync({ waId, tagId: tag.id })
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    const newTag = await createTag.mutateAsync({
      name: newTagName.trim(),
      color: selectedColor,
    })

    // Also add to contact
    await addTag.mutateAsync({ waId, tagId: newTag.id })

    setNewTagName('')
    setIsCreating(false)
  }

  const isLoading = tagsLoading || contactTagsLoading

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {/* Display current tags */}
      {currentTags.map((tag: Tag) => (
        <Badge
          key={tag.id}
          variant='secondary'
          className='gap-1 pr-1'
          style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined }}
        >
          <span
            className='h-2 w-2 rounded-full'
            style={{ backgroundColor: tag.color || '#6b7280' }}
          />
          {tag.name}
          <button
            type='button'
            className='ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={() => removeTag.mutate({ waId, tagId: tag.id })}
            disabled={removeTag.isPending || disabled}
          >
            <X className='h-3 w-3' />
          </button>
        </Badge>
      ))}

      {/* Add tag button */}
      <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className='h-6 px-2 text-xs text-muted-foreground'
            disabled={disabled}
          >
            <Plus className='h-3 w-3 mr-1' />
            Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-64 p-0' align='start'>
          {isCreating ? (
            <div className='p-3 space-y-3'>
              <Input
                placeholder='Tag name'
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                autoFocus
              />
              <div className='flex flex-wrap gap-2'>
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type='button'
                    className={cn(
                      'h-6 w-6 rounded-full ring-offset-background transition-all',
                      selectedColor === color && 'ring-2 ring-ring ring-offset-2'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  className='flex-1'
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || createTag.isPending}
                >
                  {createTag.isPending ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    'Create'
                  )}
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Command>
              <CommandInput placeholder='Search tags...' />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {isLoading ? (
                    <div className='flex justify-center py-4'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                    </div>
                  ) : (
                    tags.map((tag: Tag) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => handleToggleTag(tag)}
                        disabled={addTag.isPending || removeTag.isPending}
                      >
                        <span
                          className='mr-2 h-3 w-3 rounded-full'
                          style={{ backgroundColor: tag.color || '#6b7280' }}
                        />
                        {tag.name}
                        {contactTagIds.has(tag.id) && (
                          <Check className='ml-auto h-4 w-4' />
                        )}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => setIsCreating(true)}>
                    <Plus className='mr-2 h-4 w-4' />
                    Create new tag
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
