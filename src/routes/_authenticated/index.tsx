import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: ({ context }) => {
    const user = context.user
    const role = user?.role

    // Redirect based on role
    if (role === 'admin' || role === 'superuser') {
      throw redirect({ to: '/dashboard/admin' })
    }
    // Default to agent dashboard
    throw redirect({ to: '/dashboard/agent' })
  },
  component: () => null,
})
