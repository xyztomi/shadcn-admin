import { useState } from 'react'
import { format } from 'date-fns'
import {
  Plus,
  Send,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Radio,
  Users,
  Tags,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

// Convert UTC date to Jakarta time (UTC+7)
function toJakartaTime(date: Date): Date {
  const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
}

function formatJakarta(dateStr: string, formatStr: string): string {
  const date = new Date(dateStr)
  return format(toJakartaTime(date), formatStr)
}

import {
  useBroadcasts,
  useDeleteBroadcast,
  useSendBroadcast,
} from '@/api/broadcast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { Broadcast, BroadcastStatus } from '@/types'
import { BroadcastDialog, BroadcastPreviewDialog } from './components'

const statusConfig: Record<
  BroadcastStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }
> = {
  draft: { label: 'Draft', variant: 'secondary', icon: Pencil },
  pending: { label: 'Pending', variant: 'outline', icon: Clock },
  sending: { label: 'Sending', variant: 'default', icon: Radio },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'secondary', icon: AlertCircle },
}

const targetTypeLabels: Record<string, { label: string; icon: typeof Users }> = {
  all_contacts: { label: 'All Contacts', icon: Users },
  by_tags: { label: 'By Tags', icon: Tags },
  selected_contacts: { label: 'Selected Contacts', icon: Users },
}

export function BroadcastPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(null)
  const [previewBroadcast, setPreviewBroadcast] = useState<Broadcast | null>(null)
  const [deletingBroadcast, setDeletingBroadcast] = useState<Broadcast | null>(null)
  const [sendingBroadcast, setSendingBroadcast] = useState<Broadcast | null>(null)

  const { data: broadcasts, isLoading } = useBroadcasts()
  const deleteMutation = useDeleteBroadcast()
  const sendMutation = useSendBroadcast()

  const handleDelete = async () => {
    if (!deletingBroadcast) return
    try {
      await deleteMutation.mutateAsync(deletingBroadcast.id)
      toast.success('Broadcast deleted')
      setDeletingBroadcast(null)
    } catch {
      toast.error('Failed to delete broadcast')
    }
  }

  const handleSend = async () => {
    if (!sendingBroadcast) return
    try {
      await sendMutation.mutateAsync(sendingBroadcast.id)
      toast.success('Broadcast started! Messages are being sent.')
      setSendingBroadcast(null)
    } catch {
      toast.error('Failed to start broadcast')
    }
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold'>Broadcast Messages</h1>
            <p className='text-muted-foreground'>
              Send messages to multiple contacts at once
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            New Broadcast
          </Button>
        </div>

        {isLoading ? (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-48' />
            ))}
          </div>
        ) : !broadcasts?.length ? (
          <Card>
            <CardContent className='py-16 text-center'>
              <Radio className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
              <h3 className='text-lg font-medium'>No broadcasts yet</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Create your first broadcast to send messages to multiple contacts
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className='mr-2 h-4 w-4' />
                Create Broadcast
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {broadcasts.map((broadcast) => {
              const status = statusConfig[broadcast.status]
              const StatusIcon = status.icon
              const target = targetTypeLabels[broadcast.target_type]
              const TargetIcon = target?.icon || Users

              return (
                <Card key={broadcast.id}>
                  <CardHeader className='pb-2'>
                    <div className='flex items-start justify-between'>
                      <CardTitle className='text-base line-clamp-1'>
                        {broadcast.name}
                      </CardTitle>
                      <Badge variant={status.variant} className='gap-1'>
                        <StatusIcon className='h-3 w-3' />
                        {status.label}
                      </Badge>
                    </div>
                    <CardDescription className='flex items-center gap-1'>
                      <TargetIcon className='h-3 w-3' />
                      {target?.label}
                      {broadcast.target_type === 'by_tags' &&
                        ` (${broadcast.tag_ids.length} tags)`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground line-clamp-2 mb-3'>
                      {broadcast.message}
                    </p>

                    {/* Stats */}
                    <div className='grid grid-cols-3 gap-2 text-center text-xs mb-3'>
                      <div className='rounded-md bg-muted p-2'>
                        <div className='font-semibold'>
                          {broadcast.total_recipients}
                        </div>
                        <div className='text-muted-foreground'>Recipients</div>
                      </div>
                      <div className='rounded-md bg-muted p-2'>
                        <div className='font-semibold text-green-600'>
                          {broadcast.sent_count}
                        </div>
                        <div className='text-muted-foreground'>Sent</div>
                      </div>
                      <div className='rounded-md bg-muted p-2'>
                        <div className='font-semibold text-red-600'>
                          {broadcast.failed_count}
                        </div>
                        <div className='text-muted-foreground'>Failed</div>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className='text-xs text-muted-foreground mb-3'>
                      Created {formatJakarta(broadcast.created_at, 'MMM d, yyyy HH:mm')}
                      {broadcast.completed_at && (
                        <span className='block'>
                          Completed{' '}
                          {formatJakarta(broadcast.completed_at, 'MMM d, yyyy HH:mm')}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className='flex gap-2'>
                      {broadcast.status === 'draft' && (
                        <>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => setPreviewBroadcast(broadcast)}
                          >
                            <Eye className='mr-1 h-3 w-3' />
                            Preview
                          </Button>
                          <Button
                            size='sm'
                            onClick={() => setSendingBroadcast(broadcast)}
                          >
                            <Send className='mr-1 h-3 w-3' />
                            Send
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => setEditingBroadcast(broadcast)}
                          >
                            <Pencil className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='text-destructive'
                            onClick={() => setDeletingBroadcast(broadcast)}
                          >
                            <Trash2 className='h-3 w-3' />
                          </Button>
                        </>
                      )}
                      {(broadcast.status === 'completed' ||
                        broadcast.status === 'failed' ||
                        broadcast.status === 'cancelled') && (
                          <Button
                            size='sm'
                            variant='ghost'
                            className='text-destructive'
                            onClick={() => setDeletingBroadcast(broadcast)}
                          >
                            <Trash2 className='mr-1 h-3 w-3' />
                            Delete
                          </Button>
                        )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </Main>

      {/* Create/Edit Dialog */}
      <BroadcastDialog
        open={isCreateOpen || !!editingBroadcast}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingBroadcast(null)
          }
        }}
        broadcast={editingBroadcast}
      />

      {/* Preview Dialog */}
      <BroadcastPreviewDialog
        open={!!previewBroadcast}
        onOpenChange={() => setPreviewBroadcast(null)}
        broadcast={previewBroadcast}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingBroadcast}
        onOpenChange={() => setDeletingBroadcast(null)}
        title='Delete Broadcast'
        desc={`Are you sure you want to delete "${deletingBroadcast?.name}"? This action cannot be undone.`}
        confirmText='Delete'
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        destructive
      />

      {/* Send Confirmation */}
      <ConfirmDialog
        open={!!sendingBroadcast}
        onOpenChange={() => setSendingBroadcast(null)}
        title='Send Broadcast'
        desc={`Send "${sendingBroadcast?.name}" to ${sendingBroadcast?.total_recipients} recipients? This action cannot be undone.`}
        confirmText='Send Now'
        handleConfirm={handleSend}
        isLoading={sendMutation.isPending}
      />
    </>
  )
}
