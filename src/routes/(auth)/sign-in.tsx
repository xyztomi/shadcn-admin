import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { SignIn } from '@/features/auth/sign-in'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    const { auth } = useAuthStore.getState()
    // If already logged in, redirect to target or home
    if (auth.accessToken && auth.user) {
      throw redirect({ to: search.redirect || '/' })
    }
  },
  component: SignIn,
})
