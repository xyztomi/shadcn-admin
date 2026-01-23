import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { useNavigate } from '@tanstack/react-router'
import {
  ThumbsDown,
  ThumbsUp,
  HelpCircle,
  AlertCircle,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Calendar,
  Users,
  MessageSquare,
  ExternalLink,
  Eye,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useComplaintRates, useTaggedMessages, exportComplaintRates, type AgentComplaintRate } from '@/api/analytics'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Sentiment icons and config
const SENTIMENT_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; colorClass: string }
> = {
  complaint: {
    icon: ThumbsDown,
    label: 'Complaint',
    colorClass: 'text-red-500',
  },
  compliment: {
    icon: ThumbsUp,
    label: 'Compliment',
    colorClass: 'text-green-500',
  },
  inquiry: {
    icon: HelpCircle,
    label: 'Inquiry',
    colorClass: 'text-blue-500',
  },
  urgent: {
    icon: AlertCircle,
    label: 'Urgent',
    colorClass: 'text-orange-500',
  },
  neutral: {
    icon: ArrowRightLeft,
    label: 'Neutral',
    colorClass: 'text-gray-500',
  },
}

// Date presets
const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: 0 },
]

function getRateColor(rate: number): string {
  if (rate >= 20) return 'text-red-600'
  if (rate >= 10) return 'text-orange-500'
  if (rate >= 5) return 'text-yellow-500'
  return 'text-green-500'
}

function getRateBadgeVariant(rate: number): 'destructive' | 'secondary' | 'default' {
  if (rate >= 15) return 'destructive'
  if (rate >= 5) return 'secondary'
  return 'default'
}

interface AgentRowProps {
  agent: AgentComplaintRate
  overallRate: number
  rank: number
  onViewMessages: () => void
}

