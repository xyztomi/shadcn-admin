import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { format } from 'date-fns'
import { getServerDate } from '@/lib/server-time'
import {
  ArrowLeft,
  MoreVertical,
  Search as SearchIcon,
  Send,
  MessagesSquare,
  Loader2,
  Radio,
  Trash2,
  Clock,
  MapPin,
  CheckCircle,
  RotateCcw,
  Paperclip,
  Filter,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useContacts, useResolveContact, useUnresolveContact, type Contact, type BoothTag } from '@/api/contacts'
import { useAllAgents, useMyShiftStatus, type Agent } from '@/api/agents'
import { useConversation, useSendMessage, useMarkAsRead, useDeleteChat, type Message, type MessageSentiment } from '@/api/chat'
import { useTags } from '@/api/tags'
import { useWebSocket } from '@/hooks/use-websocket'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { MessageStatusIcon } from './components/message-status-icon'
import { TagSelector } from './components/tag-selector'
import { QuickReplyPicker } from './components/quick-reply-picker'
import { MediaAssetPicker } from './components/media-asset-picker'
import { SentimentTagger } from './components/sentiment-tagger'
import { SENTIMENT_CONFIG } from './constants/sentiment'

const boothLabels: Record<string, string> = {
  king_padel_kemang: 'King Padel Kemang',
  kyzn_kuningan: 'KYZN Kuningan',
  mr_padel_cipete: 'Mr Padel Cipete',
  other: 'Other',
}

const getMessageContent = (msg: Message): string => {
  if (typeof msg.content === 'string' && msg.content.length > 0) return msg.content
  if (typeof msg.text === 'string' && msg.text.length > 0) return msg.text
  if (typeof msg.message === 'string' && msg.message.length > 0) return msg.message
  return ''
}

