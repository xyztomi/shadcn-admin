import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts'
import { useMessagesByDate } from '@/api/analytics'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartPoint {
  name: string
  fullDate: string
  inbound: number
  outbound: number
  total: number
}

const parseDateSafe = (value: string | null | undefined): Date | null => {
  if (!value) return null
  try {
    const parsed = parseISO(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}

function ActivityTooltip({ active, payload }: TooltipProps<string, string>) {
  if (!active || !payload?.length) return null
  const dataPoint = payload[0]?.payload as ChartPoint | undefined
  if (!dataPoint) return null

  return (
    <div className='rounded-lg border bg-background/95 p-3 text-sm shadow-sm backdrop-blur'>
      <p className='font-semibold'>{dataPoint.fullDate}</p>
      <p className='text-xs text-muted-foreground'>Total {dataPoint.total.toLocaleString()}</p>
      <div className='mt-2 space-y-1 text-xs uppercase tracking-wide text-muted-foreground'>
        <div className='flex justify-between'>
          <span>Inbound</span>
          <span className='font-medium text-foreground'>{dataPoint.inbound.toLocaleString()}</span>
        </div>
        <div className='flex justify-between'>
          <span>Outbound</span>
          <span className='font-medium text-foreground'>{dataPoint.outbound.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export function AnalyticsChart() {
  const { data: messagesByDate, isLoading } = useMessagesByDate(7)

  const chartData = useMemo<ChartPoint[]>(() => {
    return (
      messagesByDate
        ?.map((day) => {
          const parsed = parseDateSafe(day.date)
          if (!parsed) return null
          return {
            name: format(parsed, 'EEE'),
            fullDate: format(parsed, 'EEEE, MMM d'),
            inbound: day.inbound,
            outbound: day.outbound,
            total: day.total,
          }
        })
        .filter((point): point is ChartPoint => point !== null) ?? []
    )
  }, [messagesByDate])

  if (isLoading) {
    return <Skeleton className='h-[300px] w-full' />
  }

  if (chartData.length === 0) {
    return (
      <div className='flex h-[300px] w-full items-center justify-center text-sm text-muted-foreground'>
        No activity in the selected window.
      </div>
    )
  }

  return (
    <ResponsiveContainer width='100%' height={300}>
      <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id='analyticsOutbound' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='var(--chart-1)' stopOpacity={0.9} />
            <stop offset='95%' stopColor='var(--chart-1)' stopOpacity={0} />
          </linearGradient>
          <linearGradient id='analyticsInbound' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='var(--chart-2)' stopOpacity={0.5} />
            <stop offset='95%' stopColor='var(--chart-2)' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray='3 3' className='stroke-muted' vertical={false} />
        <XAxis dataKey='name' stroke='var(--muted-foreground)' fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke='var(--muted-foreground)' fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<ActivityTooltip />} cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '4 4' }} wrapperClassName='outline-hidden' />
        <Area type='monotone' dataKey='outbound' stroke='var(--chart-1)' strokeWidth={2} fill='url(#analyticsOutbound)' />
        <Area type='monotone' dataKey='inbound' stroke='var(--chart-2)' strokeWidth={2} fill='url(#analyticsInbound)' />
      </AreaChart>
    </ResponsiveContainer>
  )
}
