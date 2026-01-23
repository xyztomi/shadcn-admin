import {
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  AlertCircle,
  ArrowRightLeft,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { ComplaintRatesResponse } from '@/api/analytics'

interface ComplaintRateCardProps {
  data: ComplaintRatesResponse | undefined
  isLoading: boolean
  agentId?: number
}

// Sentiment icons and labels
const SENTIMENT_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  complaint: {
    icon: ThumbsDown,
    label: 'Complaints',
    color: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  },
  compliment: {
    icon: ThumbsUp,
    label: 'Compliments',
    color: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  },
  inquiry: {
    icon: HelpCircle,
    label: 'Inquiries',
    color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  },
  urgent: {
    icon: AlertCircle,
    label: 'Urgent',
    color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
  },
  neutral: {
    icon: ArrowRightLeft,
    label: 'Neutral',
    color: 'text-gray-500 bg-gray-100 dark:bg-gray-900/30',
  },
}

export function ComplaintRateCard({
  data,
  isLoading,
  agentId,
}: ComplaintRateCardProps) {
  // Get agent's data if we have an agentId
  const agentData = agentId
    ? data?.by_agent.find((a) => a.agent_id === agentId)
    : null

  // Calculate comparison with overall rate
  const overallRate = data?.overall.overall_complaint_rate || 0
  const agentRate = agentData?.complaint_rate || 0
  const difference = agentRate - overallRate
  const isAboveAverage = difference > 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-4 w-64' />
        </CardHeader>
        <CardContent className='space-y-4'>
          <Skeleton className='h-20 w-full' />
          <Skeleton className='h-20 w-full' />
        </CardContent>
      </Card>
    )
  }

  if (!data || !agentData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            Complaint Rate Analytics
          </CardTitle>
          <CardDescription>
            Message sentiment tagging analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-2 rounded-lg bg-muted p-4'>
            <AlertTriangle className='h-5 w-5 text-muted-foreground' />
            <p className='text-muted-foreground'>
              No sentiment data available yet. Tag messages with sentiment
              (complaint, compliment, etc.) to see analytics here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalTagged = agentData.total_tagged_messages
  const complaints = agentData.complaint_count
  const breakdown = agentData.sentiment_breakdown

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MessageSquare className='h-5 w-5' />
          Complaint Rate Analytics
        </CardTitle>
        <CardDescription>
          Based on {totalTagged} tagged messages
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Main Rate Display */}
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-muted-foreground'>
                Your Complaint Rate
              </span>
              <ThumbsDown className='h-4 w-4 text-muted-foreground' />
            </div>
            <div className='mt-2 flex items-baseline gap-2'>
              <span className='text-3xl font-bold'>{agentRate.toFixed(1)}%</span>
              <span className='text-sm text-muted-foreground'>
                ({complaints} complaints)
              </span>
            </div>
            <Progress
              value={agentRate}
              className='mt-2'
            />
          </div>

          <div className='rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-muted-foreground'>
                Team Average
              </span>
              {isAboveAverage ? (
                <TrendingUp className='h-4 w-4 text-red-500' />
              ) : (
                <TrendingDown className='h-4 w-4 text-green-500' />
              )}
            </div>
            <div className='mt-2 flex items-baseline gap-2'>
              <span className='text-3xl font-bold'>{overallRate.toFixed(1)}%</span>
              <span className='text-sm text-muted-foreground'>
                ({data.overall.total_complaints} total)
              </span>
            </div>
            <div className='mt-2'>
              <Badge variant={isAboveAverage ? 'destructive' : 'default'}>
                {isAboveAverage ? (
                  <>
                    <TrendingUp className='mr-1 h-3 w-3' />
                    {Math.abs(difference).toFixed(1)}% above average
                  </>
                ) : difference < 0 ? (
                  <>
                    <TrendingDown className='mr-1 h-3 w-3' />
                    {Math.abs(difference).toFixed(1)}% below average
                  </>
                ) : (
                  'At average'
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Sentiment Breakdown */}
        <div>
          <h4 className='mb-3 text-sm font-medium'>Sentiment Breakdown</h4>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
            {Object.entries(SENTIMENT_CONFIG).map(
              ([sentiment, { icon: Icon, label, color }]) => {
                const count = breakdown[sentiment] || 0
                const percentage =
                  totalTagged > 0
                    ? ((count / totalTagged) * 100).toFixed(1)
                    : '0.0'

                return (
                  <div
                    key={sentiment}
                    className={`flex items-center gap-3 rounded-lg p-3 ${color}`}
                  >
                    <Icon className='h-5 w-5' />
                    <div>
                      <div className='text-lg font-semibold'>{count}</div>
                      <div className='text-xs'>
                        {label} ({percentage}%)
                      </div>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        </div>

        {/* Tips */}
        {agentRate > overallRate && (
          <div className='rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-900/20'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='h-5 w-5 text-amber-600' />
              <div>
                <h5 className='font-medium text-amber-800 dark:text-amber-200'>
                  Improvement Tip
                </h5>
                <p className='mt-1 text-sm text-amber-700 dark:text-amber-300'>
                  Your complaint rate is above the team average. Consider
                  reviewing recent interactions and focusing on customer
                  satisfaction. Reach out to your supervisor for coaching if
                  needed.
                </p>
              </div>
            </div>
          </div>
        )}

        {agentRate < overallRate && agentRate < 5 && (
          <div className='rounded-lg border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-900/20'>
            <div className='flex items-start gap-2'>
              <ThumbsUp className='h-5 w-5 text-green-600' />
              <div>
                <h5 className='font-medium text-green-800 dark:text-green-200'>
                  Great Job!
                </h5>
                <p className='mt-1 text-sm text-green-700 dark:text-green-300'>
                  Your complaint rate is below the team average. Keep up the
                  excellent customer service!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
