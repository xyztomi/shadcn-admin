import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { api } from '@/api/client'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }): Promise<{ user: AuthUser }> => {
    const { auth } = useAuthStore.getState()

    // If no token, redirect to sign-in
    if (!auth.accessToken) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }

    // If we have a token but no user data, fetch it
    let user = auth.user
    if (!user) {
      try {
        const response = await api.get('/auth/me')
        user = response.data
        auth.setUser(user)
      } catch {
        // Token is invalid, clear it and redirect
        auth.reset()
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.href },
        })
      }
    }

    return { user: user! }
  },
  component: AuthenticatedLayout,
})
