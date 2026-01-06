import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAgentsContext } from './agents-provider'

export function AgentsPrimaryButtons() {
  const { setOpen } = useAgentsContext()

  return (
    <div className='flex gap-2'>
      <Button onClick={() => setOpen('add')}>
        <UserPlus className='me-2 h-4 w-4' /> Add Agent
      </Button>
    </div>
  )
}
