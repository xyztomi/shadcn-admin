import { useContacts } from '@/api/contacts'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { ContactsDialogs } from './components/contacts-dialogs'
import { ContactsProvider, useContactsContext } from './components/contacts-provider'
import { ContactsTable } from './components/contacts-table'

function ContactsContent() {
  const { data: contacts, isLoading } = useContacts()
  const { setOpen } = useContactsContext()

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Contacts</h2>
            <p className='text-muted-foreground'>
              Manage WhatsApp contacts and their assignments
            </p>
          </div>
          <Button onClick={() => setOpen('create')}>
            <UserPlus className='mr-2 h-4 w-4' />
            Add Contact
          </Button>
        </div>
        <ContactsTable data={contacts ?? []} isLoading={isLoading} />
      </Main>

      <ContactsDialogs />
    </>
  )
}

export function Contacts() {
  return (
    <ContactsProvider>
      <ContactsContent />
    </ContactsProvider>
  )
}
