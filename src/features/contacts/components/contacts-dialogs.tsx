import { TagServiceDialog } from './tag-service-dialog'
import { EditContactDialog } from './edit-contact-dialog'
import { DeleteContactDialog } from './delete-contact-dialog'

export function ContactsDialogs() {
  return (
    <>
      <TagServiceDialog />
      <EditContactDialog />
      <DeleteContactDialog />
    </>
  )
}
