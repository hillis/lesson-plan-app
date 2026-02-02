'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface Folder {
  id: string
  name: string
}

interface DriveFilePickerProps {
  onSelect: (folderId: string, folderName: string) => void
  selectedFolderId?: string
}

export function DriveFilePicker({ onSelect, selectedFolderId }: DriveFilePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'My Drive' },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string>('My Drive')
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchFolders = async (parentId?: string) => {
    setIsLoading(true)
    setError(null)

    const url = parentId
      ? `/api/drive/folders?parentId=${parentId}`
      : '/api/drive/folders'

    try {
      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setFolders(data)
      } else if (response.status === 401) {
        const data = await response.json()
        if (data.needsReauth) {
          setError('Your Google Drive permissions need to be updated. Please sign out and sign in again to grant folder access.')
        } else {
          setError('Please sign in with Google to access Drive folders.')
        }
      } else {
        setError('Failed to load folders. Please try again.')
      }
    } catch (err) {
      setError('Failed to connect to Google Drive.')
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      fetchFolders(currentFolder || undefined)
    }
  }, [isOpen, currentFolder])

  const navigateToFolder = (folder: Folder) => {
    setCurrentFolder(folder.id)
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }])
  }

  const navigateBack = (index: number) => {
    const newPath = folderPath.slice(0, index + 1)
    setFolderPath(newPath)
    setCurrentFolder(newPath[newPath.length - 1].id)
  }

  const handleSelect = () => {
    const current = folderPath[folderPath.length - 1]
    onSelect(current.id || 'root', current.name)
    setSelectedName(current.name)
    setIsOpen(false)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    setCreateError(null)
    try {
      const response = await fetch('/api/drive/folders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolder,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create folder')
      }

      const newFolder = await response.json()

      // Add to folder list and auto-select by navigating into it
      setFolders([newFolder, ...folders])
      navigateToFolder(newFolder)

      // Reset creation state
      setIsCreating(false)
      setNewFolderName('')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create folder')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.27 0 3.78-.01 3.78-.024 0-.015-1.7-2.97-3.78-6.567l-3.79-6.603c-.01-.012-1.69-.047-3.76-.047zm-3.76.062c-.01 0-1.7 2.97-3.78 6.567L.69 14.717c-.01.012 1.69.047 3.76.047s3.78-.02 3.78-.047c0-.02-1.7-2.97-3.78-6.567L.69 1.577c-.01-.012-.02-.03-.01-.03h7.57zM8.45 15.64l-3.78 6.57c-.01.012 1.69.047 3.76.047s3.78-.02 3.78-.047l3.78-6.57z"/>
          </svg>
          Save to: {selectedName}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Google Drive Folder</DialogTitle>
        </DialogHeader>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
          {folderPath.map((item, index) => (
            <span key={index} className="flex items-center">
              {index > 0 && <span className="mx-1">/</span>}
              <button
                onClick={() => navigateBack(index)}
                className="hover:text-gray-900 hover:underline"
              >
                {item.name}
              </button>
            </span>
          ))}
        </div>

        {/* New Folder creation */}
        {isCreating ? (
          <div className="flex gap-2 mb-3">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder()
                if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewFolderName('')
                  setCreateError(null)
                }
              }}
            />
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
            <Button variant="outline" onClick={() => {
              setIsCreating(false)
              setNewFolderName('')
              setCreateError(null)
            }}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsCreating(true)}
            className="w-full justify-start mb-3"
            disabled={!!error}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Folder
          </Button>
        )}
        {createError && (
          <p className="text-red-600 text-sm mb-3">{createError}</p>
        )}

        {/* Folder list */}
        <div className="border rounded-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-600 text-sm mb-2">{error}</p>
              <a
                href="/api/auth/signout"
                className="text-blue-600 hover:underline text-sm"
              >
                Sign out to re-authenticate
              </a>
            </div>
          ) : folders.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No subfolders</div>
          ) : (
            <ul className="divide-y">
              {folders.map((folder) => (
                <li key={folder.id}>
                  <button
                    onClick={() => navigateToFolder(folder)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
                  >
                    <svg className="mr-2 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    {folder.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect}>
            Select This Folder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
