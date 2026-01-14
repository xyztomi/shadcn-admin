import { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SignedIn, SignedOut, SignInButton, useAuth, UserButton } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export const Route = createFileRoute('/clerk/_authenticated/user-management')({
  component: UserManagement,
})

function UserManagement() {
  const { isLoaded, isSignedIn, userId } = useAuth()

  if (!isLoaded) {
    return (
      <div className='flex h-svh items-center justify-center'>
        <Loader2 className='size-8 animate-spin' />
      </div>
    )
  }

  if (!isSignedIn) {
    return <SignInGate />
  }

  const managementUrl = useMemo(() => `https://dashboard.clerk.com/users/${userId ?? ''}`, [userId])

  return (
    <SignedIn>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <UserButton />
        </div>
      </Header>
      <Main>
        <div className='max-w-2xl space-y-6'>
          <div>
            <p className='text-sm font-semibold uppercase text-muted-foreground'>Clerk</p>
            <h1 className='text-3xl font-bold tracking-tight'>User Management</h1>
            <p className='text-muted-foreground'>
              Use this area to jump into Clerk&apos;s hosted dashboard for advanced user and role
              management. The native CRM view for agents will live under Settings → Agents.
            </p>
          </div>
          <div className='space-y-3 rounded-2xl border bg-card/70 p-6 shadow-sm'>
            <h2 className='text-lg font-semibold'>Manage accounts</h2>
            <p className='text-sm text-muted-foreground'>
              Open the Clerk dashboard to invite teammates, reset MFA, or revoke sessions. We surface a
              direct link personalized for your account below.
            </p>
            <Button asChild className='w-full sm:w-auto'>
              <a href={managementUrl} target='_blank' rel='noreferrer'>
                Open Clerk Dashboard
              </a>
            </Button>
          </div>
          <div className='rounded-2xl border border-dashed p-6 text-sm text-muted-foreground'>
            Looking for the legacy /users table? That demo view has been removed until we finish wiring the
            production-ready admin UI. Please reach out to the platform team if you need specific data exports.
          </div>
        </div>
      </Main>
    </SignedIn>
  )
}

function SignInGate() {
  return (
    <div className='flex h-svh flex-col items-center justify-center gap-4 text-center'>
      <Loader2 className='size-8 animate-spin text-muted-foreground' />
      <div className='space-y-1'>
        <p className='text-lg font-semibold'>Sign in required</p>
        <p className='text-sm text-muted-foreground'>Use your Clerk account to continue.</p>
      </div>
      <SignedOut>
        <SignInButton mode='modal'>
          <Button>Sign in with Clerk</Button>
        </SignInButton>
      </SignedOut>
    </div>
  )
}
