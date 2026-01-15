import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Bot,
  Plus,
  Trash2,
  Save,
  MessageSquare,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useWelcomeSettings,
  useUpdateWelcomeSettings,
  useBoothSettings,
  useUpdateBoothSettings,
  type WelcomeMessageSettings,
  type BoothSelectionSettings,
} from '@/api/bot-handlers'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

// ----- Welcome Message Schema -----

const welcomeButtonSchema = z.object({
  title: z.string().min(1, 'Title required').max(20, 'Max 20 characters'),
  callback_data: z.string().min(1, 'Callback data required').max(200, 'Max 200 characters'),
})

const welcomeFormSchema = z.object({
  greeting_template: z.string().min(1, 'Greeting template is required'),
  footer: z.string().max(60, 'Max 60 characters'),
  buttons: z.array(welcomeButtonSchema).min(1, 'At least 1 button').max(3, 'Max 3 buttons'),
})

type WelcomeForm = z.infer<typeof welcomeFormSchema>

// ----- Booth Selection Schema -----

const boothRowSchema = z.object({
  key: z.string().min(1, 'Key required'),
  title: z.string().min(1, 'Title required').max(24, 'Max 24 characters'),
  description: z.string().max(72, 'Max 72 characters'),
})

const boothSectionSchema = z.object({
  title: z.string().min(1, 'Section title required').max(24, 'Max 24 characters'),
  booths: z.array(z.string()).min(1, 'At least 1 booth'),
})

const boothFormSchema = z.object({
  header: z.string().min(1, 'Header required'),
  message_template: z.string().min(1, 'Message template required'),
  footer: z.string().max(60, 'Max 60 characters'),
  button_title: z.string().min(1, 'Button title required').max(20, 'Max 20 characters'),
  booths: z.array(boothRowSchema).min(1, 'At least 1 booth'),
  sections: z.array(boothSectionSchema).min(1, 'At least 1 section'),
})

type BoothForm = z.infer<typeof boothFormSchema>

