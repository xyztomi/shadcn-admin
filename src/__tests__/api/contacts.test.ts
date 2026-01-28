/**
 * Example API hook tests.
 *
 * Demonstrates testing TanStack Query hooks with MSW.
 */
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '../mocks/server'
import { createWrapper } from '../setup'

// Start MSW server before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useContacts', () => {
  it('fetches contacts successfully', async () => {
    // Import dynamically to ensure MSW is set up first
    const { useContacts } = await import('@/api/contacts')

    const { result } = renderHook(() => useContacts(), {
      wrapper: createWrapper(),
    })

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    // Wait for data
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Check data
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].wa_id).toBe('6281234567890')
  })
})

describe('useAgents', () => {
  it('fetches agents successfully', async () => {
    const { useAllAgents } = await import('@/api/agents')

    const { result } = renderHook(() => useAllAgents(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].username).toBe('test_agent')
  })
})
