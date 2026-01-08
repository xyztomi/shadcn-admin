import { type MessageTemplate } from '@/api/templates'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

interface TemplatePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: MessageTemplate | null
}

const statusColors: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function TemplatePreviewDialog({
  open,
  onOpenChange,
  template,
}: TemplatePreviewDialogProps) {
  if (!template) return null

  const headerComponent = template.components.find((c) => c.type === 'HEADER')
  const bodyComponent = template.components.find((c) => c.type === 'BODY')
  const footerComponent = template.components.find((c) => c.type === 'FOOTER')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {template.name}
            <Badge
              variant='outline'
              className={statusColors[template.status]}
            >
              {template.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {template.category} · {template.language}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* WhatsApp-style preview */}
        <div className='rounded-lg bg-muted p-4'>
          <div className='mx-auto max-w-72'>
            {/* Message bubble */}
            <div className='rounded-lg bg-background p-3 shadow-sm'>
              {headerComponent?.text && (
                <p className='mb-2 font-semibold text-sm'>
                  {headerComponent.text}
                </p>
              )}

              {bodyComponent?.text && (
                <p className='whitespace-pre-wrap text-sm'>
                  {bodyComponent.text}
                </p>
              )}

              {footerComponent?.text && (
                <p className='mt-2 text-xs text-muted-foreground'>
                  {footerComponent.text}
                </p>
              )}

              {/* Timestamp */}
              <div className='mt-1 flex justify-end'>
                <span className='text-[10px] text-muted-foreground'>
                  12:00 PM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Variable placeholders info */}
        {bodyComponent?.text?.includes('{{') && (
          <div className='text-xs text-muted-foreground'>
            <p className='font-medium'>Variables used:</p>
            <p>
              {bodyComponent.text
                .match(/\{\{\d+\}\}/g)
                ?.join(', ') || 'None'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
