import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Shield,
  Building2,
  Key,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react'
import { useCurrentAgent, useUpdateProfile, useChangePassword } from '@/api/auth'
import { handleServerError } from '@/lib/handle-server-error'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useComplaintRates } from '@/api/analytics'
import { ComplaintRateCard } from './complaint-rate-card'

// Profile update schema
const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
})

type ProfileForm = z.infer<typeof profileSchema>

// Password change schema
const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(6, 'New password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

type PasswordForm = z.infer<typeof passwordSchema>

export function Profile() {
  const { data: agent, isLoading } = useCurrentAgent()
  const updateProfileMutation = useUpdateProfile()
  const changePasswordMutation = useChangePassword()

  // Get complaint rate stats for this agent
  const { data: complaintData, isLoading: complaintsLoading } = useComplaintRates(
    undefined,
    undefined,
    agent?.id
  )

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: agent?.full_name || '',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      await updateProfileMutation.mutateAsync(data)
      toast.success('Profile updated successfully')
    } catch (error) {
      handleServerError(error)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await changePasswordMutation.mutateAsync({
        current_password: data.current_password,
        new_password: data.new_password,
      })
      toast.success('Password changed successfully')
      passwordForm.reset()
    } catch (error) {
      handleServerError(error)
    }
  }

  // Get initials from full_name or username
  const getInitials = () => {
    if (agent?.full_name) {
      return agent.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return agent?.username?.slice(0, 2).toUpperCase() || 'U'
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superuser':
        return 'destructive'
      case 'admin':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getDepartmentLabel = (dept: string) => {
    return dept === 'viufinder_xp' ? 'Viufinder XP' : 'Viufinder'
  }

  return (
    <>
      <Header>
        <h1 className='text-lg font-semibold'>My Profile</h1>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mx-auto max-w-4xl space-y-6'>
          {/* Profile Header Card */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-4'>
                {isLoading ? (
                  <Skeleton className='h-20 w-20 rounded-full' />
                ) : (
                  <Avatar className='h-20 w-20'>
                    <AvatarFallback className='text-2xl'>
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className='space-y-1'>
                  {isLoading ? (
                    <>
                      <Skeleton className='h-8 w-48' />
                      <Skeleton className='h-4 w-32' />
                    </>
                  ) : (
                    <>
                      <h2 className='text-2xl font-bold'>
                        {agent?.full_name || agent?.username}
                      </h2>
                      <p className='text-muted-foreground'>@{agent?.username}</p>
                      <div className='flex gap-2 pt-1'>
                        <Badge variant={getRoleBadgeVariant(agent?.role || '')}>
                          <Shield className='mr-1 h-3 w-3' />
                          {agent?.role}
                        </Badge>
                        <Badge variant='outline'>
                          <Building2 className='mr-1 h-3 w-3' />
                          {getDepartmentLabel(agent?.department || '')}
                        </Badge>
                        <Badge variant={agent?.is_online ? 'default' : 'secondary'}>
                          {agent?.is_online ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className='grid gap-6 md:grid-cols-2'>
            {/* Profile Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                  <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-muted-foreground'>
                        Username
                      </label>
                      <div className='flex items-center gap-2 rounded-md bg-muted px-3 py-2'>
                        <User className='h-4 w-4 text-muted-foreground' />
                        <span>{agent?.username}</span>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Username cannot be changed
                      </p>
                    </div>

                    <FormField
                      control={profileForm.control}
                      name='full_name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                              <Input
                                {...field}
                                className='pl-10'
                                placeholder='Your full name'
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button
                      type='submit'
                      disabled={
                        updateProfileMutation.isPending ||
                        !profileForm.formState.isDirty
                      }
                    >
                      {updateProfileMutation.isPending ? (
                        'Saving...'
                      ) : (
                        <>
                          <Save className='mr-2 h-4 w-4' />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>

            {/* Change Password Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Key className='h-5 w-5' />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Secure your account with a new password
                </CardDescription>
              </CardHeader>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                  <CardContent className='space-y-4'>
                    <FormField
                      control={passwordForm.control}
                      name='current_password'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Input
                                {...field}
                                type={showCurrentPassword ? 'text' : 'password'}
                                placeholder='Enter current password'
                              />
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
                                onClick={() =>
                                  setShowCurrentPassword(!showCurrentPassword)
                                }
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className='h-4 w-4' />
                                ) : (
                                  <Eye className='h-4 w-4' />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name='new_password'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Input
                                {...field}
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder='Enter new password'
                              />
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className='h-4 w-4' />
                                ) : (
                                  <Eye className='h-4 w-4' />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Must be at least 6 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name='confirm_password'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Input
                                {...field}
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder='Confirm new password'
                              />
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className='h-4 w-4' />
                                ) : (
                                  <Eye className='h-4 w-4' />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button
                      type='submit'
                      variant='secondary'
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? (
                        'Changing...'
                      ) : (
                        <>
                          <Key className='mr-2 h-4 w-4' />
                          Change Password
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </div>

          {/* Complaint Rate Stats */}
          <Separator />
          <div>
            <h3 className='mb-4 text-lg font-semibold'>Your Performance Metrics</h3>
            <ComplaintRateCard
              data={complaintData}
              isLoading={complaintsLoading || isLoading}
              agentId={agent?.id}
            />
          </div>
        </div>
      </Main>
    </>
  )
}