export function BotHandlers() {
  const [activeTab, setActiveTab] = useState('welcome')

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <Bot className='h-5 w-5' />
          <h1 className='text-lg font-semibold'>Bot Handlers</h1>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full max-w-md grid-cols-2'>
            <TabsTrigger value='welcome' className='gap-2'>
              <MessageSquare className='h-4 w-4' />
              Welcome Message
            </TabsTrigger>
            <TabsTrigger value='booths' className='gap-2'>
              <MapPin className='h-4 w-4' />
              Booth Selection
            </TabsTrigger>
          </TabsList>

          <TabsContent value='welcome' className='mt-6'>
            <WelcomeMessageEditor />
          </TabsContent>

          <TabsContent value='booths' className='mt-6'>
            <BoothSelectionEditor />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

// ----- Welcome Message Editor -----

function WelcomeMessageEditor() {
  const { data: settings, isLoading } = useWelcomeSettings()
  const updateMutation = useUpdateWelcomeSettings()

  const form = useForm<WelcomeForm>({
    resolver: zodResolver(welcomeFormSchema),
    defaultValues: {
      greeting_template: '',
      footer: '',
      buttons: [{ title: '', callback_data: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'buttons',
  })

  // Populate form when data loads
  useEffect(() => {
    if (settings) {
      form.reset({
        greeting_template: settings.greeting_template,
        footer: settings.footer,
        buttons: settings.buttons,
      })
    }
  }, [settings, form])

  const onSubmit = async (data: WelcomeForm) => {
    try {
      await updateMutation.mutateAsync(data as WelcomeMessageSettings)
      toast.success('Welcome message settings saved!')
    } catch {
      toast.error('Failed to save settings')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-4 w-72' />
        </CardHeader>
        <CardContent className='space-y-4'>
          <Skeleton className='h-32 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-24 w-full' />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='grid gap-6 lg:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle>Welcome Message Settings</CardTitle>
          <CardDescription>
            Configure the greeting message sent to new contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='greeting_template'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Greeting Template</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Halo {name}! 👋...'
                        className='min-h-32'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use <code className='rounded bg-muted px-1'>{'{name}'}</code> for the contact's name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='footer'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Footer Text</FormLabel>
                    <FormControl>
                      <Input placeholder='Pilih salah satu untuk melanjutkan' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label>Service Buttons (max 3)</Label>
                  {fields.length < 3 && (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => append({ title: '', callback_data: '' })}
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Add Button
                    </Button>
                  )}
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className='flex items-start gap-2'>
                    <div className='flex-1 space-y-2 rounded-lg border p-3'>
                      <FormField
                        control={form.control}
                        name={`buttons.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>Button Title</FormLabel>
                            <FormControl>
                              <Input placeholder='Viufinder' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`buttons.${index}.callback_data`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>Callback Data</FormLabel>
                            <FormControl>
                              <Input placeholder='service:viufinder' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => remove(index)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button type='submit' className='w-full' disabled={updateMutation.isPending}>
                <Save className='mr-2 h-4 w-4' />
                {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>How the message appears on WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <WelcomePreview form={form} />
        </CardContent>
      </Card>
    </div>
  )
}

// ----- Booth Selection Editor -----

function BoothSelectionEditor() {
  const { data: settings, isLoading } = useBoothSettings()
  const updateMutation = useUpdateBoothSettings()

  const form = useForm<BoothForm>({
    resolver: zodResolver(boothFormSchema),
    defaultValues: {
      header: '',
      message_template: '',
      footer: '',
      button_title: '',
      booths: [],
      sections: [],
    },
  })

  const { fields: boothFields, append: appendBooth, remove: removeBooth } = useFieldArray({
    control: form.control,
    name: 'booths',
  })

  const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({
    control: form.control,
    name: 'sections',
  })

  // Populate form when data loads
  useEffect(() => {
    if (settings) {
      form.reset({
        header: settings.header,
        message_template: settings.message_template,
        footer: settings.footer,
        button_title: settings.button_title,
        booths: settings.booths,
        sections: settings.sections,
      })
    }
  }, [settings, form])

  const onSubmit = async (data: BoothForm) => {
    // Count total rows
    const totalRows = data.sections.reduce((sum, section) => sum + section.booths.length, 0)
    if (totalRows > 10) {
      toast.error('Maximum 10 booths total across all sections')
      return
    }

    try {
      await updateMutation.mutateAsync(data as BoothSelectionSettings)
      toast.success('Booth selection settings saved!')
    } catch {
      toast.error('Failed to save settings')
    }
  }

  const watchBooths = form.watch('booths')

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-4 w-72' />
        </CardHeader>
        <CardContent className='space-y-4'>
          <Skeleton className='h-32 w-full' />
          <Skeleton className='h-10 w-full' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='grid gap-6 xl:grid-cols-3'>
          {/* Message Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Message Settings</CardTitle>
              <CardDescription>Configure the booth selection prompt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <FormField
                  control={form.control}
                  name='header'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Header</FormLabel>
                      <FormControl>
                        <Input placeholder='Pilih Booth Anda' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='message_template'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Template</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Anda memilih *{service}*...'
                          className='min-h-24'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use <code className='rounded bg-muted px-1'>{'{service}'}</code> for selected service
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='footer'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer</FormLabel>
                      <FormControl>
                        <Input placeholder='⚡ Powered by Viufinder' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='button_title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>List Button Title</FormLabel>
                      <FormControl>
                        <Input placeholder='Pilih Booth' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type='submit' className='w-full' disabled={updateMutation.isPending}>
                  <Save className='mr-2 h-4 w-4' />
                  {updateMutation.isPending ? 'Saving...' : 'Save All Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Booths List */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>Booths</CardTitle>
                  <CardDescription>Manage available booths</CardDescription>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => appendBooth({ key: '', title: '', description: '' })}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Booth
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 max-h-96 overflow-y-auto pr-2'>
                {boothFields.map((field, index) => (
                  <div key={field.id} className='flex items-start gap-2'>
                    <div className='flex-1 space-y-1 rounded-lg border p-2'>
                      <div className='grid grid-cols-2 gap-2'>
                        <FormField
                          control={form.control}
                          name={`booths.${index}.key`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder='Key' className='h-8 text-sm' {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`booths.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder='Title' className='h-8 text-sm' {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`booths.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder='Description' className='h-8 text-sm' {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8'
                      onClick={() => removeBooth(index)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>Sections</CardTitle>
                  <CardDescription>Organize booths into sections (max 10 total)</CardDescription>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => appendSection({ title: '', booths: [] })}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {sectionFields.map((section, sectionIndex) => (
                  <SectionEditor
                    key={section.id}
                    sectionIndex={sectionIndex}
                    form={form}
                    availableBooths={watchBooths}
                    onRemove={() => removeSection(sectionIndex)}
                    canRemove={sectionFields.length > 1}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  )
}

// ----- Section Editor Component -----

interface SectionEditorProps {
  sectionIndex: number
  form: ReturnType<typeof useForm<BoothForm>>
  availableBooths: BoothForm['booths']
  onRemove: () => void
  canRemove: boolean
}

function SectionEditor({ sectionIndex, form, availableBooths, onRemove, canRemove }: SectionEditorProps) {
  const sectionBooths = form.watch(`sections.${sectionIndex}.booths`)

  const toggleBooth = (boothKey: string) => {
    const current = sectionBooths || []
    if (current.includes(boothKey)) {
      form.setValue(`sections.${sectionIndex}.booths`, current.filter(b => b !== boothKey))
    } else {
      form.setValue(`sections.${sectionIndex}.booths`, [...current, boothKey])
    }
  }

  return (
    <div className='rounded-lg border p-3 space-y-2'>
      <div className='flex items-center justify-between'>
        <FormField
          control={form.control}
          name={`sections.${sectionIndex}.title`}
          render={({ field }) => (
            <FormItem className='flex-1'>
              <FormControl>
                <Input placeholder='Section title' className='h-8' {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        {canRemove && (
          <Button type='button' variant='ghost' size='icon' className='h-8 w-8 ml-2' onClick={onRemove}>
            <Trash2 className='h-4 w-4' />
          </Button>
        )}
      </div>

      <div className='flex flex-wrap gap-1'>
        {availableBooths.map((booth) => (
          <Badge
            key={booth.key}
            variant={sectionBooths?.includes(booth.key) ? 'default' : 'outline'}
            className='cursor-pointer'
            onClick={() => toggleBooth(booth.key)}
          >
            {booth.title || booth.key}
          </Badge>
        ))}
      </div>

      {sectionBooths?.length === 0 && (
        <p className='text-xs text-muted-foreground'>Click booths above to add them to this section</p>
      )}
    </div>
  )
}

// ----- Welcome Preview Component -----

interface WelcomePreviewProps {
  form: ReturnType<typeof useForm<WelcomeForm>>
}

function WelcomePreview({ form }: WelcomePreviewProps) {
  const values = form.watch()
  const previewText = values.greeting_template?.replace('{name}', 'John') || 'Your message preview...'

  return (
    <div className='flex justify-center'>
      <div className='w-72 rounded-3xl border-4 border-gray-800 bg-gray-800 p-2 shadow-xl dark:border-gray-700'>
        <div className='mx-auto mb-2 h-5 w-24 rounded-full bg-gray-900' />
        <div className='h-96 overflow-hidden rounded-2xl bg-[#0b141a]'>
          <div className='flex items-center gap-2 bg-[#202c33] px-3 py-2'>
            <div className='h-8 w-8 rounded-full bg-gray-500' />
            <div className='flex-1'>
              <div className='text-sm font-medium text-white'>Business</div>
              <div className='text-xs text-gray-400'>online</div>
            </div>
          </div>
          <div className='flex h-[calc(100%-56px)] flex-col justify-end p-2'>
            <div className='max-w-[95%] rounded-lg bg-[#005c4b] p-2 text-white'>
              <div className='whitespace-pre-wrap text-sm'>{previewText}</div>
              {values.footer && (
                <div className='mt-1 text-xs text-gray-300'>{values.footer}</div>
              )}
              {values.buttons && values.buttons.length > 0 && (
                <div className='mt-2 space-y-1'>
                  {values.buttons.map((btn, i) => (
                    <div
                      key={i}
                      className='rounded border border-[#00a884] bg-[#005c4b] py-1.5 text-center text-sm text-[#00a884]'
                    >
                      {btn.title || `Button ${i + 1}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
