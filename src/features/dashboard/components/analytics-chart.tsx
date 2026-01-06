import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { useMessagesByDate } from '@/api/analytics'
import { Skeleton } from '@/components/ui/skeleton'

export function AnalyticsChart() {
  const { data: messagesByDate, isLoading } = useMessagesByDate(7) // Last 7 days

  if (isLoading) {
    return <Skeleton className='h-[300px] w-full' />
  }

  // Transform data for chart
  const chartData = messagesByDate?.map((day) => ({
    name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    inbound: day.inbound,
    outbound: day.outbound,
    total: day.total,
  })) ?? []

  return (
    <ResponsiveContainer width='100%' height={300}>
      <AreaChart data={chartData}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className='rounded-lg border bg-background p-2 shadow-sm'>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='flex flex-col'>
                      <span className='text-[0.70rem] uppercase text-muted-foreground'>
                        Inbound
                      </span>
                      <span className='font-bold text-muted-foreground'>
                        {payload[1]?.value}
                      </span>
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-[0.70rem] uppercase text-muted-foreground'>
                        Outbound
                      </span>
                      <span className='font-bold'>
                        {payload[0]?.value}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Area
          type='monotone'
          dataKey='outbound'
          stroke='currentColor'
          className='text-primary'
          fill='currentColor'
          fillOpacity={0.15}
        />
        <Area
          type='monotone'
          dataKey='inbound'
          stroke='currentColor'
          className='text-muted-foreground'
          fill='currentColor'
          fillOpacity={0.1}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
