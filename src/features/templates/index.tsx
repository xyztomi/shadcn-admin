import { useState } from 'react'
import {
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileText,
  MoreHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useTemplates,
  useDeleteTemplate,
  useSyncTemplates,
  type MessageTemplate,
} from '@/api/templates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TemplateDialog } from './components/template-dialog'
import { TemplatePreviewDialog } from './components/template-preview-dialog'

const statusColors: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const categoryColors: Record<string, string> = {
  MARKETING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  UTILITY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  AUTHENTICATION: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

export function Templates() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)

  const { data: templates, isLoading } = useTemplates()
  const syncMutation = useSyncTemplates()
  const deleteMutation = useDeleteTemplate()

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync()
      toast.success('Templates synced successfully')
    } catch {
      toast.error('Failed to sync templates')
    }
  }

  const handleDelete = async () => {
    if (!selectedTemplate) return
    try {
      await deleteMutation.mutateAsync(selectedTemplate.id)
      toast.success('Template deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedTemplate(null)
    } catch {
      toast.error('Failed to delete template')
    }
  }

  const handleEdit = (template: MessageTemplate) => {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  const handlePreview = (template: MessageTemplate) => {
    setSelectedTemplate(template)
    setPreviewOpen(true)
  }

  const handleDeleteClick = (template: MessageTemplate) => {
    setSelectedTemplate(template)
    setDeleteDialogOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedTemplate(null)
    setDialogOpen(true)
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Message Templates</h2>
            <p className='text-muted-foreground'>
              Manage WhatsApp message templates for customer outreach.
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`}
              />
              Sync from WhatsApp
            </Button>
            <Button onClick={handleCreateNew}>
              <Plus className='mr-2 h-4 w-4' />
              Create Template
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <FileText className='h-4 w-4' />
              Templates
            </CardTitle>
            <CardDescription>
              WhatsApp-approved templates for sending messages outside the 24-hour window.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='space-y-3'>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className='h-12 w-full' />
                ))}
              </div>
            ) : !templates || templates.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <FileText className='mb-4 h-12 w-12 text-muted-foreground/50' />
                <h3 className='text-lg font-medium'>No templates found</h3>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Create a new template or sync from WhatsApp Business API.
                </p>
                <div className='mt-4 flex gap-2'>
                  <Button variant='outline' onClick={handleSync}>
                    <RefreshCw className='mr-2 h-4 w-4' />
                    Sync
                  </Button>
                  <Button onClick={handleCreateNew}>
                    <Plus className='mr-2 h-4 w-4' />
                    Create
                  </Button>
                </div>
              </div>
            ) : (
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='w-12'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className='font-medium'>
                          {template.name}
                        </TableCell>
                        <TableCell>{template.language}</TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className={categoryColors[template.category]}
                          >
                            {template.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className={statusColors[template.status]}
                          >
                            {template.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon'>
                                <MoreHorizontal className='h-4 w-4' />
                                <span className='sr-only'>Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() => handlePreview(template)}
                              >
                                <Eye className='mr-2 h-4 w-4' />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(template)}
                              >
                                <Pencil className='mr-2 h-4 w-4' />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() => handleDeleteClick(template)}
                              >
                                <Trash2 className='mr-2 h-4 w-4' />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Main>

      {/* Create/Edit Dialog */}
      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={selectedTemplate}
      />

      {/* Preview Dialog */}
      <TemplatePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        template={selectedTemplate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template &quot;{selectedTemplate?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
