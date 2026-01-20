import { TagServiceDialog } from './tag-service-dialog'
import { EditContactDialog } from './edit-contact-dialog'
import { DeleteContactDialog } from './delete-contact-dialog'
import { CreateContactDialog } from './create-contact-dialog'

export function ContactsDialogs() {
  return (
    <>
      <CreateContactDialog />
      <TagServiceDialog />
      <EditContactDialog />
      <DeleteContactDialog />
    </>
  )
}
