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

interface TooltipPayload {
  payload?: ChartPoint
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
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

function MessagesTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className='rounded-lg border bg-background/95 p-3 text-sm shadow-sm backdrop-blur'>
      <p className='font-semibold'>{point.fullDate}</p>
      <p className='text-muted-foreground'>Total · {point.total.toLocaleString()}</p>
      <div className='mt-2 space-y-1 text-xs uppercase tracking-wide text-muted-foreground'>
        <div className='flex justify-between'>
          <span>Inbound</span>
          <span className='font-medium text-foreground'>{point.inbound.toLocaleString()}</span>
        </div>
        <div className='flex justify-between'>
          <span>Outbound</span>
          <span className='font-medium text-foreground'>{point.outbound.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export function Overview() {
  const { data, isLoading } = useMessagesByDate(14)

  const chartData = useMemo<ChartPoint[]>(() => {
    return (
      data
        ?.map((day) => {
          const parsed = parseDateSafe(day.date)
          if (!parsed) return null
          return {
            name: format(parsed, 'MMM d'),
            fullDate: format(parsed, 'EEEE, MMM d'),
            inbound: day.inbound,
            outbound: day.outbound,
            total: day.total,
          }
        })
        .filter((point): point is ChartPoint => point !== null) ?? []
    )
  }, [data])

  if (isLoading) {
    return <Skeleton className='h-80 w-full' />
  }

  if (chartData.length === 0) {
    return (
      <div className='flex h-80 w-full items-center justify-center text-sm text-muted-foreground'>
        No message activity for this range.
      </div>
    )
  }

  return (
    <ResponsiveContainer width='100%' height={320}>
      <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id='chartOutbound' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='var(--chart-1)' stopOpacity={0.8} />
            <stop offset='95%' stopColor='var(--chart-1)' stopOpacity={0} />
          </linearGradient>
          <linearGradient id='chartInbound' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='var(--chart-2)' stopOpacity={0.6} />
            <stop offset='95%' stopColor='var(--chart-2)' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray='3 3' className='stroke-muted' vertical={false} />
        <XAxis dataKey='name' stroke='var(--muted-foreground)' fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke='var(--muted-foreground)' fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<MessagesTooltip />} cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '4 4' }} wrapperClassName='outline-hidden' />
        <Area type='monotone' dataKey='outbound' stroke='var(--chart-1)' fill='url(#chartOutbound)' strokeWidth={2} />
        <Area type='monotone' dataKey='inbound' stroke='var(--chart-2)' fill='url(#chartInbound)' strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
