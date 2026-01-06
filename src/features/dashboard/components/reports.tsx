import { useMemo, useState, type ElementType } from 'react'
import { format, subDays, startOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { DownloadCloud, FileSpreadsheet, UserCheck } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  exportAgentPerformance,
  exportOverviewAnalytics,
} from '@/api/analytics'

type DateRangePreset = '7d' | '30d' | 'mtd' | 'all'
type DepartmentFilter = 'all' | 'viufinder' | 'viufinder_xp'

const RANGE_PRESETS: Record<Exclude<DateRangePreset, 'all'>, number> = {
  '7d': 6,
  '30d': 29,
  mtd: 0,
}

export function ReportsPanel() {
  const [rangePreset, setRangePreset] = useState<DateRangePreset>('7d')
  const [department, setDepartment] = useState<DepartmentFilter>('all')

  const range = useMemo(() => {
    if (rangePreset === 'all') return null
    const now = new Date()
    if (rangePreset === 'mtd') {
      return { start: startOfMonth(now), end: now }
    }
    const daysBack = RANGE_PRESETS[rangePreset]
    return { start: subDays(now, daysBack), end: now }
  }, [rangePreset])

  const rangeLabel = range
    ? `${format(range.start, 'MMM d')} – ${format(range.end, 'MMM d')}`
    : 'All time'

  const asQueryDate = (value?: Date) => (value ? format(value, 'yyyy-MM-dd') : undefined)

  const handleExport = async (target: 'overview' | 'agents') => {
    const startDate = asQueryDate(range?.start)
    const endDate = asQueryDate(range?.end)
    const departmentFilter = department === 'all' ? undefined : department

    const action =
      target === 'overview'
        ? exportOverviewAnalytics(startDate, endDate)
        : exportAgentPerformance(startDate, endDate, departmentFilter)

    await toast.promise(action, {
      loading: 'Preparing download…',
      success: 'Report download started.',
      error: 'Unable to generate report.',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              Export point-in-time snapshots for audits and team reviews.
            </CardDescription>
          </div>
          <DownloadCloud className='h-5 w-5 text-muted-foreground' />
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <p className='text-xs font-medium text-muted-foreground'>Time range</p>
            <Select value={rangePreset} onValueChange={(value) => setRangePreset(value as DateRangePreset)}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select range' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='7d'>Last 7 days</SelectItem>
                <SelectItem value='30d'>Last 30 days</SelectItem>
                <SelectItem value='mtd'>Month to date</SelectItem>
                <SelectItem value='all'>All time</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              {range ? `Exports will include ${rangeLabel}` : 'Includes everything we have on record.'}
            </p>
          </div>
          <div className='space-y-2'>
            <p className='text-xs font-medium text-muted-foreground'>Agent department</p>
            <Select
              value={department}
              onValueChange={(value) => setDepartment(value as DepartmentFilter)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='All departments' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All departments</SelectItem>
                <SelectItem value='viufinder'>Viufinder</SelectItem>
                <SelectItem value='viufinder_xp'>Viufinder XP</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              Department filter applies to the agent performance export.
            </p>
          </div>
        </div>

        <div className='space-y-3'>
          <ReportTile
            title='Overview snapshot'
            description='Messages, contacts, and SLA metrics for the selected window.'
            icon={FileSpreadsheet}
            onDownload={() => handleExport('overview')}
          />
          <ReportTile
            title='Agent performance CSV'
            description='Per-agent throughput, assignments, and response times.'
            icon={UserCheck}
            onDownload={() => handleExport('agents')}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function ReportTile({
  title,
  description,
  icon: Icon,
  onDownload,
}: {
  title: string
  description: string
  icon: ElementType
  onDownload: () => void | Promise<void>
}) {
  return (
    <div className='flex flex-wrap items-center gap-3 rounded-xl border bg-card/50 p-4'>
      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
        <Icon className='h-5 w-5' />
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold'>{title}</p>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
      <Button variant='secondary' className='shrink-0' onClick={onDownload}>
        <DownloadCloud className='me-2 h-4 w-4' />
        Download
      </Button>
    </div>
  )
}
