import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useAgents } from '@/api/agents'
import { useAssignContact, useUnassignContact } from '@/api/contacts'
import { useContactsContext } from './contacts-provider'

export function AssignAgentDialog() {
  const { open, setOpen, currentContact, setCurrentContact } = useContactsContext()
  const { data: agents, isLoading: agentsLoading } = useAgents()
  const assignMutation = useAssignContact()
  const unassignMutation = useUnassignContact()

  const isOpen = open === 'assign'

  const handleClose = () => {
    setOpen(null)
    setTimeout(() => setCurrentContact(null), 300)
  }

  const handleAssign = async (agentId: string) => {
    if (!currentContact) return

    if (agentId === 'unassign') {
      await unassignMutation.mutateAsync(currentContact.wa_id)
      toast.success('Contact unassigned')
    } else {
      await assignMutation.mutateAsync({
        waId: currentContact.wa_id,
        agentId: parseInt(agentId, 10),
      })
      toast.success('Contact assigned successfully')
    }
    handleClose()
  }

  if (!currentContact) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Agent</DialogTitle>
          <DialogDescription>
            Assign {currentContact.name || currentContact.phone_number} to an agent
          </DialogDescription>
        </DialogHeader>

        <Select
          onValueChange={handleAssign}
          defaultValue={currentContact.assigned_agent_id?.toString()}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select an agent...' />
          </SelectTrigger>
          <SelectContent>
            {currentContact.assigned_agent_id && (
              <SelectItem value='unassign'>Unassign</SelectItem>
            )}
            {agentsLoading ? (
              <SelectItem value='' disabled>
                Loading agents...
              </SelectItem>
            ) : (
              agents
                ?.filter((a) => a.is_available && a.is_active)
                .map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.full_name || agent.username}
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
