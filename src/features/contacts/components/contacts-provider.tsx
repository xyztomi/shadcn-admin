import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Contact } from '../data/schema'

type ContactsDialogType = 'view' | 'edit' | 'assign' | 'tag' | 'delete' | 'create'

type ContactsContextType = {
  open: ContactsDialogType | null
  setOpen: (str: ContactsDialogType | null) => void
  currentContact: Contact | null
  setCurrentContact: React.Dispatch<React.SetStateAction<Contact | null>>
}

const ContactsContext = React.createContext<ContactsContextType | null>(null)

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ContactsDialogType>(null)
  const [currentContact, setCurrentContact] = useState<Contact | null>(null)

  return (
    <ContactsContext value={{ open, setOpen, currentContact, setCurrentContact }}>
      {children}
    </ContactsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useContactsContext = () => {
  const context = React.useContext(ContactsContext)

  if (!context) {
    throw new Error('useContactsContext must be used within <ContactsProvider>')
  }

  return context
}
