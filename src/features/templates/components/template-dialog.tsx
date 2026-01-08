import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import {
  useCreateTemplate,
  useUpdateTemplate,
  type MessageTemplate,
  type CreateTemplatePayload,
} from '@/api/templates'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

const componentSchema = z.object({
  type: z.enum(['HEADER', 'BODY', 'FOOTER', 'BUTTONS']),
  format: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
  text: z.string().optional(),
})

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(512)
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  language: z.string().min(1, 'Language is required'),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  components: z.array(componentSchema).min(1, 'At least one component is required'),
})

type FormValues = z.infer<typeof formSchema>

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: MessageTemplate | null
}

const languages = [
  { value: 'en', label: 'English' },
  { value: 'en_US', label: 'English (US)' },
  { value: 'id', label: 'Indonesian' },
  { value: 'ms', label: 'Malay' },
  { value: 'zh_CN', label: 'Chinese (Simplified)' },
  { value: 'zh_TW', label: 'Chinese (Traditional)' },
]

const categories = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'AUTHENTICATION', label: 'Authentication' },
]

const componentTypes = [
  { value: 'HEADER', label: 'Header' },
  { value: 'BODY', label: 'Body' },
  { value: 'FOOTER', label: 'Footer' },
]

export function TemplateDialog({
  open,
  onOpenChange,
  template,
}: TemplateDialogProps) {
  const isEditing = !!template
  const createMutation = useCreateTemplate()
  const updateMutation = useUpdateTemplate()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      language: 'en',
      category: 'UTILITY',
      components: [{ type: 'BODY', text: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'components',
  })

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        language: template.language,
        category: template.category,
        components: template.components.map((c) => ({
          type: c.type,
          format: c.format,
          text: c.text || '',
        })),
      })
    } else {
      form.reset({
        name: '',
        language: 'en',
        category: 'UTILITY',
        components: [{ type: 'BODY', text: '' }],
      })
    }
  }, [template, form])

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: CreateTemplatePayload = {
        name: values.name,
        language: values.language,
        category: values.category,
        components: values.components.map((c) => ({
          type: c.type,
          format: c.format,
          text: c.text,
        })),
      }

      if (isEditing && template) {
        await updateMutation.mutateAsync({
          id: template.id,
          payload: { components: payload.components },
        })
        toast.success('Template updated successfully')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Template created successfully')
      }
      onOpenChange(false)
    } catch {
      toast.error(isEditing ? 'Failed to update template' : 'Failed to create template')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the template components. Note: Name and category cannot be changed after creation.'
              : 'Create a new WhatsApp message template. Templates must be approved by Meta before use.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='order_confirmation'
                      {...field}
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormDescription>
                    Lowercase letters, numbers, and underscores only.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='language'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select language' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select category' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <FormLabel>Components</FormLabel>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => append({ type: 'BODY', text: '' })}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Component
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='space-y-3 rounded-lg border p-4'
                >
                  <div className='flex items-center justify-between'>
                    <FormField
                      control={form.control}
                      name={`components.${index}.type`}
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className='w-40'>
                                <SelectValue placeholder='Type' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {componentTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => remove(index)}
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`components.${index}.text`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder='Enter template text. Use {{1}}, {{2}} for variables.'
                            className='min-h-20'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Use {'{{1}}'}, {'{{2}}'}, etc. for dynamic variables.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending
                  ? isEditing
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditing
                    ? 'Update Template'
                    : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
