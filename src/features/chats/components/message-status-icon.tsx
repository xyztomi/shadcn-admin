import { Check, CheckCheck, AlertCircle, Loader2, EyeOff } from 'lucide-react'
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
  /** Whether the contact has read receipts enabled (null = unknown, false = disabled) */
  readReceiptsEnabled?: boolean | null
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
  readReceiptsEnabled,
}: MessageStatusIconProps) {
  const config = statusConfig[status]
  if (!config) return null

  const Icon = config.icon

  // Handle read receipts disabled case
  // When status is "delivered" and we know read receipts are disabled (false),
  // show a special indicator. If null (unknown), show normal delivered status.
  const isReadReceiptsOff = readReceiptsEnabled === false && status === 'delivered'

  let tooltipLabel = status === 'failed' && error ? error : config.label
  let iconClassName = config.className

  if (isReadReceiptsOff) {
    tooltipLabel = 'Delivered (read receipts off)'
    // Use a slightly different style to indicate unknown read status
    iconClassName = 'text-muted-foreground/50'
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className="relative inline-flex items-center">
            <Icon
              className={`h-3 w-3 ${iconClassName} ${config.animate ? 'animate-spin' : ''} ${className ?? ''}`}
              aria-label={config.label}
            />
            {isReadReceiptsOff && (
              <EyeOff className="absolute -right-1.5 -top-1 h-2 w-2 text-muted-foreground/70" />
            )}
          </span>
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
