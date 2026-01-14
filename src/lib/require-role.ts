import { redirect } from '@tanstack/react-router'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'

/**
 * Ensures only allowed roles can access a route.
 * Throws a redirect to the forbidden error page when the user lacks permissions.
 */
export function requireRole(allowed: Array<AuthUser['role']>) {
  const role = useAuthStore.getState().auth.user?.role
  if (!role || !allowed.includes(role)) {
    throw redirect({
      to: '/403',
    })
  }
}
