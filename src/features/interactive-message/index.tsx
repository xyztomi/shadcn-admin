import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Trash2,
  Send,
  MessageSquare,
  List,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSendInteractiveMessage, type InteractiveMessageType } from '@/api/interactive'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

// Button message schema
const buttonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(20, 'Max 20 characters'),
  callback_data: z.string().min(1, 'Callback data is required').max(200, 'Max 200 characters'),
})

const buttonsFormSchema = z.object({
  recipient: z.string().min(10, 'Enter a valid phone number'),
  text: z.string().min(1, 'Message text is required'),
  header: z.string().optional(),
  footer: z.string().optional(),
  buttons: z.array(buttonSchema).min(1, 'At least 1 button required').max(3, 'Maximum 3 buttons'),
})

// Section list schema
const sectionRowSchema = z.object({
  title: z.string().min(1, 'Title is required').max(24, 'Max 24 characters'),
  callback_data: z.string().min(1, 'Callback data is required').max(200, 'Max 200 characters'),
  description: z.string().max(72, 'Max 72 characters').optional(),
})

const sectionSchema = z.object({
  title: z.string().min(1, 'Section title is required').max(24, 'Max 24 characters'),
  rows: z.array(sectionRowSchema).min(1, 'At least 1 row required'),
})

const sectionListFormSchema = z.object({
  recipient: z.string().min(10, 'Enter a valid phone number'),
  text: z.string().min(1, 'Message text is required'),
  header: z.string().optional(),
  footer: z.string().optional(),
  button_title: z.string().min(1, 'Button title is required').max(20, 'Max 20 characters'),
  sections: z.array(sectionSchema).min(1, 'At least 1 section required').max(10, 'Maximum 10 sections'),
})

type ButtonsForm = z.infer<typeof buttonsFormSchema>
type SectionListForm = z.infer<typeof sectionListFormSchema>

