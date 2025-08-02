'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/contexts/ToastContext'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
}

interface DeleteClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onClientDeleted: (clientId: string) => void
}

export function DeleteClientDialog({
  open,
  onOpenChange,
  client,
  onClientDeleted,
}: DeleteClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showError, showSuccess } = useToast()

  // Debug: Log when dialog opens/closes
  React.useEffect(() => {
    console.log(
      'DeleteClientDialog open state changed:',
      open,
      'client:',
      client?.name
    )
  }, [open, client])

  const handleDelete = async (e?: React.MouseEvent) => {
    // Prevent any form submission or navigation
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!client) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('Deleting client:', client.id)

      // Prevent any navigation during the operation
      if (typeof window !== 'undefined') {
        // Store current location to prevent navigation
        const currentPath = window.location.pathname + window.location.search

        // Override any potential navigation
        const originalPushState = window.history.pushState
        const originalReplaceState = window.history.replaceState

        window.history.pushState = () => {}
        window.history.replaceState = () => {}

        // Restore after operation
        setTimeout(() => {
          window.history.pushState = originalPushState
          window.history.replaceState = originalReplaceState
          window.history.replaceState(null, '', currentPath)
        }, 500)
      }

      // Call the API to delete the client
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      })

      console.log('API Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(
          errorData.details || errorData.error || 'Failed to delete client'
        )
      }

      const result = await response.json()
      console.log('API Success:', result)

      // Call the callback immediately to update the UI
      onClientDeleted(client.id)

      // Close dialog after callback
      setTimeout(() => {
        onOpenChange(false)
      }, 50)
    } catch (error) {
      console.error('Error deleting client:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      showError('Delete Failed', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setError(null)
    onOpenChange(false)
  }

  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Client</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this client? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900">{client.name}</h4>
            {client.email && (
              <p className="text-sm text-gray-600">{client.email}</p>
            )}
            {client.company && (
              <p className="text-sm text-gray-600">{client.company}</p>
            )}
            {client.phone && (
              <p className="text-sm text-gray-600">{client.phone}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                console.log('Test toast button clicked')
                showSuccess('Test Toast', 'This is a test toast message')
              }}
              disabled={isLoading}
            >
              Test Toast
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Client'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
