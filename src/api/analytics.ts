import { useQuery } from '@tanstack/react-query'
import { useDepartmentStore } from '@/stores/department-store'
import { api } from './client'

// Types for Analytics API responses
export interface AnalyticsOverview {
  period: {
    start_date: string
    end_date: string
  }
  contacts: {
    total: number
    new_today: number
    active: number
    viufinder: number
    viufinder_xp: number
    untagged: number
    unassigned: number
  }
  messages: {
    total: number
    inbound: number
    outbound: number
    today: number
  }
  agents: {
    total: number
    online: number
    available: number
  }
  conversations: {
    total: number
    active: number
    pending: number
    resolved: number
  }
}

export interface MessageByDate {
  date: string
  inbound: number
  outbound: number
  total: number
}

export interface MessageByHour {
  hour: number
  count: number
}

export interface MessageByType {
  type: string
  count: number
}

export interface ContactByDate {
  date: string
  new_contacts: number
}

export interface ContactByService {
  service: string
  count: number
}

export interface AgentPerformance {
  id: number
  username: string
  full_name: string
  department: 'viufinder' | 'viufinder_xp'
  is_online: boolean
  is_available: boolean
  total_conversations: number
  total_messages_sent: number
  total_resolved: number
  assigned_contacts: number
  avg_response_time: number
  avg_rating: number
}

export interface DepartmentAgents {
  total: number
  online: number
}

export interface DepartmentContacts {
  total: number
  unassigned: number
}

export interface DepartmentSummary {
  agents: DepartmentAgents
  contacts: DepartmentContacts
}

export interface DepartmentsSummary {
  viufinder: DepartmentSummary
  viufinder_xp: DepartmentSummary
}

// Overview Analytics
export function useAnalyticsOverview(startDate?: string, endDate?: string) {
  const { selectedDepartment } = useDepartmentStore()
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  if (selectedDepartment) params.append('department', selectedDepartment)

  return useQuery({
    queryKey: ['analytics', 'overview', startDate, endDate, selectedDepartment],
    queryFn: async (): Promise<AnalyticsOverview> => {
      const response = await api.get(`/analytics/overview?${params.toString()}`)
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

// Message Analytics - By Date
export function useMessagesByDate(days = 30) {
  const { selectedDepartment } = useDepartmentStore()
  return useQuery({
    queryKey: ['analytics', 'messages-by-date', days, selectedDepartment],
    queryFn: async (): Promise<MessageByDate[]> => {
      const params = new URLSearchParams({ days: String(days) })
      if (selectedDepartment) params.append('department', selectedDepartment)
      const response = await api.get(
        `/analytics/messages/by-date?${params.toString()}`
      )
      return response.data
    },
  })
}

// Message Analytics - By Hour
export function useMessagesByHour() {
  const { selectedDepartment } = useDepartmentStore()
  return useQuery({
    queryKey: ['analytics', 'messages-by-hour', selectedDepartment],
    queryFn: async (): Promise<MessageByHour[]> => {
      const params = new URLSearchParams()
      if (selectedDepartment) params.append('department', selectedDepartment)
      const response = await api.get(
        `/analytics/messages/by-hour?${params.toString()}`
      )
      return response.data
    },
  })
}

// Message Analytics - By Type
export function useMessagesByType() {
  const { selectedDepartment } = useDepartmentStore()
  return useQuery({
    queryKey: ['analytics', 'messages-by-type', selectedDepartment],
    queryFn: async (): Promise<MessageByType[]> => {
      const params = new URLSearchParams()
      if (selectedDepartment) params.append('department', selectedDepartment)
      const response = await api.get(
        `/analytics/messages/by-type?${params.toString()}`
      )
      return response.data
    },
  })
}

// Contact Analytics - By Date
export function useContactsByDate(days = 30) {
  const { selectedDepartment } = useDepartmentStore()
  return useQuery({
    queryKey: ['analytics', 'contacts-by-date', days, selectedDepartment],
    queryFn: async (): Promise<ContactByDate[]> => {
      const params = new URLSearchParams({ days: String(days) })
      if (selectedDepartment) params.append('department', selectedDepartment)
      const response = await api.get(
        `/analytics/contacts/by-date?${params.toString()}`
      )
      return response.data
    },
  })
}

// Contact Analytics - By Service
export function useContactsByService() {
  const { selectedDepartment } = useDepartmentStore()
  return useQuery({
    queryKey: ['analytics', 'contacts-by-service', selectedDepartment],
    queryFn: async (): Promise<ContactByService[]> => {
      const params = new URLSearchParams()
      if (selectedDepartment) params.append('department', selectedDepartment)
      const response = await api.get(
        `/analytics/contacts/by-service?${params.toString()}`
      )
      return response.data
    },
  })
}

// Agent Performance
export function useAgentPerformance() {
  const { selectedDepartment } = useDepartmentStore()
  return useQuery({
    queryKey: ['analytics', 'agent-performance', selectedDepartment],
    queryFn: async (): Promise<AgentPerformance[]> => {
      const params = new URLSearchParams()
      if (selectedDepartment) params.append('department', selectedDepartment)
      const response = await api.get(
        `/analytics/agents/performance?${params.toString()}`
      )
      return response.data
    },
    refetchInterval: 60000, // Refetch every 60 seconds
  })
}

// Department Summary
export function useDepartmentsSummary() {
  const { selectedDepartment } = useDepartmentStore()
  return useQuery({
    queryKey: ['analytics', 'departments-summary', selectedDepartment],
    queryFn: async (): Promise<DepartmentsSummary> => {
      const params = new URLSearchParams()
      if (selectedDepartment) params.append('department', selectedDepartment)
      const response = await api.get(
        `/analytics/departments/summary?${params.toString()}`
      )
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

// Export Utilities

/**
 * Download agent performance data as CSV
 */
export async function exportAgentPerformance(
  startDate?: string,
  endDate?: string,
  department?: string
): Promise<void> {
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  if (department) params.append('department', department)

  const response = await api.get(
    `/analytics/export/agent-performance?${params.toString()}`,
    {
      responseType: 'blob',
    }
  )

  // Create download link
  const blob = new Blob([response.data], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `agent_performance_${startDate || 'all'}_to_${endDate || 'now'}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Download overview analytics data as CSV
 */
export async function exportOverviewAnalytics(
  startDate?: string,
  endDate?: string
): Promise<void> {
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)

  const response = await api.get(
    `/analytics/export/overview?${params.toString()}`,
    {
      responseType: 'blob',
    }
  )

  // Create download link
  const blob = new Blob([response.data], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `overview_analytics_${startDate || 'all'}_to_${endDate || 'now'}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
