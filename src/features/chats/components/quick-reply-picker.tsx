import {
  useState,
  useEffect,
  useRef,
  type RefObject,
  type MutableRefObject,
} from 'react'
import { Zap, Search, Loader2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useQuickReplies,
  useSearchQuickReplies,
  useQuickReplyCategories,
  useTrackQuickReplyUsage,
} from '@/api/quick-replies'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { QuickReply } from '@/types'

interface QuickReplyPickerProps {
  onSelect: (content: string) => void
  inputRef?:
  | RefObject<HTMLInputElement | null>
  | MutableRefObject<HTMLInputElement | null>
  className?: string
  disabled?: boolean
}

export function QuickReplyPicker({
  onSelect,
  inputRef,
  className,
  disabled = false,
}: QuickReplyPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { data: quickReplies = [], isLoading } = useQuickReplies(
    selectedCategory ? { category: selectedCategory } : undefined
  )
  const { data: searchResults = [] } = useSearchQuickReplies(search)
  const { data: categories = [] } = useQuickReplyCategories()
  const trackUsage = useTrackQuickReplyUsage()

  // Focus search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }, [open])

  // Listen for "/" shortcut in the main input
  useEffect(() => {
    const input = inputRef?.current
    if (!input || disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && input.value === '') {
        e.preventDefault()
        setOpen(true)
      }
    }

    input.addEventListener('keydown', handleKeyDown)
    return () => input.removeEventListener('keydown', handleKeyDown)
  }, [inputRef, disabled])

  const handleSelect = (reply: QuickReply) => {
    onSelect(reply.content)
    trackUsage.mutate(reply.id)
    setOpen(false)
    setSearch('')
    setSelectedCategory(null)
  }

  const displayReplies = search ? searchResults : quickReplies

  // Sort by usage_count descending for frequently used
  const sortedReplies = [...displayReplies].sort(
    (a, b) => (b.usage_count || 0) - (a.usage_count || 0)
  )

  return (
    <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={cn('h-8 w-8', className)}
          title='Quick replies (press / in empty input)'
          disabled={disabled}
        >
          <Zap className='h-4 w-4' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='end' side='top'>
        <div className='p-3 border-b'>
          <div className='relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              ref={searchInputRef}
              placeholder='Search quick replies...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>
        </div>

        {/* Categories */}
        {!search && categories.length > 0 && (
          <div className='flex gap-1 p-2 border-b overflow-x-auto'>
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className='cursor-pointer whitespace-nowrap'
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categories.map((cat: string) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className='cursor-pointer whitespace-nowrap'
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        )}

        <ScrollArea className='h-64'>
          {isLoading ? (
            <div className='flex justify-center py-8'>
              <Loader2 className='h-5 w-5 animate-spin' />
            </div>
          ) : sortedReplies.length === 0 ? (
            <div className='text-center text-sm text-muted-foreground py-8'>
              {search ? 'No matching quick replies' : 'No quick replies yet'}
            </div>
          ) : (
            <div className='p-2'>
              {sortedReplies.map((reply) => (
                <button
                  key={reply.id}
                  type='button'
                  className='w-full text-left p-2 rounded-md hover:bg-muted transition-colors group'
                  onClick={() => handleSelect(reply)}
                >
                  <div className='flex items-center justify-between'>
                    <span className='font-medium text-sm'>{reply.title}</span>
                    <ChevronRight className='h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity' />
                  </div>
                  <p className='text-xs text-muted-foreground line-clamp-2 mt-1'>
                    {reply.content}
                  </p>
                  <div className='flex items-center gap-2 mt-1'>
                    {reply.shortcut && (
                      <Badge variant='secondary' className='text-[10px] px-1.5 py-0'>
                        /{reply.shortcut}
                      </Badge>
                    )}
                    {reply.category && (
                      <span className='text-[10px] text-muted-foreground'>
                        {reply.category}
                      </span>
                    )}
                    {(reply.usage_count ?? 0) > 0 && (
                      <span className='text-[10px] text-muted-foreground'>
                        Used {reply.usage_count}x
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className='p-2 border-t bg-muted/50'>
          <p className='text-[10px] text-muted-foreground text-center'>
            Press <kbd className='px-1 py-0.5 bg-muted rounded text-[10px]'>/</kbd> in
            empty message field for quick access
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