function AgentRow({ agent, overallRate, rank, onViewMessages }: AgentRowProps) {
  const difference = agent.complaint_rate - overallRate
  const isAboveAverage = difference > 0

  return (
    <TableRow>
      <TableCell className='font-medium'>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-xs w-6'>#{rank}</span>
          {agent.agent_name}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant='outline' className='text-xs'>
          {agent.agent_department === 'viufinder_xp' ? 'Viufinder XP' : 'Viufinder'}
        </Badge>
      </TableCell>
      <TableCell className='text-center'>
        {agent.total_tagged_messages}
      </TableCell>
      <TableCell className='text-center'>
        <span className={cn('font-medium', agent.complaint_count > 0 && 'text-red-500')}>
          {agent.complaint_count}
        </span>
      </TableCell>
      <TableCell>
        <div className='flex items-center gap-2'>
          <Progress
            value={Math.min(agent.complaint_rate, 100)}
            className='w-16 h-2'
          />
          <span className={cn('font-semibold text-sm', getRateColor(agent.complaint_rate))}>
            {agent.complaint_rate.toFixed(1)}%
          </span>
        </div>
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={getRateBadgeVariant(Math.abs(difference))}>
                {isAboveAverage ? (
                  <TrendingUp className='mr-1 h-3 w-3' />
                ) : difference < 0 ? (
                  <TrendingDown className='mr-1 h-3 w-3' />
                ) : null}
                {difference > 0 ? '+' : ''}{difference.toFixed(1)}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isAboveAverage
                  ? 'Above team average'
                  : difference < 0
                    ? 'Below team average'
                    : 'At team average'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <div className='flex gap-1'>
          {Object.entries(SENTIMENT_CONFIG).map(([sentiment, config]) => {
            const count = agent.sentiment_breakdown[sentiment] || 0
            if (count === 0) return null
            const Icon = config.icon
            return (
              <TooltipProvider key={sentiment}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn('flex items-center gap-0.5 text-xs', config.colorClass)}>
                      <Icon className='h-3 w-3' />
                      <span>{count}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{config.label}: {count}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      </TableCell>
      <TableCell>
        <Button variant='ghost' size='sm' onClick={onViewMessages}>
          <Eye className='h-4 w-4 mr-1' />
          View
        </Button>
      </TableCell>
    </TableRow>
  )
}

// Tagged Messages Dialog Component
interface TaggedMessagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId: number | null
  agentName: string
  startDate?: string
  endDate?: string
}

function TaggedMessagesDialog({
  open,
  onOpenChange,
  agentId,
  agentName,
  startDate,
  endDate,
}: TaggedMessagesDialogProps) {
  const navigate = useNavigate()
  const { data, isLoading } = useTaggedMessages(
    startDate,
    endDate,
    agentId ?? undefined,
    undefined,
    100,
    0,
    open && agentId !== null
  )

  const handleViewChat = (waId: string) => {
    onOpenChange(false)
    navigate({ to: '/chats', search: { contact: waId } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            Tagged Messages by {agentName}
          </DialogTitle>
          <DialogDescription>
            Click "Open Chat" to view the conversation where the message was tagged
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className='max-h-96'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-6 w-6 animate-spin' />
            </div>
          ) : !data?.messages.length ? (
            <p className='text-center text-muted-foreground py-8'>
              No tagged messages found
            </p>
          ) : (
            <div className='space-y-3'>
              {data.messages.map((msg) => {
                const sentimentConfig = SENTIMENT_CONFIG[msg.sentiment]
                const Icon = sentimentConfig?.icon || HelpCircle
                return (
                  <div
                    key={msg.id}
                    className='flex items-start gap-3 p-3 rounded-lg border bg-card'
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <Badge
                          variant='secondary'
                          className={cn('text-xs', sentimentConfig?.colorClass)}
                        >
                          <Icon className='h-3 w-3 mr-1' />
                          {sentimentConfig?.label || msg.sentiment}
                        </Badge>
                        <span className='text-xs text-muted-foreground'>
                          {msg.sentiment_tagged_at
                            ? format(new Date(msg.sentiment_tagged_at), 'MMM d, HH:mm')
                            : ''}
                        </span>
                      </div>
                      <p className='text-sm font-medium truncate'>
                        {msg.contact_name || msg.contact_phone || msg.wa_id}
                      </p>
                      <p className='text-sm text-muted-foreground line-clamp-2'>
                        {msg.content || 'No message content'}
                      </p>
                    </div>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleViewChat(msg.wa_id)}
                    >
                      <ExternalLink className='h-4 w-4 mr-1' />
                      Open Chat
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        {data?.total && data.total > data.messages.length && (
          <p className='text-xs text-muted-foreground text-center'>
            Showing {data.messages.length} of {data.total} messages
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function ComplaintRateAnalytics() {
  const [selectedPreset, setSelectedPreset] = useState<string>('30')
  const [selectedAgent, setSelectedAgent] = useState<{
    id: number
    name: string
  } | null>(null)

  // Calculate dates based on preset
  const getDateRange = () => {
    const days = parseInt(selectedPreset, 10)
    if (days === 0) return { startDate: undefined, endDate: undefined }

    const endDate = format(new Date(), 'yyyy-MM-dd')
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')
    return { startDate, endDate }
  }

  const { startDate, endDate } = getDateRange()
  const { data, isLoading, isError } = useComplaintRates(startDate, endDate)

  const handleExport = async () => {
    try {
      await exportComplaintRates(startDate, endDate)
      toast.success('Complaint rates exported successfully')
    } catch {
      toast.error('Failed to export complaint rates')
    }
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-destructive' />
            Error Loading Complaint Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Failed to load complaint rate analytics. Please try again later.
          </p>
        </CardContent>
      </Card>
    )
  }

  const overallRate = data?.overall.overall_complaint_rate || 0
  const totalTagged = data?.overall.total_tagged_messages || 0
  const totalComplaints = data?.overall.total_complaints || 0
  const agentRates = data?.by_agent || []

  // Calculate top performers and areas of concern
  const topPerformers = agentRates.filter(a => a.complaint_rate < overallRate && a.total_tagged_messages >= 5).slice(-3).reverse()
  const areasOfConcern = agentRates.filter(a => a.complaint_rate > overallRate && a.total_tagged_messages >= 5).slice(0, 3)

  return (
    <div className='space-y-4'>
      {/* Header with filters */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h3 className='text-lg font-semibold'>Complaint Rate Analytics</h3>
          <p className='text-sm text-muted-foreground'>
            Compare sentiment tagging across agents
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Select value={selectedPreset} onValueChange={setSelectedPreset}>
            <SelectTrigger className='w-40'>
              <Calendar className='mr-2 h-4 w-4' />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((preset) => (
                <SelectItem key={preset.days} value={String(preset.days)}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            size='sm'
            onClick={handleExport}
            disabled={isLoading || !data}
          >
            <Download className='mr-2 h-4 w-4' />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Tagged Messages</CardTitle>
            <MessageSquare className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className='h-8 w-20' />
            ) : (
              <div className='text-2xl font-bold'>{totalTagged.toLocaleString()}</div>
            )}
            <p className='text-xs text-muted-foreground'>
              Inbound messages with sentiment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Complaints</CardTitle>
            <ThumbsDown className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className='h-8 w-20' />
            ) : (
              <div className='text-2xl font-bold text-red-500'>
                {totalComplaints.toLocaleString()}
              </div>
            )}
            <p className='text-xs text-muted-foreground'>
              Messages tagged as complaint
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Overall Rate</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className='h-8 w-20' />
            ) : (
              <div className={cn('text-2xl font-bold', getRateColor(overallRate))}>
                {overallRate.toFixed(1)}%
              </div>
            )}
            <p className='text-xs text-muted-foreground'>
              Team-wide complaint rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Agents Tracked</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className='h-8 w-20' />
            ) : (
              <div className='text-2xl font-bold'>{agentRates.length}</div>
            )}
            <p className='text-xs text-muted-foreground'>
              Agents with tagged messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Cards */}
      {!isLoading && agentRates.length > 0 && (
        <div className='grid gap-4 md:grid-cols-2'>
          {/* Areas of Concern */}
          {areasOfConcern.length > 0 && (
            <Card className='border-orange-200 dark:border-orange-900'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <AlertTriangle className='h-4 w-4 text-orange-500' />
                  Areas of Concern
                </CardTitle>
                <CardDescription>
                  Agents with above-average complaint rates
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {areasOfConcern.map((agent) => (
                  <div key={agent.agent_id} className='flex items-center justify-between'>
                    <div>
                      <span className='font-medium'>{agent.agent_name}</span>
                      <p className='text-xs text-muted-foreground'>
                        {agent.complaint_count} complaints / {agent.total_tagged_messages} tagged
                      </p>
                    </div>
                    <Badge variant='destructive'>
                      {agent.complaint_rate.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Top Performers */}
          {topPerformers.length > 0 && (
            <Card className='border-green-200 dark:border-green-900'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <ThumbsUp className='h-4 w-4 text-green-500' />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Agents with below-average complaint rates
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {topPerformers.map((agent) => (
                  <div key={agent.agent_id} className='flex items-center justify-between'>
                    <div>
                      <span className='font-medium'>{agent.agent_name}</span>
                      <p className='text-xs text-muted-foreground'>
                        {agent.complaint_count} complaints / {agent.total_tagged_messages} tagged
                      </p>
                    </div>
                    <Badge variant='default' className='bg-green-600'>
                      {agent.complaint_rate.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Agent Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Comparison</CardTitle>
          <CardDescription>
            Detailed breakdown of complaint rates by agent (sorted by rate, highest first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-3'>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : agentRates.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <MessageSquare className='h-12 w-12 text-muted-foreground/50 mb-4' />
              <p className='text-muted-foreground'>
                No tagged messages found for the selected period.
              </p>
              <p className='text-sm text-muted-foreground'>
                Start tagging inbound messages with sentiment to see analytics here.
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className='text-center'>Tagged</TableHead>
                    <TableHead className='text-center'>Complaints</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>vs Avg</TableHead>
                    <TableHead>Breakdown</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentRates.map((agent, index) => (
                    <AgentRow
                      key={agent.agent_id}
                      agent={agent}
                      overallRate={overallRate}
                      rank={index + 1}
                      onViewMessages={() =>
                        setSelectedAgent({
                          id: agent.agent_id,
                          name: agent.agent_name,
                        })
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tagged Messages Dialog */}
      <TaggedMessagesDialog
        open={selectedAgent !== null}
        onOpenChange={(open) => !open && setSelectedAgent(null)}
        agentId={selectedAgent?.id ?? null}
        agentName={selectedAgent?.name ?? ''}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  )
}
