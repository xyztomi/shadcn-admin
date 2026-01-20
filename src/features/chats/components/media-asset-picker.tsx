import { useState, useMemo } from 'react'
import { Image, FileText, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useMediaAssets, useSendMediaMessage, type MediaAsset } from '@/api/media-assets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface MediaAssetPickerProps {
  waId: string
  disabled?: boolean
  children: React.ReactNode
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaAssetPicker({ waId, disabled, children }: MediaAssetPickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null)
  const [caption, setCaption] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'image' | 'document'>('image')

  const { data: assets, isLoading } = useMediaAssets({ active_only: true })
  const sendMedia = useSendMediaMessage()

  const filteredAssets = useMemo(() => {
    if (!assets) return []
    return assets.filter((asset) => {
      // Filter by type
      if (activeTab === 'image' && asset.asset_type !== 'image') return false
      if (activeTab === 'document' && asset.asset_type !== 'document') return false

      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase()
        return (
          asset.name.toLowerCase().includes(searchLower) ||
          asset.filename.toLowerCase().includes(searchLower) ||
          asset.category?.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }, [assets, activeTab, search])

  const handleSend = async () => {
    if (!selectedAsset) return

    try {
      await sendMedia.mutateAsync({
        waId,
        mediaAssetId: selectedAsset.id,
        caption: caption || undefined,
      })
      toast.success('Media sent successfully')
      setOpen(false)
      setSelectedAsset(null)
      setCaption('')
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string | { message?: string } } } }
      const detail = err.response?.data?.detail
      const message = typeof detail === 'string' ? detail : detail?.message || 'Failed to send media'
      toast.error(message)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedAsset(null)
    setCaption('')
    setSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Send Media</DialogTitle>
          <DialogDescription>
            Select an image or document to send
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'image' | 'document')}>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='image' className='flex items-center gap-2'>
              <Image className='h-4 w-4' />
              Images
            </TabsTrigger>
            <TabsTrigger value='document' className='flex items-center gap-2'>
              <FileText className='h-4 w-4' />
              Documents
            </TabsTrigger>
          </TabsList>

          <div className='relative mt-4'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search assets...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>

          <TabsContent value='image' className='mt-4'>
            {isLoading ? (
              <div className='flex h-48 items-center justify-center'>
                <Loader2 className='h-6 w-6 animate-spin' />
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className='flex h-48 items-center justify-center text-muted-foreground'>
                No images available
              </div>
            ) : (
              <ScrollArea className='h-64'>
                <div className='grid grid-cols-3 gap-3 pr-4'>
                  {filteredAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={cn(
                        'group relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
                        selectedAsset?.id === asset.id
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-transparent hover:border-muted-foreground/30'
                      )}
                    >
                      <img
                        src={asset.file_url}
                        alt={asset.name}
                        className='h-full w-full object-cover'
                      />
                      <div className='absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2'>
                        <p className='truncate text-xs font-medium text-white'>
                          {asset.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value='document' className='mt-4'>
            {isLoading ? (
              <div className='flex h-48 items-center justify-center'>
                <Loader2 className='h-6 w-6 animate-spin' />
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className='flex h-48 items-center justify-center text-muted-foreground'>
                No documents available
              </div>
            ) : (
              <ScrollArea className='h-64'>
                <div className='space-y-2 pr-4'>
                  {filteredAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
                        selectedAsset?.id === asset.id
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <div className='flex h-10 w-10 items-center justify-center rounded bg-primary/10'>
                        <FileText className='h-5 w-5 text-primary' />
                      </div>
                      <div className='flex-1 overflow-hidden'>
                        <p className='truncate font-medium'>{asset.name}</p>
                        <p className='truncate text-xs text-muted-foreground'>
                          {asset.filename} · {formatFileSize(asset.file_size)}
                        </p>
                      </div>
                      {asset.category && (
                        <Badge variant='secondary' className='shrink-0'>
                          {asset.category}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {selectedAsset && (
          <div className='space-y-3 border-t pt-4'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded bg-primary/10'>
                {selectedAsset.asset_type === 'image' ? (
                  <Image className='h-5 w-5 text-primary' />
                ) : (
                  <FileText className='h-5 w-5 text-primary' />
                )}
              </div>
              <div>
                <p className='font-medium'>{selectedAsset.name}</p>
                <p className='text-xs text-muted-foreground'>
                  {selectedAsset.filename}
                </p>
              </div>
            </div>
            <Textarea
              placeholder='Add a caption (optional)'
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
            />
          </div>
        )}

        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedAsset || sendMedia.isPending}
          >
            {sendMedia.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
