# WA CRM Frontend - AI Agent Guide

## Tech Stack

- **React 19 + Vite + SWC** - Fast builds with HMR
- **TanStack Router** - File-based routing with code-splitting
- **TanStack Query** - Server state, caching, mutations
- **TanStack Table** - Data tables with filters/pagination
- **Shadcn UI** - "new-york" variant, Tailwind CSS 4, RTL support
- **Zustand** - Client state (auth only)
- **Axios** - HTTP client with JWT interceptor

## Project Structure

```
src/
├── api/              # API client + TanStack Query hooks
│   ├── client.ts     # Axios instance with auth interceptor
│   ├── contacts.ts   # useContacts, useContact, etc.
│   └── chat.ts       # useConversation, useSendMessage
├── features/         # Domain modules (main pages)
│   └── {domain}/
│       ├── index.tsx       # Page component
│       ├── components/     # Domain UI
│       ├── constants/      # Domain constants
│       └── data/           # Types, schemas
├── routes/           # TanStack Router (thin wrappers)
├── components/
│   ├── ui/           # Shadcn (don't edit directly)
│   └── layout/       # App shell, sidebar
├── hooks/            # Shared hooks (use-websocket, etc.)
├── stores/           # Zustand (auth-store.ts)
├── lib/              # Utilities (cn, cookies, error handling)
└── styles/           # Tailwind config, theme.css
```

## Key Patterns

### API Integration ([api/](src/api/))
```typescript
// api/client.ts - pre-configured with JWT
import { api } from '@/api/client'

// Query hooks pattern
export function useContacts(filters?: ContactFilters) {
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => api.get('/contacts', { params: filters }).then(r => r.data),
  })
}

// Mutation pattern with cache invalidation
export function useAssignContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ wa_id, agent_id }) => api.post(`/contacts/${wa_id}/assign`, { agent_id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  })
}
```

### WebSocket Integration ([hooks/use-websocket.ts](src/hooks/use-websocket.ts))
```typescript
// Singleton connection, auto-reconnect, TanStack Query integration
const { isConnected } = useWebSocket((event) => {
  if (event.type === 'new_message') {
    // Handle real-time message
  }
})

// Events: new_message, message_status, message_status_update, contact_update
```

### Feature Module Pattern
```tsx
// features/contacts/index.tsx
<ContactsProvider>           {/* Context for dialog state */}
  <Header />
  <Main>
    <ContactsTable />        {/* Data table with URL-synced filters */}
  </Main>
  <ContactsDialogs />        {/* All CRUD dialogs */}
</ContactsProvider>
```

### Error Handling
```typescript
import { handleServerError } from '@/lib/handle-server-error'

useMutation({
  mutationFn: ...,
  onError: handleServerError,  // Shows toast with backend error.detail
})
```

## Conventions

### Imports
- Always use `@/` path alias
- Type-only: `import { type User } from './schema'`
- Icons: `lucide-react` only (not Radix icons)

### Styling
- `cn()` utility: `cn('base', condition && 'conditional')`
- RTL built-in - use logical properties (`ms-`, `me-`, `start`, `end`)
- Theme vars in [styles/theme.css](src/styles/theme.css)

### ESLint Rules
- **No `console.log`** - ESLint error
- **Prefix unused vars with `_`**: `_unused`
- **Type-only imports required**

### Modified Shadcn Components
These have RTL/custom modifications - **merge carefully** when updating:
- `scroll-area`, `sonner`, `separator`, `dialog`, `dropdown-menu`, `select`, `sheet`, `sidebar`, `switch`, `table`

## Testing

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

### Test Structure
```
src/__tests__/
├── setup.ts              # Vitest setup, mocks
├── components/           # Component tests
├── hooks/                # Hook tests
└── api/                  # API hook tests
```

### Test Patterns
```typescript
// Component test
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/__tests__/setup'

test('renders contact name', () => {
  render(<ContactCard contact={mockContact} />, { wrapper: TestWrapper })
  expect(screen.getByText('John Doe')).toBeInTheDocument()
})

// Hook test with MSW for API mocking
import { renderHook, waitFor } from '@testing-library/react'
import { useContacts } from '@/api/contacts'

test('fetches contacts', async () => {
  const { result } = renderHook(() => useContacts(), { wrapper: TestWrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toHaveLength(2)
})
```

## Commands

```bash
npm run dev           # Dev server (port 5173)
npm run build         # Type-check + production build
npm run lint          # ESLint
npm run format        # Prettier
npm run knip          # Find unused exports/deps
npm run test          # Vitest
```

## Deployment Notes

### Environment Variables
```env
VITE_API_URL=https://api.production.com  # Optional, defaults to /api/v1
```

### Production Build
- Vite proxy only works in dev - production needs proper API URL or reverse proxy
- WebSocket URL auto-switches: `ws://localhost:8000` (dev) → `wss://host/ws` (prod)

## Domain Concepts

### Contact Identification
- **`wa_id`** is primary identifier (not DB id)
- Format: international phone without `+` (e.g., `6281234567890`)
- All endpoints use `wa_id` in URL path

### Departments
```typescript
type ServiceTag = 'viufinder' | 'viufinder_xp'
// Agents see only their department's contacts (except admin/manager)
```

### Message Pagination
Cursor-based with `before_id`:
```typescript
GET /chat/{wa_id}?limit=50                    // First load
GET /chat/{wa_id}?limit=50&before_id={id}     // Load older
```
