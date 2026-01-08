import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { Templates } from '@/features/templates'

export const Route = createFileRoute('/_authenticated/templates/')({
  beforeLoad: () => {
    const user = useAuthStore.getState().auth.user
    // Only allow admin and superuser roles
    if (user && user.role !== 'admin' && user.role !== 'superuser') {
      throw redirect({ to: '/' })
    }
  },
  component: Templates,
})
