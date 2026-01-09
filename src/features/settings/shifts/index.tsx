import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Clock, Plus, Pencil, Trash2, Users } from 'lucide-react'
import {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  type ShiftWithAgentCount,
} from '@/api/shifts'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
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

const shiftFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(255).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  is_active: z.boolean(),
})

type ShiftForm = z.infer<typeof shiftFormSchema>

export function ShiftsSettings() {
  const { data: shifts = [], isLoading } = useShifts()
  const createMutation = useCreateShift()
  const updateMutation = useUpdateShift()
  const deleteMutation = useDeleteShift()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftWithAgentCount | null>(null)
  const [deletingShift, setDeletingShift] = useState<ShiftWithAgentCount | null>(null)

  const form = useForm<ShiftForm>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      name: '',
      description: '',
      start_time: '08:00',
      end_time: '14:00',
      is_active: true,
    },
  })

  const handleOpenDialog = (shift?: ShiftWithAgentCount) => {
    if (shift) {
      setEditingShift(shift)
      form.reset({
        name: shift.name,
        description: shift.description || '',
        start_time: shift.start_time,
        end_time: shift.end_time,
        is_active: shift.is_active,
      })
    } else {
      setEditingShift(null)
      form.reset({
        name: '',
        description: '',
        start_time: '08:00',
        end_time: '14:00',
        is_active: true,
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingShift(null)
    form.reset()
  }

  const onSubmit = async (data: ShiftForm) => {
    try {
      if (editingShift) {
        await updateMutation.mutateAsync({
          shiftId: editingShift.id,
          data: {
            name: data.name,
            description: data.description || undefined,
            start_time: data.start_time,
            end_time: data.end_time,
            is_active: data.is_active,
          },
        })
        toast.success('Shift updated successfully')
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          description: data.description || undefined,
          start_time: data.start_time,
          end_time: data.end_time,
          is_active: data.is_active,
        })
        toast.success('Shift created successfully')
      }
      handleCloseDialog()
    } catch (error) {
      handleServerError(error)
    }
  }

  const handleDelete = async () => {
    if (!deletingShift) return

    try {
      await deleteMutation.mutateAsync(deletingShift.id)
      toast.success('Shift deleted successfully')
      setDeleteDialogOpen(false)
      setDeletingShift(null)
    } catch (error) {
      handleServerError(error)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Shifts</h3>
        <p className='text-sm text-muted-foreground'>
          Configure work shifts for your agents. Shifts help organize agent schedules.
        </p>
      </div>
      <Separator />

      <div className='flex justify-end'>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className='mr-2 h-4 w-4' />
          Add Shift
        </Button>
      </div>

      {isLoading ? (
        <div className='text-center py-8 text-muted-foreground'>Loading shifts...</div>
      ) : shifts.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-10'>
            <Clock className='h-12 w-12 text-muted-foreground mb-4' />
            <p className='text-muted-foreground'>No shifts configured yet.</p>
            <Button variant='outline' className='mt-4' onClick={() => handleOpenDialog()}>
              Create your first shift
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {shifts.map((shift) => (
            <Card key={shift.id}>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <CardTitle className='text-base'>{shift.name}</CardTitle>
                    <Badge variant={shift.is_active ? 'default' : 'secondary'}>
                      {shift.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleOpenDialog(shift)}
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => {
                        setDeletingShift(shift)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
                {shift.description && (
                  <CardDescription>{shift.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-6 text-sm'>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-muted-foreground' />
                    <span>
                      {shift.start_time} - {shift.end_time}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4 text-muted-foreground' />
                    <span>{shift.agent_count} agents assigned</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShift ? 'Edit Shift' : 'Create Shift'}</DialogTitle>
            <DialogDescription>
              {editingShift
                ? 'Update the shift configuration.'
                : 'Create a new work shift for your agents.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Morning' {...field} />
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
                      <Input placeholder='Morning shift (08:00 - 14:00)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='start_time'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type='time' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='end_time'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type='time' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='is_active'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>Active</FormLabel>
                      <FormDescription>
                        Inactive shifts won't be available for agent assignment.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='button' variant='outline' onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type='submit' disabled={isPending}>
                  {isPending ? 'Saving...' : editingShift ? 'Save Changes' : 'Create Shift'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingShift?.name}"?
              {deletingShift && deletingShift.agent_count > 0 && (
                <span className='block mt-2 text-amber-600'>
                  Warning: {deletingShift.agent_count} agent(s) will be unassigned from this shift.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
