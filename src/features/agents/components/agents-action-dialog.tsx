import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AxiosError } from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useCreateAgent,
  useUpdateAgent,
  type CreateAgentPayload,
  type UpdateAgentPayload,
} from '@/api/agents'
import { useShifts } from '@/api/shifts'
import { handleServerError } from '@/lib/handle-server-error'
import { AgentDepartment, AgentRole, AgentCity } from '@/types'
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
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: 'Password must be at least 6 characters',
    }),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email().optional().or(z.literal('')),
  department: z.nativeEnum(AgentDepartment),
  city: z.nativeEnum(AgentCity),
  role: z.nativeEnum(AgentRole),
  shift_id: z.string().optional(),
})

type AgentForm = z.infer<typeof agentFormSchema>

const agentFormFields: Array<keyof AgentForm> = [
  'username',
  'password',
  'full_name',
  'email',
  'department',
  'city',
  'role',
  'shift_id',
]

const agentFormFieldSet = new Set(agentFormFields)

function isAgentFormField(value: unknown): value is keyof AgentForm {
  return typeof value === 'string' && agentFormFieldSet.has(value as keyof AgentForm)
}

export function AgentsActionDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useAgentsContext()
  const createMutation = useCreateAgent()
  const updateMutation = useUpdateAgent()
  const { data: shifts = [] } = useShifts({ is_active: true })

  const isEdit = open === 'edit' && currentRow !== null
  const isAdd = open === 'add'

  const form = useForm<AgentForm>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      username: '',
      password: '',
      full_name: '',
      email: '',
      department: AgentDepartment.VIUFINDER,
      city: AgentCity.ALL,
      role: AgentRole.AGENT,
      shift_id: '',
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
        city: currentRow.city || AgentCity.ALL,
        role: currentRow.role,
        password: '',
        shift_id: currentRow.shift_id?.toString() || '',
      })
    } else if (isAdd) {
      form.reset({
        username: '',
        password: '',
        full_name: '',
        email: '',
        department: AgentDepartment.VIUFINDER,
        city: AgentCity.ALL,
        role: AgentRole.AGENT,
        shift_id: '',
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
      const shiftId = data.shift_id ? parseInt(data.shift_id) : null

      if (isEdit && currentRow) {
        const payload: UpdateAgentPayload = {
          full_name: data.full_name,
          email: data.email || undefined,
          department: data.department,
          city: data.city,
          role: data.role,
          shift_id: shiftId,
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
          city: data.city,
          role: data.role,
          shift_id: shiftId,
        }
        await createMutation.mutateAsync(payload)
        toast.success('Agent created successfully')
      }
      handleOpenChange(false)
    } catch (error) {
      if (error instanceof AxiosError) {
        const detail = error.response?.data?.detail
        if (Array.isArray(detail)) {
          detail.forEach((err: { loc?: unknown[]; msg?: string }) => {
            const locField = Array.isArray(err?.loc) ? err.loc[1] : undefined
            if (isAgentFormField(locField)) {
              form.setError(locField, {
                message: err?.msg ?? 'Invalid value',
              })
            }
          })
        }
      }
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
                    <Select
                      onValueChange={(value) => field.onChange(value as AgentDepartment)}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select department' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AgentDepartment.VIUFINDER}>VIUFinder</SelectItem>
                        <SelectItem value={AgentDepartment.VIUFINDER_XP}>VF XP</SelectItem>
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
                    <Select
                      onValueChange={(value) => field.onChange(value as AgentRole)}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AgentRole.SUPERUSER}>Superuser</SelectItem>
                        <SelectItem value={AgentRole.ADMIN}>Admin</SelectItem>
                        <SelectItem value={AgentRole.AGENT}>Agent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='city'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City Assignment</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value as AgentCity)}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select city' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={AgentCity.ALL}>All Cities</SelectItem>
                      <SelectItem value={AgentCity.JAKARTA}>Jakarta</SelectItem>
                      <SelectItem value={AgentCity.BANDUNG}>Bandung</SelectItem>
                      <SelectItem value={AgentCity.SURABAYA}>Surabaya</SelectItem>
                      <SelectItem value={AgentCity.MEDAN}>Medan</SelectItem>
                      <SelectItem value={AgentCity.SEMARANG}>Semarang</SelectItem>
                      <SelectItem value={AgentCity.MAKASSAR}>Makassar</SelectItem>
                      <SelectItem value={AgentCity.PALEMBANG}>Palembang</SelectItem>
                      <SelectItem value={AgentCity.TANGERANG}>Tangerang</SelectItem>
                      <SelectItem value={AgentCity.DEPOK}>Depok</SelectItem>
                      <SelectItem value={AgentCity.BEKASI}>Bekasi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='shift_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}
                    value={field.value || '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select shift (optional)' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='__none__'>No shift assigned</SelectItem>
                      {shifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id.toString()}>
                          {shift.name} ({shift.start_time} - {shift.end_time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
