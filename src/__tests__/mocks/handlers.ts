/**
 * Mock handlers for MSW (Mock Service Worker).
 *
 * Use these handlers to mock API responses in tests.
 */
import { http, HttpResponse } from 'msw'

const API_BASE = '/api/v1'

// Mock data
export const mockAgents = [
  {
    id: 1,
    username: 'test_agent',
    full_name: 'Test Agent',
    role: 'agent',
    department: 'viufinder',
    is_online: true,
    is_available: true,
    active_chats: 0,
    max_chats: 10,
  },
]

export const mockContacts = [
  {
    id: 1,
    wa_id: '6281234567890',
    name: 'John Doe',
    phone: '+6281234567890',
    service_tag: 'viufinder',
    is_active: true,
    assigned_agent_id: null,
  },
  {
    id: 2,
    wa_id: '6281234567891',
    name: 'Jane Smith',
    phone: '+6281234567891',
    service_tag: 'viufinder_xp',
    is_active: true,
    assigned_agent_id: 1,
  },
]

export const mockMessages = [
  {
    id: 1,
    content: 'Hello!',
    direction: 'inbound',
    created_at: '2026-01-28T10:00:00Z',
    status: 'delivered',
  },
  {
    id: 2,
    content: 'Hi, how can I help?',
    direction: 'outbound',
    created_at: '2026-01-28T10:01:00Z',
    status: 'read',
  },
]

// MSW handlers
export const handlers = [
  // Auth
  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      access_token: 'mock_token_12345',
      token_type: 'bearer',
    })
  }),

  http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json(mockAgents[0])
  }),

  // Contacts
  http.get(`${API_BASE}/contacts`, () => {
    return HttpResponse.json(mockContacts)
  }),

  http.get(`${API_BASE}/contacts/:waId`, ({ params }) => {
    const contact = mockContacts.find((c) => c.wa_id === params.waId)
    if (!contact) {
      return HttpResponse.json({ detail: 'Contact not found' }, { status: 404 })
    }
    return HttpResponse.json(contact)
  }),

  // Chat
  http.get(`${API_BASE}/chat/:waId`, ({ params }) => {
    const contact = mockContacts.find((c) => c.wa_id === params.waId)
    if (!contact) {
      return HttpResponse.json({ detail: 'Contact not found' }, { status: 404 })
    }
    return HttpResponse.json({
      contact,
      messages: mockMessages,
      has_more: false,
    })
  }),

  http.post(`${API_BASE}/chat/:waId/send`, async ({ request }) => {
    const body = (await request.json()) as { text: string }
    return HttpResponse.json({
      id: 3,
      content: body.text,
      direction: 'outbound',
      created_at: new Date().toISOString(),
      status: 'pending',
    })
  }),

  // Agents
  http.get(`${API_BASE}/agents`, () => {
    return HttpResponse.json(mockAgents)
  }),

  // Stats
  http.get(`${API_BASE}/stats/overview`, () => {
    return HttpResponse.json({
      total_contacts: 100,
      active_conversations: 25,
      messages_today: 150,
      avg_response_time: 120,
    })
  }),
]
