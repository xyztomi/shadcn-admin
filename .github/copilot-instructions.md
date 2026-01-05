# Copilot Instructions for WA CRM Frontend

## Project Context

This is **WA CRM** - a WhatsApp CRM dashboard for managing customer conversations. Built on the shadcn-admin template, integrating with a FastAPI backend.

## Tech Stack

- **React 19 + Vite + SWC** - Modern React with fast builds
- **TanStack Router** - File-based routing with auto-code-splitting
- **TanStack Query** - Server state management for API calls
- **TanStack Table** - Data tables with sorting/filtering/pagination
- **Shadcn UI** (Tailwind CSS 4 + Radix) - "new-york" style variant
- **Zustand** - Global client state (auth)
- **Axios** - HTTP client for backend API

## Backend API

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:** JWT Bearer tokens in Authorization header
```typescript
headers: { 'Authorization': `Bearer ${token}` }
```

**Response format:** Direct JSON (no wrapper). Errors return `{ "detail": "message" }`

**Test accounts:** `admin/admin123`, `manager/manager123`, `cs_viu_1/agent123`

## Directory Structure
```
src/
├── features/         # Domain modules - ADD API INTEGRATION HERE
│   └── {domain}/
│       ├── index.tsx           # Page component
│       ├── components/         # Domain UI components
│       ├── api/               # API hooks (TanStack Query) - CREATE THIS
│       └── data/              # Schema, types, constants
├── routes/           # TanStack Router (thin wrappers to features)
├── components/
│   ├── ui/           # Shadcn components (avoid direct edits)
│   ├── data-table/   # Reusable table components
│   └── layout/       # App shell, sidebar, header
├── context/          # React context (theme, layout, search)
├── hooks/            # Shared hooks
├── stores/           # Zustand stores (auth-store.ts)
├── lib/              # Utilities (cn, cookies, error handling)
└── api/              # Shared API client config - CREATE THIS
```

## API Endpoints Reference

### Auth (`/api/v1/auth`)
- `POST /auth/login` → `{ access_token, token_type }`
- `GET /auth/me` → Current agent info
- `PATCH /auth/me` → Update profile
- `POST /auth/change-password`

### Contacts (`/api/v1/contacts`)
- `GET /contacts` → List (filters: `service_tag`, `assigned_agent_id`, `is_active`, `unassigned`)
- `GET /contacts/{wa_id}` → Single contact
- `PATCH /contacts/{wa_id}` → Update contact
- `POST /contacts/{wa_id}/assign` → Assign to agent
- `POST /contacts/{wa_id}/unassign` → Remove assignment

### Chat (`/api/v1/chat`)
- `GET /chat/{wa_id}` → Conversation history (params: `limit`, `before_id`)
- `POST /chat/{wa_id}/send` → Send message `{ text }`
- `POST /chat/{wa_id}/mark-read` → Mark as read

### Agents (`/api/v1/agents`)
- `GET /agents` → List (filters: `department`, `is_available`, `is_online`)
- `POST /agents` → Create (admin only)
- `PATCH /agents/{id}/status` → Update online/available

### Stats (`/api/v1/stats`)
- `GET /stats/overview` → Dashboard stats
- `GET /stats/agents` → Agent performance

### WebSocket
- `ws://localhost:8000/ws?token={jwt}` → Real-time updates

## WhatsApp CRM Domain Concepts

### Contact Identification
- **`wa_id`** (WhatsApp ID) is the primary identifier for contacts, NOT database IDs
- Format: international phone number without `+` (e.g., `6281234567890`)
- All contact/chat endpoints use `wa_id` in the URL path

### Dual-Department Model
The system routes contacts to two service departments:
```typescript
type ServiceTag = 'viufinder' | 'viufinder_xp'
type AgentDepartment = 'viufinder' | 'viufinder_xp'
```
- Filter contacts by `service_tag` to show department-specific queues
- Agents belong to one department and only see their department's contacts
- Admins/managers can see all departments