// Check if the message has a media URL (image, video, etc.)
const getMediaUrl = (msg: Message): string | null => {
  if (msg.media_url && msg.media_url.length > 0) {
    // If it's a relative URL, prepend the API base
    if (msg.media_url.startsWith('/')) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${msg.media_url}`
    }
    return msg.media_url
  }
  return null
}

// Check if the media is an image based on message type or URL
const isImageMedia = (msg: Message): boolean => {
  if (msg.message_type === 'image') return true
  const url = msg.media_url?.toLowerCase() || ''
  return url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp')
}

const getResolvedByInfo = (
  contact: Contact | null,
  agentsById?: Map<number, Agent>
): { name: string; time: string | null } | null => {
  if (!contact?.is_resolved || !contact.resolved_by_agent_id) return null
  const agent = agentsById?.get(contact.resolved_by_agent_id)
  const name = agent?.full_name || agent?.username || 'Unknown agent'
  const time = contact.resolved_at
    ? format(new Date(contact.resolved_at), 'MMM d, HH:mm')
    : null
  return { name, time }
}

const getMessageSenderName = (
  msg: Message,
  currentUser: AuthUser | null,
  contact: Contact | null,
  agentsById?: Map<number, Agent>
): string => {
  // Bot messages always show "Bot"
  if (msg.is_bot) {
    return '🤖 Bot'
  }

  // For outbound messages, prioritize agent lookup by ID for consistency
  if (msg.direction === 'outbound' && msg.agent_id) {
    const agent = agentsById?.get(msg.agent_id)
    if (agent) {
      return agent.full_name || agent.username
    }
  }

  // Fallback to message fields
  const senderCandidates: Array<string | null | undefined> = [
    msg.sender,
    msg.sender_name,
    msg.sender_username,
    msg.direction === 'outbound' ? msg.agent_name : msg.contact_name,
    msg.direction === 'outbound' ? msg.agent_username : msg.contact_username,
  ]

  const resolved = senderCandidates.find((name) => typeof name === 'string' && name.trim().length > 0)
  if (resolved) return resolved

  if (msg.direction === 'outbound') {
    return currentUser?.full_name || currentUser?.username || 'You'
  }

  return contact?.name || contact?.phone_number || msg.wa_id
}

function getInitials(name: string | null | undefined, phone: string | undefined): string {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  if (phone) {
    return phone.slice(-2)
  }
  return '??'
}

// Convert UTC date to Jakarta time (UTC+7)
function toJakartaTime(date: Date): Date {
  // Jakarta is UTC+7
  // Simply add 7 hours to the UTC timestamp
  const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
}

// Safe date formatting helper (converts to Jakarta time)
function safeFormat(dateStr: string | null | undefined, formatStr: string, fallback = ''): string {
  if (!dateStr) return fallback
  try {
    // Parse the date as UTC
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return fallback
    // Convert to Jakarta and format
    const jakartaDate = toJakartaTime(date)
    return format(jakartaDate, formatStr)
  } catch {
    return fallback
  }
}

/**
 * Check if the 24-hour WhatsApp messaging window has expired.
 * Returns info about the window status.
 */
function get24HourWindowStatus(lastInboundMessageAt: string | null | undefined): {
  isExpired: boolean
  hoursAgo: number | null
  message: string | null
} {
  if (!lastInboundMessageAt) {
    return {
      isExpired: true,
      hoursAgo: null,
      message: 'No customer message received yet. You need to use a message template.',
    }
  }

  try {
    const lastInbound = new Date(lastInboundMessageAt)
    if (isNaN(lastInbound.getTime())) {
      return { isExpired: false, hoursAgo: null, message: null }
    }

    const now = getServerDate()
    const hoursDiff = (now.getTime() - lastInbound.getTime()) / (1000 * 60 * 60)

    if (hoursDiff >= 24) {
      return {
        isExpired: true,
        hoursAgo: Math.floor(hoursDiff),
        message: `Customer last replied ${Math.floor(hoursDiff)} hours ago. Regular messages will fail - use a message template instead.`,
      }
    }

    // Warning when close to expiry (22+ hours)
    if (hoursDiff >= 22) {
      const hoursRemaining = Math.floor(24 - hoursDiff)
      return {
        isExpired: false,
        hoursAgo: Math.floor(hoursDiff),
        message: `⚠️ Messaging window expires in ~${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}. Customer last replied ${Math.floor(hoursDiff)} hours ago.`,
      }
    }

    return { isExpired: false, hoursAgo: Math.floor(hoursDiff), message: null }
  } catch {
    return { isExpired: false, hoursAgo: null, message: null }
  }
}

interface ChatsProps {
  /** wa_id to auto-select from URL search param */
  initialContactWaId?: string
}

export function Chats({ initialContactWaId }: ChatsProps = {}) {
  const [search, setSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [mobileSelectedContact, setMobileSelectedContact] = useState<Contact | null>(null)
  const [messageText, setMessageText] = useState('')
  const [boothFilter, setBoothFilter] = useState<string>('')
  const [tagFilter, setTagFilter] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active')
  const [pendingContactWaId, setPendingContactWaId] = useState<string | undefined>(initialContactWaId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const lastMessageIdRef = useRef<string | number | null>(null)
  const currentUser = useAuthStore((state) => state.auth.user)
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superuser'

  // Fetch shift status
  const { data: shiftStatus } = useMyShiftStatus()
  const canSendMessages = shiftStatus?.can_send_messages ?? true
  // Agents can only perform actions (resolve, update, etc.) when in shift
  // Admins/superusers can always perform actions
  const isInShift = shiftStatus?.is_in_shift ?? true
  const canPerformActions = isAdmin || isInShift

  // Fetch contacts for the chat list (with optional filters)
  const contactFilters = useMemo(() => {
    const filters: { booth_tag?: BoothTag; tag_id?: number } = {}
    if (boothFilter) filters.booth_tag = boothFilter as BoothTag
    if (tagFilter) filters.tag_id = parseInt(tagFilter, 10)
    return filters
  }, [boothFilter, tagFilter])

  const { data: contacts, isLoading: contactsLoading } = useContacts(contactFilters)
  const { data: allAgents } = useAllAgents() // Fetch ALL agents for message sender lookup
  const { data: allTags } = useTags() // Fetch all tags for filter dropdown

  // Auto-select contact from URL search param when contacts load
  useEffect(() => {
    if (pendingContactWaId && contacts && contacts.length > 0 && !selectedContact) {
      const contact = contacts.find((c) => c.wa_id === pendingContactWaId)
      if (contact) {
        setSelectedContact(contact)
        setMobileSelectedContact(contact)
        // If contact is resolved, switch to resolved tab
        if (contact.is_resolved) {
          setActiveTab('resolved')
        }
      }
      setPendingContactWaId(undefined) // Clear pending to avoid re-triggering
    }
  }, [pendingContactWaId, contacts, selectedContact])

  const agentsById = useMemo(() => {
    const map = new Map<number, Agent>()
    allAgents?.forEach((agent) => {
      map.set(agent.id, agent)
    })
    return map
  }, [allAgents])

  // Fetch conversation for selected contact
  const {
    data: conversationData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useConversation(selectedContact?.wa_id ?? '')

  // Mutations
  const sendMutation = useSendMessage()
  const markAsReadMutation = useMarkAsRead()
  const deleteChatMutation = useDeleteChat()
  const resolveMutation = useResolveContact()
  const unresolveMutation = useUnresolveContact()

  // Handle WebSocket events for toast notifications
  const handleWebSocketEvent = useCallback(
    (event: { type: string; status?: string; error?: string; wa_id?: string; message?: { direction?: string; content?: string; sender_name?: string } }) => {
      // Handle failed message delivery
      if (event.type === 'message_status_update' && event.status === 'failed') {
        const errorMessage = event.error || 'Message failed to deliver'
        toast.error('Message delivery failed', {
          description: errorMessage,
          duration: 8000,
        })
      }

      // Handle new inbound messages - show notification if not viewing that chat
      if (event.type === 'new_message' && event.message?.direction === 'inbound') {
        const isViewingThisChat = selectedContact?.wa_id === event.wa_id
        if (!isViewingThisChat) {
          const senderName = event.message.sender_name || 'New message'
          const content = event.message.content || ''
          toast.info(senderName, {
            description: content.length > 50 ? content.slice(0, 50) + '...' : content,
            duration: 5000,
          })
        }
      }
    },
    [selectedContact?.wa_id]
  )

  // WebSocket for real-time updates
  useWebSocket(handleWebSocketEvent)

  // Flatten messages from infinite query and sort by timestamp (oldest first for normal display)
  const messages = (conversationData?.pages.flatMap(page => page.messages) ?? [])
    .sort((a, b) => new Date(a.timestamp || a.created_at).getTime() - new Date(b.timestamp || b.created_at).getTime())

  // Group messages by date
  const messagesByDate = messages.reduce((acc: Record<string, Message[]>, msg) => {
    try {
      const dateStr = msg.timestamp || msg.created_at
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        // Invalid date, use 'Unknown' as key
        if (!acc['Unknown']) acc['Unknown'] = []
        acc['Unknown'].push(msg)
        return acc
      }
      const key = format(toJakartaTime(date), 'd MMM, yyyy')
      if (!acc[key]) acc[key] = []
      acc[key].push(msg)
    } catch {
      // Handle format error
      if (!acc['Unknown']) acc['Unknown'] = []
      acc['Unknown'].push(msg)
    }
    return acc
  }, {})

  // Filter contacts by search and tab
  const filteredContacts = contacts?.filter(contact => {
    const searchText = contact.name || contact.phone_number || ''
    const matchesSearch = searchText.toLowerCase().includes(search.trim().toLowerCase())
    const matchesTab = activeTab === 'active' ? !contact.is_resolved : contact.is_resolved
    return matchesSearch && matchesTab
  }) ?? []

  // Count contacts by status
  const activeCount = contacts?.filter(c => !c.is_resolved).length ?? 0
  const resolvedCount = contacts?.filter(c => c.is_resolved).length ?? 0

  // Mark messages as read when selecting a contact
  useEffect(() => {
    if (selectedContact && selectedContact.unread_count > 0) {
      markAsReadMutation.mutate(selectedContact.wa_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only trigger on wa_id change, not on mutation or contact object changes
  }, [selectedContact?.wa_id])

  // Get the last message ID to detect new messages
  const lastMessage = messages[messages.length - 1]
  const lastMessageId = lastMessage?.id ?? null

  // Scroll to bottom when new messages arrive or when switching contacts
  useEffect(() => {
    // Only scroll if we have a new message (not initial load of older messages)
    if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      lastMessageIdRef.current = lastMessageId
    }
  }, [lastMessageId])

  // Also scroll when selecting a new contact (instant scroll)
  useEffect(() => {
    if (selectedContact) {
      lastMessageIdRef.current = null // Reset on contact change
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
      }, 150)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only trigger on wa_id change
  }, [selectedContact?.wa_id])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedContact) return

    await sendMutation.mutateAsync({
      waId: selectedContact.wa_id,
      text: messageText.trim(),
    })
    setMessageText('')
  }

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
    setMobileSelectedContact(contact)
  }

  const handleDeleteChat = async () => {
    if (!selectedContact) return

    try {
      await deleteChatMutation.mutateAsync(selectedContact.wa_id)
      toast.success('Chat history deleted')
      setShowDeleteDialog(false)
    } catch {
      toast.error('Failed to delete chat')
    }
  }

  const handleResolve = async () => {
    if (!selectedContact) return

    try {
      await resolveMutation.mutateAsync(selectedContact.wa_id)
      toast.success('Conversation marked as resolved')
      setSelectedContact(null)
      setMobileSelectedContact(null)
    } catch {
      toast.error('Failed to resolve conversation')
    }
  }

  const handleUnresolve = async () => {
    if (!selectedContact) return

    try {
      await unresolveMutation.mutateAsync(selectedContact.wa_id)
      toast.success('Conversation reopened')
      setSelectedContact(null)
      setMobileSelectedContact(null)
    } catch {
      toast.error('Failed to reopen conversation')
    }
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <section className='flex h-full gap-6'>
          {/* Contact List */}
          <div className='flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80'>
            <div className='sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
              <div className='flex items-center justify-between py-2'>
                <div className='flex gap-2'>
                  <h1 className='text-2xl font-bold'>Inbox</h1>
                  <MessagesSquare size={20} />
                </div>
              </div>

              <label
                className={cn(
                  'focus-within:ring-1 focus-within:ring-ring focus-within:outline-hidden',
                  'flex h-10 w-full items-center space-x-0 rounded-md border border-border ps-2'
                )}
              >
                <SearchIcon size={15} className='me-2 stroke-slate-500' />
                <span className='sr-only'>Search</span>
                <input
                  type='text'
                  className='w-full flex-1 bg-inherit text-sm focus-visible:outline-hidden'
                  placeholder='Search contacts...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'resolved')} className='mt-3'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='active' className='text-xs'>
                    Active {activeCount > 0 && <Badge variant='secondary' className='ml-1 h-5 px-1.5'>{activeCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value='resolved' className='text-xs'>
                    Resolved {resolvedCount > 0 && <Badge variant='secondary' className='ml-1 h-5 px-1.5'>{resolvedCount}</Badge>}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filters */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' size='sm' className='mt-2 w-full'>
                    <Filter className='mr-2 h-4 w-4' />
                    Filters
                    {(boothFilter || tagFilter) && (
                      <Badge variant='secondary' className='ml-2 h-5 px-1.5'>
                        {(boothFilter ? 1 : 0) + (tagFilter ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-64' align='start'>
                  <div className='space-y-3'>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground'>Booth</label>
                      <Select value={boothFilter || '__all__'} onValueChange={(v) => setBoothFilter(v === '__all__' ? '' : v)}>
                        <SelectTrigger className='mt-1 h-8'>
                          <SelectValue placeholder='All booths' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='__all__'>All booths</SelectItem>
                          <SelectItem value='king_padel_kemang'>King Padel Kemang</SelectItem>
                          <SelectItem value='kyzn_kuningan'>KYZN Kuningan</SelectItem>
                          <SelectItem value='mr_padel_cipete'>Mr Padel Cipete</SelectItem>
                          <SelectItem value='other'>Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground'>Tag</label>
                      <Select value={tagFilter || '__all__'} onValueChange={(v) => setTagFilter(v === '__all__' ? '' : v)}>
                        <SelectTrigger className='mt-1 h-8'>
                          <SelectValue placeholder='All tags' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='__all__'>All tags</SelectItem>
                          {allTags?.map((tag) => (
                            <SelectItem key={tag.id} value={String(tag.id)}>
                              <div className='flex items-center gap-2'>
                                <span
                                  className='h-2 w-2 rounded-full'
                                  style={{ backgroundColor: tag.color }}
                                />
                                {tag.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {(boothFilter || tagFilter) && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='w-full'
                        onClick={() => {
                          setBoothFilter('')
                          setTagFilter('')
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <ScrollArea className='-mx-3 h-full overflow-scroll p-3'>
              {contactsLoading ? (
                <div className='space-y-3'>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className='h-16 w-full' />
                  ))}
                </div>
              ) : filteredContacts.length === 0 ? (
                <p className='text-center text-sm text-muted-foreground py-8'>
                  {activeTab === 'active' ? 'No active conversations' : 'No resolved conversations'}
                </p>
              ) : (
                filteredContacts.map((contact) => (
                  <Fragment key={contact.wa_id}>
                    <button
                      type='button'
                      className={cn(
                        'group hover:bg-accent hover:text-accent-foreground',
                        'flex w-full rounded-md px-2 py-2 text-start text-sm',
                        selectedContact?.wa_id === contact.wa_id && 'sm:bg-muted'
                      )}
                      onClick={() => handleSelectContact(contact)}
                    >
                      <div className='flex gap-2 w-full'>
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(contact.name, contact.phone_number)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between'>
                            <span className='font-medium truncate'>
                              {contact.name || contact.phone_number}
                            </span>
                          </div>
                          <div className='flex items-center gap-1 flex-wrap'>
                            {contact.service_tag && (
                              <Badge variant='outline' className='text-xs'>
                                {contact.service_tag === 'viufinder' ? 'VF' : 'XP'}
                              </Badge>
                            )}
                            {contact.tags?.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag.id}
                                variant='secondary'
                                className='text-xs px-1.5'
                                style={{ backgroundColor: tag.color ? `${tag.color}30` : undefined }}
                              >
                                <span
                                  className='h-1.5 w-1.5 rounded-full mr-1'
                                  style={{ backgroundColor: tag.color || '#6b7280' }}
                                />
                                {tag.name}
                              </Badge>
                            ))}
                            {contact.tags?.length > 2 && (
                              <Badge variant='outline' className='text-xs px-1'>
                                +{contact.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                          <span className='text-xs text-muted-foreground'>
                            {safeFormat(contact.last_message_at, 'MMM d, HH:mm', 'No messages')}
                          </span>
                          {contact.is_resolved && contact.resolved_by_agent_id && (
                            <span className='text-xs text-green-600 flex items-center gap-1'>
                              <CheckCircle className='h-3 w-3' />
                              Resolved by {agentsById?.get(contact.resolved_by_agent_id)?.full_name || agentsById?.get(contact.resolved_by_agent_id)?.username || 'agent'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <Separator className='my-1' />
                  </Fragment>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          {selectedContact ? (
            <div
              className={cn(
                'absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col border bg-background shadow-xs sm:static sm:z-auto sm:flex sm:rounded-md',
                mobileSelectedContact && 'start-0 flex'
              )}
            >
              {/* Chat Header */}
              <div className='mb-1 flex flex-none flex-col bg-card p-4 shadow-lg sm:rounded-t-md'>
                <div className='flex justify-between'>
                  <div className='flex gap-3'>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='-ms-2 h-full sm:hidden'
                      onClick={() => setMobileSelectedContact(null)}
                    >
                      <ArrowLeft className='rtl:rotate-180' />
                    </Button>
                    <div className='flex items-center gap-2 lg:gap-4'>
                      <Avatar className='size-9 lg:size-11'>
                        <AvatarFallback>
                          {getInitials(selectedContact.name, selectedContact.phone_number)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className='text-sm font-medium lg:text-base'>
                          {selectedContact.name || selectedContact.phone_number}
                        </span>
                        <span className='block text-xs text-muted-foreground'>
                          {selectedContact.phone_number}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {/* Resolve/Unresolve button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className='inline-flex'>
                            {selectedContact.is_resolved ? (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={handleUnresolve}
                                disabled={unresolveMutation.isPending || !canPerformActions}
                              >
                                <RotateCcw className='mr-2 h-4 w-4' />
                                Reopen
                              </Button>
                            ) : (
                              <Button
                                size='sm'
                                variant='default'
                                onClick={handleResolve}
                                disabled={resolveMutation.isPending || !canPerformActions}
                                className='bg-green-600 hover:bg-green-700'
                              >
                                <CheckCircle className='mr-2 h-4 w-4' />
                                Resolve
                              </Button>
                            )}
                          </span>
                        </TooltipTrigger>
                        {!canPerformActions && (
                          <TooltipContent>
                            <p>You can only perform this action during your shift hours</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size='icon' variant='ghost' className='h-10 rounded-md'>
                            <MoreVertical className='stroke-muted-foreground' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                            className='text-destructive focus:text-destructive'
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Delete Chat History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                {/* Tags */}
                <div className='mt-2 ps-12 lg:ps-16 flex items-center gap-2 flex-wrap'>
                  <TagSelector waId={selectedContact.wa_id} disabled={!canPerformActions} />
                  {selectedContact.booth_tag && (
                    <Badge variant='secondary' className='gap-1'>
                      <MapPin className='h-3 w-3' />
                      {boothLabels[selectedContact.booth_tag] || selectedContact.booth_tag}
                    </Badge>
                  )}
                  {(() => {
                    const resolvedInfo = getResolvedByInfo(selectedContact, agentsById)
                    return resolvedInfo ? (
                      <Badge variant='outline' className='gap-1 text-green-600 border-green-600/50'>
                        <CheckCircle className='h-3 w-3' />
                        Resolved by {resolvedInfo.name}
                        {resolvedInfo.time && ` • ${resolvedInfo.time}`}
                      </Badge>
                    ) : null
                  })()}
                </div>
              </div>

              {/* Messages */}
              <div className='flex flex-1 flex-col gap-2 rounded-md px-4 pt-0 pb-4'>
                <div className='flex size-full flex-1'>
                  <div className='relative -me-4 flex flex-1 flex-col overflow-y-hidden'>
                    <div className='flex h-40 w-full grow flex-col justify-start gap-4 overflow-y-auto py-2 pe-4 pb-4'>

                      {messagesLoading ? (
                        <div className='flex justify-center py-8'>
                          <Loader2 className='h-6 w-6 animate-spin' />
                        </div>
                      ) : (
                        <>
                          {hasNextPage && (
                            <Button
                              variant='ghost'
                              size='sm'
                              className='self-center'
                              onClick={() => fetchNextPage()}
                              disabled={isFetchingNextPage}
                            >
                              {isFetchingNextPage ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                'Load older messages'
                              )}
                            </Button>
                          )}

                          {Object.keys(messagesByDate).map((dateKey) => (
                            <Fragment key={dateKey}>
                              <div className='text-center text-xs text-muted-foreground py-2'>
                                {dateKey}
                              </div>
                              {messagesByDate[dateKey].map((msg) => {
                                const senderName = getMessageSenderName(
                                  msg,
                                  currentUser,
                                  selectedContact,
                                  agentsById
                                )
                                const timestamp = safeFormat(msg.timestamp || msg.created_at, 'h:mm a')
                                const isFailed = msg.status === 'failed'
                                const isBroadcast = !!msg.broadcast_id
                                // Get sentiment styling for tagged inbound messages
                                const sentimentConfig = msg.direction === 'inbound' && msg.sentiment
                                  ? SENTIMENT_CONFIG[msg.sentiment as MessageSentiment]
                                  : null
                                // Get tagger name from agentsById
                                const taggedByAgent = msg.sentiment_tagged_by
                                  ? agentsById?.get(msg.sentiment_tagged_by)
                                  : null
                                const taggedByName = taggedByAgent?.full_name || taggedByAgent?.username || null

                                return (
                                  <div
                                    key={msg.id}
                                    className={cn(
                                      'max-w-72 px-3 py-2 shadow-lg',
                                      msg.direction === 'outbound'
                                        ? 'self-end rounded-[16px_16px_0_16px] bg-primary/90 text-primary-foreground/75'
                                        : 'self-start rounded-[16px_16px_16px_0] bg-muted',
                                      isFailed && msg.direction === 'outbound' && 'border border-destructive/50',
                                      // Add left border styling for tagged messages
                                      sentimentConfig && 'border-l-4',
                                      sentimentConfig?.borderColor
                                    )}
                                  >
                                    {/* Broadcast indicator */}
                                    {isBroadcast && (
                                      <div className={cn(
                                        'mb-1 flex items-center gap-1 text-[0.65rem]',
                                        msg.direction === 'outbound'
                                          ? 'text-primary-foreground/70'
                                          : 'text-muted-foreground'
                                      )}>
                                        <Radio className='h-3 w-3' />
                                        <span>Broadcast message</span>
                                      </div>
                                    )}
                                    {/* Sentiment tag for inbound messages */}
                                    {msg.direction === 'inbound' && (
                                      <div className='mb-1 flex items-start gap-1'>
                                        <SentimentTagger
                                          messageId={msg.id}
                                          currentSentiment={msg.sentiment as MessageSentiment | null}
                                          taggedByName={taggedByName}
                                          disabled={!canPerformActions}
                                        />
                                      </div>
                                    )}
                                    {/* Media content (image) */}
                                    {getMediaUrl(msg) && isImageMedia(msg) && (
                                      <img
                                        src={getMediaUrl(msg)!}
                                        alt='Media'
                                        className='mb-2 max-w-full rounded-lg'
                                        loading='lazy'
                                      />
                                    )}
                                    {/* Text content */}
                                    {getMessageContent(msg)}
                                    <span
                                      className={cn(
                                        'mt-1 flex flex-wrap items-center gap-1 text-[0.7rem] font-light italic',
                                        msg.direction === 'outbound'
                                          ? 'justify-end text-primary-foreground/85'
                                          : 'text-foreground/75'
                                      )}
                                    >
                                      <span className='font-semibold not-italic'>{senderName}</span>
                                      {timestamp && <span aria-hidden='true'>·</span>}
                                      {timestamp}
                                      {msg.direction === 'outbound' && (
                                        <MessageStatusIcon
                                          status={msg.status}
                                          error={msg.error}
                                        />
                                      )}
                                    </span>
                                    {/* Show error message for failed deliveries */}
                                    {isFailed && msg.error && (
                                      <div className='mt-2 border-t border-destructive/30 pt-2 text-[0.65rem] text-destructive'>
                                        ⚠️ {msg.error}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </Fragment>
                          ))}

                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shift Warning */}
                {!isInShift && !isAdmin && shiftStatus?.shift && (
                  <Alert variant='destructive' className='mb-2'>
                    <Clock className='h-4 w-4' />
                    <AlertDescription>
                      You are outside your shift hours ({shiftStatus.shift.start_time} - {shiftStatus.shift.end_time}).
                      Message sending and chat actions (resolve, tagging) are disabled.
                    </AlertDescription>
                  </Alert>
                )}

                {/* 24-Hour WhatsApp Window Warning */}
                {(() => {
                  const windowStatus = get24HourWindowStatus(selectedContact?.last_inbound_message_at)
                  if (windowStatus.isExpired) {
                    return (
                      <Alert variant='destructive' className='mb-2'>
                        <AlertTriangle className='h-4 w-4' />
                        <AlertDescription>
                          {windowStatus.message}
                        </AlertDescription>
                      </Alert>
                    )
                  }
                  if (windowStatus.message) {
                    return (
                      <Alert className='mb-2 border-amber-500/50 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200'>
                        <Clock className='h-4 w-4' />
                        <AlertDescription>
                          {windowStatus.message}
                        </AlertDescription>
                      </Alert>
                    )
                  }
                  return null
                })()}

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className='flex w-full flex-none gap-2'>
                  <div className={cn(
                    'flex flex-1 items-center gap-2 rounded-md border border-input bg-card px-2 py-1 focus-within:ring-1 focus-within:ring-ring',
                    !canSendMessages && 'opacity-50 cursor-not-allowed'
                  )}>
                    <QuickReplyPicker
                      onSelect={(content) => setMessageText(content)}
                      inputRef={messageInputRef}
                      disabled={!canSendMessages}
                    />
                    <MediaAssetPicker waId={selectedContact?.wa_id || ''} disabled={!canSendMessages}>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        disabled={!canSendMessages}
                      >
                        <Paperclip className='h-4 w-4' />
                      </Button>
                    </MediaAssetPicker>
                    <input
                      ref={messageInputRef}
                      type='text'
                      placeholder={canSendMessages ? 'Type your message... (/ for quick replies)' : 'Messaging disabled outside shift hours'}
                      className='h-8 w-full flex-1 bg-inherit focus-visible:outline-hidden disabled:cursor-not-allowed'
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={sendMutation.isPending || !canSendMessages}
                    />
                    <Button
                      type='submit'
                      variant='ghost'
                      size='icon'
                      disabled={!messageText.trim() || sendMutation.isPending || !canSendMessages}
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className='h-5 w-5 animate-spin' />
                      ) : (
                        <Send size={20} />
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className='absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col justify-center rounded-md border bg-card shadow-xs sm:static sm:z-auto sm:flex'>
              <div className='flex flex-col items-center space-y-6'>
                <div className='flex size-16 items-center justify-center rounded-full border-2 border-border'>
                  <MessagesSquare className='size-8' />
                </div>
                <div className='space-y-2 text-center'>
                  <h1 className='text-xl font-semibold'>Your messages</h1>
                  <p className='text-sm text-muted-foreground'>
                    Select a contact to start chatting
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </Main>

      {/* Delete Chat Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title='Delete Chat History'
        desc={
          <>
            Are you sure you want to delete all chat history with{' '}
            <strong>{selectedContact?.name || selectedContact?.phone_number}</strong>?
            <br />
            <br />
            <span className='text-destructive'>
              This will permanently delete all messages. This action cannot be undone.
            </span>
          </>
        }
        confirmText='Delete Chat'
        destructive
        handleConfirm={handleDeleteChat}
        isLoading={deleteChatMutation.isPending}
      />
    </>
  )
}
