import {
  ThumbsDown,
  ThumbsUp,
  HelpCircle,
  AlertCircle,
  ArrowRightLeft,
} from 'lucide-react'
import { MessageSentiment } from '@/api/chat'

// Sentiment configuration with icons and colors
export const SENTIMENT_CONFIG: Record<
  MessageSentiment,
  {
    icon: React.ElementType
    label: string
    color: string
    bgColor: string
    borderColor: string
    description: string
  }
> = {
  [MessageSentiment.COMPLAINT]: {
    icon: ThumbsDown,
    label: 'Complaint',
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-l-red-500',
    description: 'Customer is complaining or expressing dissatisfaction',
  },
  [MessageSentiment.COMPLIMENT]: {
    icon: ThumbsUp,
    label: 'Compliment',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-l-green-500',
    description: 'Customer is praising or expressing satisfaction',
  },
  [MessageSentiment.INQUIRY]: {
    icon: HelpCircle,
    label: 'Inquiry',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-l-blue-500',
    description: 'Customer is asking a question',
  },
  [MessageSentiment.URGENT]: {
    icon: AlertCircle,
    label: 'Urgent',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-l-orange-500',
    description: 'Urgent issue requiring immediate attention',
  },
  [MessageSentiment.NEUTRAL]: {
    icon: ArrowRightLeft,
    label: 'Neutral',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    borderColor: 'border-l-gray-400',
    description: 'Neutral or informational message',
  },
}