export function InteractiveMessage() {
  const [messageType, setMessageType] = useState<InteractiveMessageType>('buttons')
  const sendMutation = useSendInteractiveMessage()

  // Buttons form
  const buttonsForm = useForm<ButtonsForm>({
    resolver: zodResolver(buttonsFormSchema),
    defaultValues: {
      recipient: '',
      text: '',
      header: '',
      footer: '',
      buttons: [{ title: '', callback_data: '' }],
    },
  })

  const {
    fields: buttonFields,
    append: appendButton,
    remove: removeButton,
  } = useFieldArray({
    control: buttonsForm.control,
    name: 'buttons',
  })

  // Section list form
  const sectionListForm = useForm<SectionListForm>({
    resolver: zodResolver(sectionListFormSchema),
    defaultValues: {
      recipient: '',
      text: '',
      header: '',
      footer: '',
      button_title: '',
      sections: [{ title: '', rows: [{ title: '', callback_data: '', description: '' }] }],
    },
  })

  const {
    fields: sectionFields,
    append: appendSection,
    remove: removeSection,
  } = useFieldArray({
    control: sectionListForm.control,
    name: 'sections',
  })

  const onSubmitButtons = async (data: ButtonsForm) => {
    try {
      await sendMutation.mutateAsync({
        recipient: data.recipient,
        message_type: 'buttons',
        text: data.text,
        header: data.header || undefined,
        footer: data.footer || undefined,
        buttons: data.buttons,
      })
      toast.success('Interactive message sent!')
      buttonsForm.reset()
    } catch {
      toast.error('Failed to send message')
    }
  }

  const onSubmitSectionList = async (data: SectionListForm) => {
    // Count total rows
    const totalRows = data.sections.reduce((sum, section) => sum + section.rows.length, 0)
    if (totalRows > 10) {
      toast.error('Maximum 10 rows total across all sections')
      return
    }

    try {
      await sendMutation.mutateAsync({
        recipient: data.recipient,
        message_type: 'section_list',
        text: data.text,
        header: data.header || undefined,
        footer: data.footer || undefined,
        button_title: data.button_title,
        sections: data.sections,
      })
      toast.success('Interactive message sent!')
      sectionListForm.reset()
    } catch {
      toast.error('Failed to send message')
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <Smartphone className='h-5 w-5' />
          <h1 className='text-lg font-semibold'>Interactive Message</h1>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='grid gap-6 lg:grid-cols-2'>
          {/* Form Section */}
          <Card>
            <CardHeader>
              <CardTitle>Create Interactive Message</CardTitle>
              <CardDescription>
                Send WhatsApp interactive messages with buttons or selection lists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={messageType} onValueChange={(v) => setMessageType(v as InteractiveMessageType)}>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='buttons' className='gap-2'>
                    <MessageSquare className='h-4 w-4' />
                    Buttons
                  </TabsTrigger>
                  <TabsTrigger value='section_list' className='gap-2'>
                    <List className='h-4 w-4' />
                    Section List
                  </TabsTrigger>
                </TabsList>

                {/* Buttons Form */}
                <TabsContent value='buttons' className='mt-4'>
                  <Form {...buttonsForm}>
                    <form onSubmit={buttonsForm.handleSubmit(onSubmitButtons)} className='space-y-4'>
                      <FormField
                        control={buttonsForm.control}
                        name='recipient'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder='628123456789' {...field} />
                            </FormControl>
                            <FormDescription>Include country code without +</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={buttonsForm.control}
                        name='header'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Header (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder='Message header' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={buttonsForm.control}
                        name='text'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message Text</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='Enter your message...'
                                className='min-h-[100px]'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={buttonsForm.control}
                        name='footer'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Footer (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder='Message footer' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <Label>Buttons (max 3)</Label>
                          {buttonFields.length < 3 && (
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => appendButton({ title: '', callback_data: '' })}
                            >
                              <Plus className='mr-2 h-4 w-4' />
                              Add Button
                            </Button>
                          )}
                        </div>

                        {buttonFields.map((field, index) => (
                          <div key={field.id} className='space-y-2 rounded-lg border p-3'>
                            <div className='flex items-center justify-between'>
                              <span className='text-sm font-medium'>Button {index + 1}</span>
                              {buttonFields.length > 1 && (
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => removeButton(index)}
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              )}
                            </div>
                            <FormField
                              control={buttonsForm.control}
                              name={`buttons.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder='Button title (max 20 chars)' {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={buttonsForm.control}
                              name={`buttons.${index}.callback_data`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder='Callback data (e.g., action:start)' {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                      </div>

                      <Button type='submit' className='w-full' disabled={sendMutation.isPending}>
                        <Send className='mr-2 h-4 w-4' />
                        {sendMutation.isPending ? 'Sending...' : 'Send Message'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                {/* Section List Form */}
                <TabsContent value='section_list' className='mt-4'>
                  <Form {...sectionListForm}>
                    <form onSubmit={sectionListForm.handleSubmit(onSubmitSectionList)} className='space-y-4'>
                      <FormField
                        control={sectionListForm.control}
                        name='recipient'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder='628123456789' {...field} />
                            </FormControl>
                            <FormDescription>Include country code without +</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sectionListForm.control}
                        name='header'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Header (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder='Message header' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sectionListForm.control}
                        name='text'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message Text</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='Enter your message...'
                                className='min-h-[100px]'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sectionListForm.control}
                        name='footer'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Footer (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder='Message footer' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sectionListForm.control}
                        name='button_title'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Button Title</FormLabel>
                            <FormControl>
                              <Input placeholder='Select Option (max 20 chars)' {...field} />
                            </FormControl>
                            <FormDescription>The button text that opens the list</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <Label>Sections (max 10 rows total)</Label>
                          {sectionFields.length < 10 && (
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => appendSection({ title: '', rows: [{ title: '', callback_data: '', description: '' }] })}
                            >
                              <Plus className='mr-2 h-4 w-4' />
                              Add Section
                            </Button>
                          )}
                        </div>

                        {sectionFields.map((section, sectionIndex) => (
                          <SectionEditor
                            key={section.id}
                            sectionIndex={sectionIndex}
                            form={sectionListForm}
                            onRemove={() => removeSection(sectionIndex)}
                            canRemove={sectionFields.length > 1}
                          />
                        ))}
                      </div>

                      <Button type='submit' className='w-full' disabled={sendMutation.isPending}>
                        <Send className='mr-2 h-4 w-4' />
                        {sendMutation.isPending ? 'Sending...' : 'Send Message'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your message will appear on WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex justify-center'>
                <PhonePreview
                  messageType={messageType}
                  buttonsForm={buttonsForm}
                  sectionListForm={sectionListForm}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

// Section Editor Component
interface SectionEditorProps {
  sectionIndex: number
  form: ReturnType<typeof useForm<SectionListForm>>
  onRemove: () => void
  canRemove: boolean
}

function SectionEditor({ sectionIndex, form, onRemove, canRemove }: SectionEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `sections.${sectionIndex}.rows`,
  })

  return (
    <div className='space-y-3 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <span className='font-medium'>Section {sectionIndex + 1}</span>
        {canRemove && (
          <Button type='button' variant='ghost' size='sm' onClick={onRemove}>
            <Trash2 className='h-4 w-4' />
          </Button>
        )}
      </div>

      <FormField
        control={form.control}
        name={`sections.${sectionIndex}.title`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input placeholder='Section title (max 24 chars)' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className='space-y-2 pl-4'>
        <div className='flex items-center justify-between'>
          <Label className='text-sm'>Rows</Label>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => append({ title: '', callback_data: '', description: '' })}
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>

        {fields.map((row, rowIndex) => (
          <div key={row.id} className='space-y-2 rounded border bg-muted/50 p-2'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground'>Row {rowIndex + 1}</span>
              {fields.length > 1 && (
                <Button type='button' variant='ghost' size='sm' onClick={() => remove(rowIndex)}>
                  <Trash2 className='h-3 w-3' />
                </Button>
              )}
            </div>
            <FormField
              control={form.control}
              name={`sections.${sectionIndex}.rows.${rowIndex}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder='Row title (max 24 chars)' className='h-8 text-sm' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`sections.${sectionIndex}.rows.${rowIndex}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder='Description (optional, max 72 chars)' className='h-8 text-sm' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`sections.${sectionIndex}.rows.${rowIndex}.callback_data`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder='Callback data' className='h-8 text-sm' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Phone Preview Component
interface PhonePreviewProps {
  messageType: InteractiveMessageType
  buttonsForm: ReturnType<typeof useForm<ButtonsForm>>
  sectionListForm: ReturnType<typeof useForm<SectionListForm>>
}

function PhonePreview({ messageType, buttonsForm, sectionListForm }: PhonePreviewProps) {
  const buttonsValues = buttonsForm.watch()
  const sectionListValues = sectionListForm.watch()

  const values = messageType === 'buttons' ? buttonsValues : sectionListValues

  return (
    <div className='w-[280px] rounded-[2rem] border-4 border-gray-800 bg-gray-800 p-2 shadow-xl dark:border-gray-700'>
      {/* Phone notch */}
      <div className='mx-auto mb-2 h-5 w-24 rounded-full bg-gray-900' />

      {/* Screen */}
      <div className='h-[400px] overflow-hidden rounded-2xl bg-[#0b141a]'>
        {/* Header */}
        <div className='flex items-center gap-2 bg-[#202c33] px-3 py-2'>
          <div className='h-8 w-8 rounded-full bg-gray-500' />
          <div className='flex-1'>
            <div className='text-sm font-medium text-white'>Business</div>
            <div className='text-xs text-gray-400'>online</div>
          </div>
        </div>

        {/* Chat area */}
        <div className='flex h-[calc(100%-56px)] flex-col justify-end p-2'>
          {/* Message bubble */}
          <div className='max-w-[95%] rounded-lg bg-[#005c4b] p-2 text-white'>
            {values.header && (
              <div className='mb-1 text-sm font-semibold'>{values.header}</div>
            )}
            <div className='whitespace-pre-wrap text-sm'>
              {values.text || 'Your message preview...'}
            </div>
            {values.footer && (
              <div className='mt-1 text-xs text-gray-300'>{values.footer}</div>
            )}

            {/* Buttons preview */}
            {messageType === 'buttons' && buttonsValues.buttons && (
              <div className='mt-2 space-y-1'>
                {buttonsValues.buttons.map((btn, i) => (
                  <div
                    key={i}
                    className='rounded border border-[#00a884] bg-[#005c4b] py-1.5 text-center text-sm text-[#00a884]'
                  >
                    {btn.title || `Button ${i + 1}`}
                  </div>
                ))}
              </div>
            )}

            {/* Section list button preview */}
            {messageType === 'section_list' && (
              <div className='mt-2'>
                <div className='rounded border border-[#00a884] bg-[#005c4b] py-1.5 text-center text-sm text-[#00a884]'>
                  {sectionListValues.button_title || 'Select Option'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
