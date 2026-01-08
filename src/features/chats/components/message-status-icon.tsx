import { Check, CheckCheck, AlertCircle, Loader2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type MessageStatusType = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

interface MessageStatusIconProps {
  status: MessageStatusType
  error?: string | null
  className?: string
}

const statusConfig: Record<
  MessageStatusType,
  {
    icon: typeof Check
    className: string
    label: string
    animate?: boolean
  }
> = {
  pending: {
    icon: Loader2,
    className: 'text-muted-foreground/70',
    label: 'Sending...',
    animate: true,
  },
  sent: {
    icon: Check,
    className: 'text-muted-foreground/70',
    label: 'Sent to WhatsApp',
  },
  delivered: {
    icon: CheckCheck,
    className: 'text-muted-foreground/70',
    label: 'Delivered',
  },
  read: {
    icon: CheckCheck,
    className: 'text-blue-500',
    label: 'Read',
  },
  failed: {
    icon: AlertCircle,
    className: 'text-destructive',
    label: 'Failed to send',
  },
}

export function MessageStatusIcon({
  status,
  error,
  className,
}: MessageStatusIconProps) {
  const config = statusConfig[status]
  if (!config) return null

  const Icon = config.icon
  const tooltipLabel = status === 'failed' && error ? error : config.label

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Icon
            className={`h-3 w-3 ${config.className} ${config.animate ? 'animate-spin' : ''} ${className ?? ''}`}
            aria-label={config.label}
          />
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-xs"
        >
          <p>{tooltipLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export type { MessageStatusType, MessageStatusIconProps }