### Agent Workload
Track agent capacity for assignment UI:
```typescript
interface Agent {
  active_chats: number   // Current assigned conversations
  max_chats: number      // Maximum allowed (0 = unlimited)
  is_available: boolean  // Toggle for accepting new chats
  is_online: boolean     // Online status
}
```

### Message Pagination
Chat history uses **cursor-based pagination** with `before_id`:
```typescript
// First load
GET /chat/{wa_id}?limit=50

// Load older messages
GET /chat/{wa_id}?limit=50&before_id={oldest_message_id}
```

### WebSocket Events
Handle these real-time events from `ws://localhost:8000/ws?token={jwt}`:
- `new_message` - Incoming WhatsApp message
- `message_status` - Delivery/read receipt updates
- `agent_assigned` - Contact assignment changes

## Critical Patterns

### Route-to-Feature Connection
Routes are thin wrappers that delegate to feature components:
```tsx
// routes/_authenticated/users/index.tsx
export const Route = createFileRoute('/_authenticated/users/')({
  component: Users,
  validateSearch: searchSchema, // Zod schema for URL params
})
```
Feature components live in `src/features/{domain}/index.tsx`.

### Backend API Integration Pattern
Create API hooks in each feature using TanStack Query:
```tsx
// features/contacts/api/use-contacts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'

export function useContacts(filters?: { service_tag?: string; unassigned?: boolean }) {
  const params = new URLSearchParams(filters as any).toString()
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => api.get(`/contacts?${params}`).then(res => res.data),
  })
}

export function useAssignContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ wa_id, agent_id }: { wa_id: string; agent_id: number }) =>
      api.post(`/contacts/${wa_id}/assign`, { agent_id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  })
}
```

### Feature Module Pattern (Provider + Dialogs)
Each CRUD feature uses this structure (see [users](src/features/users/index.tsx)):
```tsx
<ContactsProvider>        {/* Context for dialog state + current row */}
  <Header />
  <Main>
    <ContactsTable />     {/* Table with URL-synced filters */}
  </Main>
  <ContactsDialogs />     {/* All dialogs rendered together */}
</ContactsProvider>
```

### Dialog State Management
Use `useDialogState<T>` hook for toggling dialogs:
```tsx
const [open, setOpen] = useDialogState<'add' | 'edit' | 'delete'>(null)
setOpen('add')  // Opens 'add', closes if already 'add'
```

### URL-Synced Table State
Use `useTableUrlState` hook to sync filters/pagination with URL:
```tsx
const { columnFilters, pagination, onColumnFiltersChange } = useTableUrlState({
  search, navigate,
  columnFilters: [
    { columnId: 'status', searchKey: 'status', type: 'array' },
  ],
})
```

## UI Component Guidelines

### Imports
- Use `@/` path alias for all imports
- Type-only imports required: `import { type User } from './schema'`
- Shadcn components: `@/components/ui/{component}`
- Custom components: `@/components/{component}`

### Styling
- Use `cn()` utility for conditional classes: `cn('base-class', condition && 'conditional')`
- Tailwind CSS 4 with CSS variables for theming (see [theme.css](src/styles/theme.css))
- RTL support is built-in - use logical properties (`ms-`, `me-`, `start`, `end`)

### Modified Shadcn Components
These components have RTL/custom modifications - **merge carefully** if updating via CLI:
- `scroll-area`, `sonner`, `separator` (general modifications)
- `dialog`, `dropdown-menu`, `select`, `sheet`, `sidebar`, `switch`, `table` (RTL)

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Type-check + production build
pnpm lint       # ESLint check
pnpm format     # Prettier format
pnpm knip       # Find unused exports/dependencies
```

## Key Conventions

1. **No console.log** - ESLint enforces `no-console: error`
2. **Prefix unused vars with `_`** - `_unused` pattern for intentionally unused variables
3. **Lucide icons** - Import from `lucide-react`, not Radix icons
4. **Toast notifications** - Use `toast` from `sonner` for user feedback
5. **Error handling** - Use `handleServerError` from `@/lib/handle-server-error` for API errors
6. **Authentication** - Zustand store at `@/stores/auth-store` manages tokens/user
7. **Cookies** - Use helpers from `@/lib/cookies` for persistence
