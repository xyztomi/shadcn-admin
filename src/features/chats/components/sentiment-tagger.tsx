import { useState } from 'react'
import { X, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useTagMessageSentiment,
  useRemoveMessageSentiment,
  type MessageSentiment,
} from '@/api/chat'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SENTIMENT_CONFIG } from '../constants/sentiment'

interface SentimentTaggerProps {
  messageId: string | number
  currentSentiment?: MessageSentiment | null
  taggedByName?: string | null
  disabled?: boolean
  className?: string
}

export function SentimentTagger({
  messageId,
  currentSentiment,
  taggedByName,
  disabled = false,
  className,
}: SentimentTaggerProps) {
  const [open, setOpen] = useState(false)
  const tagMutation = useTagMessageSentiment()
  const removeMutation = useRemoveMessageSentiment()

  const handleSelect = async (sentiment: MessageSentiment) => {
    try {
      await tagMutation.mutateAsync({ messageId, sentiment })
      toast.success(`Tagged as ${SENTIMENT_CONFIG[sentiment].label}`)
      setOpen(false)
    } catch {
      toast.error('Failed to tag message')
    }
  }

  const handleRemove = async () => {
    try {
      await removeMutation.mutateAsync(messageId)
      toast.success('Tag removed')
      setOpen(false)
    } catch {
      toast.error('Failed to remove tag')
    }
  }

  const isPending = tagMutation.isPending || removeMutation.isPending

  // If there's a current sentiment, show badge with tagger info
  if (currentSentiment && SENTIMENT_CONFIG[currentSentiment]) {
    const config = SENTIMENT_CONFIG[currentSentiment]
    const Icon = config.icon

    return (
      <div className={cn('inline-flex flex-col items-start gap-0.5', className)}>
        <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
          <PopoverTrigger asChild>
            <button
              type='button'
              disabled={disabled}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium transition-colors',
                config.bgColor,
                config.color,
                !disabled && 'hover:opacity-80 cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className='h-3 w-3' />
              {config.label}
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-48 p-2' align='start'>
            <div className='space-y-1'>
              <p className='text-xs font-medium text-muted-foreground mb-2'>
                Change sentiment tag
              </p>
              {Object.entries(SENTIMENT_CONFIG).map(([key, cfg]) => {
                const SentimentIcon = cfg.icon
                const isSelected = key === currentSentiment
                return (
                  <button
                    key={key}
                    type='button'
                    onClick={() => handleSelect(key as MessageSentiment)}
                    disabled={isPending || isSelected}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                      isSelected
                        ? 'bg-muted cursor-default'
                        : 'hover:bg-muted cursor-pointer',
                      isPending && 'opacity-50'
                    )}
                  >
                    <SentimentIcon className={cn('h-4 w-4', cfg.color)} />
                    <span>{cfg.label}</span>
                  </button>
                )
              })}
              <div className='border-t pt-1 mt-1'>
                <button
                  type='button'
                  onClick={handleRemove}
                  disabled={isPending}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer',
                    isPending && 'opacity-50'
                  )}
                >
                  <X className='h-4 w-4' />
                  Remove tag
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {taggedByName && (
          <span className='text-[0.6rem] text-muted-foreground/70 px-1'>
            by {taggedByName}
          </span>
        )}
      </div>
    )
  }

  // No sentiment yet - show tag button
  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type='button'
                disabled={disabled}
                className={cn(
                  'inline-flex items-center justify-center rounded-full p-1 text-muted-foreground/50 transition-colors',
                  !disabled && 'hover:bg-muted hover:text-muted-foreground cursor-pointer',
                  disabled && 'opacity-30 cursor-not-allowed',
                  className
                )}
              >
                <Tag className='h-3 w-3' />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side='top'>
            <p>{disabled ? 'Tagging disabled outside shift' : 'Tag sentiment'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className='w-56 p-2' align='start'>
        <div className='space-y-1'>
          <p className='text-xs font-medium text-muted-foreground mb-2'>
            Tag message sentiment
          </p>
          {Object.entries(SENTIMENT_CONFIG).map(([key, cfg]) => {
            const SentimentIcon = cfg.icon
            return (
              <TooltipProvider key={key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      onClick={() => handleSelect(key as MessageSentiment)}
                      disabled={isPending}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer transition-colors',
                        isPending && 'opacity-50'
                      )}
                    >
                      <SentimentIcon className={cn('h-4 w-4', cfg.color)} />
                      <span>{cfg.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='right'>
                    <p className='max-w-50 text-xs'>{cfg.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Simple badge display for viewing sentiment (no edit capabilities)
export function SentimentBadge({
  sentiment,
  className,
}: {
  sentiment: MessageSentiment
  className?: string
}) {
  const config = SENTIMENT_CONFIG[sentiment]
  if (!config) return null

  const Icon = config.icon

  return (
    <Badge
      variant='secondary'
      className={cn(
        'gap-1 text-[0.6rem] px-1.5 py-0',
        config.bgColor,
        config.color,
        className
      )}
    >
      <Icon className='h-2.5 w-2.5' />
      {config.label}
    </Badge>
  )
}
