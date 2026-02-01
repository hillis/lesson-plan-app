'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  onRename: (newName: string) => void
}

export function RenameDialog({ open, onOpenChange, currentName, onRename }: RenameDialogProps) {
  // Extract name without extension
  const extension = currentName.split('.').pop() || ''
  const baseName = currentName.replace(/\.[^/.]+$/, '')

  const [newName, setNewName] = useState(baseName)

  // Reset when dialog opens with new file
  useEffect(() => {
    if (open) {
      setNewName(baseName)
    }
  }, [open, baseName])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newName.trim()) {
      onRename(newName.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>
              Enter a new name for this file. The extension (.{extension}) will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">File name</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="File name"
                autoFocus
              />
              <span className="text-gray-500">.{extension}</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
