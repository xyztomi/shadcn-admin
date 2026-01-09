import { Users } from 'lucide-react'
import { useBroadcastPreview } from '@/api/broadcast'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { Broadcast } from '@/types'

interface BroadcastPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  broadcast: Broadcast | null
}

export function BroadcastPreviewDialog({
  open,
  onOpenChange,
  broadcast,
}: BroadcastPreviewDialogProps) {
  const { data: preview, isLoading } = useBroadcastPreview(
    broadcast?.id ?? 0,
    { enabled: open && !!broadcast }
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-125'>
        <DialogHeader>
          <DialogTitle>Preview Recipients</DialogTitle>
          <DialogDescription>
            {broadcast?.name} - {preview?.total_recipients ?? 0} recipients
          </DialogDescription>
        </DialogHeader>

        {/* Message Preview */}
        <div className='rounded-lg bg-muted p-3'>
          <p className='text-xs text-muted-foreground mb-1'>Message:</p>
          <p className='text-sm whitespace-pre-wrap'>{broadcast?.message}</p>
        </div>

        {/* Recipients */}
        <div>
          <div className='flex items-center gap-2 mb-2'>
            <Users className='h-4 w-4' />
            <span className='text-sm font-medium'>Recipients</span>
            {preview && (
              <Badge variant='secondary'>{preview.total_recipients}</Badge>
            )}
          </div>

          {isLoading ? (
            <div className='space-y-2'>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className='h-10' />
              ))}
            </div>
          ) : preview?.sample_contacts.length ? (
            <ScrollArea className='h-62.5 rounded-md border'>
              <div className='p-2'>
                {preview.sample_contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className='flex items-center gap-3 py-2 px-2 rounded hover:bg-muted'
                  >
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium'>
                      {contact.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>
                        {contact.name || 'Unknown'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {contact.wa_id}
                      </p>
                    </div>
                  </div>
                ))}
                {preview.total_recipients > preview.sample_contacts.length && (
                  <p className='text-xs text-muted-foreground text-center py-2'>
                    And {preview.total_recipients - preview.sample_contacts.length} more...
                  </p>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className='text-center py-8 text-muted-foreground'>
              <Users className='mx-auto h-8 w-8 mb-2' />
              <p className='text-sm'>No recipients found</p>
              <p className='text-xs'>
                {broadcast?.target_type === 'by_tags'
                  ? 'No contacts have the selected tags'
                  : 'No contacts in the system'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
