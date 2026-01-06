import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Agent } from '@/api/agents'

type AgentsDialogType = 'add' | 'edit' | 'delete'

type AgentsContextType = {
  open: AgentsDialogType | null
  setOpen: (str: AgentsDialogType | null) => void
  currentRow: Agent | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Agent | null>>
}

const AgentsContext = React.createContext<AgentsContextType | null>(null)

export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<AgentsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Agent | null>(null)

  return (
    <AgentsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </AgentsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAgentsContext = () => {
  const agentsContext = React.useContext(AgentsContext)

  if (!agentsContext) {
    throw new Error('useAgentsContext has to be used within <AgentsContext>')
  }

  return agentsContext
}
