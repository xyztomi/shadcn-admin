import { useDeleteAgent } from '@/api/agents'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useAgentsContext } from './agents-provider'

export function AgentsDeleteDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useAgentsContext()
  const deleteMutation = useDeleteAgent()

  const handleDelete = async () => {
    if (!currentRow) return
    await deleteMutation.mutateAsync(currentRow.id)
    setOpen(null)
    setCurrentRow(null)
  }

  if (open !== 'delete' || !currentRow) return null

  return (
    <ConfirmDialog
      open={open === 'delete'}
      onOpenChange={() => {
        setOpen(null)
        setCurrentRow(null)
      }}
      title={`Delete ${currentRow.full_name}?`}
      desc={`Are you sure you want to delete agent "${currentRow.username}"? This action cannot be undone.`}
      confirmText='Delete'
      destructive
      handleConfirm={handleDelete}
      isLoading={deleteMutation.isPending}
    />
  )
}
