import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useCreateAgent,
  useUpdateAgent,
  type CreateAgentPayload,
  type UpdateAgentPayload,
} from '@/api/agents'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PasswordInput } from '@/components/password-input'
import { useAgentsContext } from './agents-provider'

const agentFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().optional(),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email().optional().or(z.literal('')),
  department: z.enum(['viufinder', 'viufinder_xp']),
  role: z.enum(['admin', 'manager', 'agent']),
  max_chats: z.number().int().min(0),
})

type AgentForm = z.infer<typeof agentFormSchema>

export function AgentsActionDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useAgentsContext()
  const createMutation = useCreateAgent()
  const updateMutation = useUpdateAgent()

  const isEdit = open === 'edit' && currentRow !== null
  const isAdd = open === 'add'

  const form = useForm<AgentForm>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      username: '',
      password: '',
      full_name: '',
      email: '',
      department: 'viufinder',
      role: 'agent',
      max_chats: 0,
    },
  })

  // Reset form with current row values when editing
  useEffect(() => {
    if (isEdit && currentRow) {
      form.reset({
        username: currentRow.username,
        full_name: currentRow.full_name,
        email: currentRow.email || '',
        department: currentRow.department,
        role: currentRow.role,
        max_chats: currentRow.max_chats,
        password: '',
      })
    } else if (isAdd) {
      form.reset({
        username: '',
        password: '',
        full_name: '',
        email: '',
        department: 'viufinder',
        role: 'agent',
        max_chats: 0,
      })
    }
  }, [isEdit, isAdd, currentRow, form])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(null)
      setCurrentRow(null)
      form.reset()
    }
  }

  const onSubmit = async (data: AgentForm) => {
    try {
      if (isEdit && currentRow) {
        const payload: UpdateAgentPayload = {
          full_name: data.full_name,
          email: data.email || undefined,
          department: data.department,
          role: data.role,
          max_chats: data.max_chats,
        }
        if (data.password) {
          payload.password = data.password
        }
        await updateMutation.mutateAsync({ agentId: currentRow.id, data: payload })
        toast.success('Agent updated successfully')
      } else {
        if (!data.password) {
          form.setError('password', { message: 'Password is required' })
          return
        }
        const payload: CreateAgentPayload = {
          username: data.username,
          password: data.password,
          full_name: data.full_name,
          email: data.email || undefined,
          department: data.department,
          role: data.role,
          max_chats: data.max_chats,
        }
        await createMutation.mutateAsync(payload)
        toast.success('Agent created successfully')
      }
      handleOpenChange(false)
    } catch (error) {
      handleServerError(error)
    }
  }

  if (!isEdit && !isAdd) return null

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isEdit || isAdd} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update agent details. Leave password empty to keep unchanged.'
              : 'Create a new customer service agent.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='johndoe'
                      {...field}
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEdit ? 'New Password (optional)' : 'Password'}</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='••••••••' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='full_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder='John Doe' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder='john@example.com' type='email' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='department'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select department' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='viufinder'>VIUFinder</SelectItem>
                        <SelectItem value='viufinder_xp'>VF XP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='admin'>Admin</SelectItem>
                        <SelectItem value='manager'>Manager</SelectItem>
                        <SelectItem value='agent'>Agent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='max_chats'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Concurrent Chats (0 = unlimited)</FormLabel>
                  <FormControl>
                    <Input type='number' min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Agent'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
