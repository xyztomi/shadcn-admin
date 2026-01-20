import { useState, useRef } from 'react'
import { Trash2, Loader2, ImageIcon, FileText, Upload, Search, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useMediaAssets,
  useMediaAssetCategories,
  useUploadMediaAsset,
  useDeleteMediaAsset,
  type MediaAsset,
} from '@/api/media-assets'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DOC_SIZE = 16 * 1024 * 1024 // 16MB

const uploadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  category: z.string().max(50, 'Category too long').optional(),
})

type UploadFormValues = z.infer<typeof uploadSchema>

export function MediaAssetsSettings() {
  const [selectedTab, setSelectedTab] = useState<'image' | 'document'>('image')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [deletingAsset, setDeletingAsset] = useState<MediaAsset | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: allAssets, isLoading } = useMediaAssets({
    asset_type: selectedTab,
    category: selectedCategory || undefined,
  })

  // Filter by search query client-side
  const assets = allAssets?.filter(asset =>
    !searchQuery || asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const { data: categories = [] } = useMediaAssetCategories()
  const uploadAsset = useUploadMediaAsset()
  const deleteAsset = useDeleteMediaAsset()

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isDoc = ALLOWED_DOC_TYPES.includes(file.type)

    if (!isImage && !isDoc) {
      toast.error('Invalid file type. Allowed: JPEG, PNG, WebP, PDF, Word, Excel')
      return
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      toast.error('Image too large. Maximum size is 5MB')
      return
    }

    if (isDoc && file.size > MAX_DOC_SIZE) {
      toast.error('Document too large. Maximum size is 16MB')
      return
    }

    setSelectedFile(file)

    // Set default name from filename
    if (!form.getValues('name')) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      form.setValue('name', nameWithoutExt)
    }

    // Preview for images
    if (isImage) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleUploadOpen = () => {
    form.reset()
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsUploadOpen(true)
  }

  const handleUploadClose = () => {
    setIsUploadOpen(false)
    setSelectedFile(null)
    setPreviewUrl(null)
    form.reset()
    // Reset file input separately in effect
    const input = fileInputRef.current
    if (input) {
      input.value = ''
    }
  }

  const onSubmit = async (data: UploadFormValues) => {
    if (!selectedFile) {
      toast.error('Please select a file')
      return
    }

    try {
      await uploadAsset.mutateAsync({
        file: selectedFile,
        name: data.name,
        description: data.description,
        category: data.category,
      })
      toast.success('Media asset uploaded')
      // Reset state without accessing refs in this callback
      setIsUploadOpen(false)
      setSelectedFile(null)
      setPreviewUrl(null)
      form.reset()
    } catch {
      toast.error('Failed to upload media asset')
    }
  }

  const handleDelete = async () => {
    if (!deletingAsset) return
    try {
      await deleteAsset.mutateAsync(deletingAsset.id)
      toast.success('Media asset deleted')
      setDeletingAsset(null)
    } catch {
      toast.error('Failed to delete media asset')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className='h-5 w-5' />
    return <FileText className='h-5 w-5' />
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Media Assets</h3>
        <p className='text-sm text-muted-foreground'>
          Upload and manage images and documents that agents can send in chats.
          Only admins can upload and delete assets.
        </p>
      </div>
      <Separator />

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'image' | 'document')}>
        <div className='flex flex-wrap items-center gap-4'>
          <TabsList>
            <TabsTrigger value='image' className='gap-2'>
              <ImageIcon className='h-4 w-4' />
              Images
            </TabsTrigger>
            <TabsTrigger value='document' className='gap-2'>
              <FileText className='h-4 w-4' />
              Documents
            </TabsTrigger>
          </TabsList>

          <div className='relative flex-1 min-w-50'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search assets...'
              className='pl-9'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button onClick={handleUploadOpen}>
            <Upload className='mr-2 h-4 w-4' />
            Upload Asset
          </Button>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className='mt-4 flex flex-wrap gap-1'>
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className='cursor-pointer'
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categories.map((cat: string) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className='cursor-pointer'
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        )}

        <TabsContent value='image' className='mt-4'>
          {isLoading ? (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className='aspect-square rounded-lg' />
              ))}
            </div>
          ) : !assets?.length ? (
            <Card>
              <CardContent className='py-12 text-center text-muted-foreground'>
                <ImageIcon className='mx-auto mb-4 h-12 w-12 opacity-50' />
                <p>No images uploaded yet.</p>
                <p className='text-sm'>Upload images to make them available for agents.</p>
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {assets.map((asset: MediaAsset) => (
                <Card key={asset.id} className='group relative overflow-hidden'>
                  <div className='aspect-square'>
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/media-assets/${asset.id}/file`}
                      alt={asset.name}
                      className='h-full w-full object-cover'
                    />
                  </div>
                  <div className='absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100'>
                    <div className='absolute inset-x-0 bottom-0 p-3'>
                      <p className='truncate font-medium text-white'>{asset.name}</p>
                      <p className='text-xs text-white/70'>{formatFileSize(asset.file_size)}</p>
                      {asset.category && (
                        <Badge variant='secondary' className='mt-1'>
                          {asset.category}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant='destructive'
                      size='icon'
                      className='absolute right-2 top-2'
                      onClick={() => setDeletingAsset(asset)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value='document' className='mt-4'>
          {isLoading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-16 w-full' />
              ))}
            </div>
          ) : !assets?.length ? (
            <Card>
              <CardContent className='py-12 text-center text-muted-foreground'>
                <FileText className='mx-auto mb-4 h-12 w-12 opacity-50' />
                <p>No documents uploaded yet.</p>
                <p className='text-sm'>Upload documents to make them available for agents.</p>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-2'>
              {assets.map((asset: MediaAsset) => (
                <Card key={asset.id} className='flex items-center justify-between p-4'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted'>
                      {getFileIcon(asset.mime_type)}
                    </div>
                    <div>
                      <p className='font-medium'>{asset.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {asset.filename} • {formatFileSize(asset.file_size)}
                      </p>
                    </div>
                    {asset.category && (
                      <Badge variant='outline'>{asset.category}</Badge>
                    )}
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-destructive hover:text-destructive'
                    onClick={() => setDeletingAsset(asset)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Upload Media Asset</DialogTitle>
            <DialogDescription>
              Upload an image or document that agents can send to customers.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              {/* File Input */}
              <div className='space-y-2'>
                <FormLabel>File</FormLabel>
                <div
                  className='flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary'
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className='relative'>
                      <img
                        src={previewUrl}
                        alt='Preview'
                        className='max-h-40 rounded-lg object-contain'
                      />
                      <Button
                        type='button'
                        variant='destructive'
                        size='icon'
                        className='absolute -right-2 -top-2 h-6 w-6'
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFile(null)
                          setPreviewUrl(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                      >
                        <X className='h-3 w-3' />
                      </Button>
                    </div>
                  ) : selectedFile ? (
                    <div className='flex items-center gap-2'>
                      <FileText className='h-8 w-8 text-muted-foreground' />
                      <div>
                        <p className='text-sm font-medium'>{selectedFile.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6'
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                      >
                        <X className='h-3 w-3' />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className='mb-2 h-8 w-8 text-muted-foreground' />
                      <p className='text-sm text-muted-foreground'>
                        Click to select a file
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Images: JPEG, PNG, WebP (max 5MB)
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Documents: PDF, Word, Excel (max 16MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type='file'
                  className='hidden'
                  accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES].join(',')}
                  onChange={handleFileSelect}
                />
              </div>

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Asset name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Brief description of this asset'
                        className='resize-none'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., Products, Promotions' {...field} />
                    </FormControl>
                    <FormDescription>
                      Group assets by category for easier browsing
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type='button' variant='outline' onClick={handleUploadClose}>
                  Cancel
                </Button>
                <Button type='submit' disabled={!selectedFile || uploadAsset.isPending}>
                  {uploadAsset.isPending && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  Upload
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAsset} onOpenChange={() => setDeletingAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingAsset?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteAsset.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
