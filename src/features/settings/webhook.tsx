import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useWebhookSettings, useUpdateWebhookSettings } from '@/api/settings'
import { handleServerError } from '@/lib/handle-server-error'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'

const webhookSchema = z.object({
  callback_url: z
    .string()
    .url('Enter a valid URL, including https://')
    .max(255, 'URL is too long'),
})

type WebhookForm = z.infer<typeof webhookSchema>

export function WebhookSettings() {
  const { data, isLoading } = useWebhookSettings()
  const updateMutation = useUpdateWebhookSettings()

  const form = useForm<WebhookForm>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      callback_url: '',
    },
  })

  useEffect(() => {
    if (data) {
      form.reset({ callback_url: data.callback_url ?? '' })
    }
  }, [data, form])

  const onSubmit = async (values: WebhookForm) => {
    try {
      await updateMutation.mutateAsync(values)
      toast.success('Webhook URL updated')
    } catch (error) {
      handleServerError(error)
    }
  }

  if (isLoading) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>WhatsApp Webhook</CardTitle>
          <CardDescription>Loading current configuration…</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-10 w-full' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>WhatsApp Webhook</CardTitle>
        <CardDescription>
          Update the public callback URL registered with Meta so WhatsApp can deliver
          inbound messages and status updates to this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='callback_url'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Callback URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='https://example.com/webhook'
                      autoComplete='off'
                      spellCheck={false}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex flex-col gap-2 text-sm text-muted-foreground'>
              <p>
                Make sure the URL is publicly reachable (no localhost) and already exposes the
                <code className='mx-1 rounded bg-muted px-1 py-0.5 text-xs'>/webhook</code> endpoint.
              </p>
              {data?.updated_at && (
                <p>
                  Last updated:{' '}
                  {format(new Date(data.updated_at), 'MMM d, yyyy HH:mm')} (server time)
                </p>
              )}
            </div>
            <Button type='submit' disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save Webhook URL'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
