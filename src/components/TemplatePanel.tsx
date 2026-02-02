'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Check, ChevronDown } from 'lucide-react'
import { RenameDialog } from '@/components/RenameDialog'
import { TemplateUploader } from '@/components/TemplateUploader'
import { useToast } from '@/hooks/use-toast'
import type { Template } from '@/types/database'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

interface TemplatePanelProps {
  selectedId: string | null
  onSelect: (template: Template) => void
}

export function TemplatePanel({ selectedId, onSelect }: TemplatePanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Template | null>(null)
  const { toast } = useToast()

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
      toast({
        title: 'Error loading templates',
        description: 'Could not load template list',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen, fetchTemplates])

  const handleRename = async (id: string, newName: string) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Rename failed')
      }

      toast({ title: 'Template renamed', description: `Renamed to "${newName}"` })
      fetchTemplates()
    } catch (error) {
      toast({
        title: 'Rename failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (template: Template) => {
    if (!confirm(`Delete template "${template.name}"? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/templates?id=${template.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }

      toast({ title: 'Template deleted', description: `"${template.name}" has been removed.` })

      // If deleted template was selected, fall back to default
      if (selectedId === template.id) {
        const defaultTemplate = templates.find(t => t.id === 'default-cte')
        if (defaultTemplate) {
          onSelect(defaultTemplate)
        }
      }

      fetchTemplates()
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const selectedTemplate = templates.find(t => t.id === selectedId)
  const displayName = selectedTemplate?.name || 'CTE Lesson Plan'

  return (
    <>
      {/* Rename Dialog */}
      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        currentName={renameTarget?.name || ''}
        onRename={(newName) => {
          if (renameTarget) {
            handleRename(renameTarget.id, newName)
            setRenameTarget(null)
          }
        }}
      />

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="truncate">{displayName}</span>
            <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col">
          <SheetHeader>
            <SheetTitle>Lesson Plan Templates</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4 flex-1 overflow-y-auto">
            {/* Upload section */}
            <TemplateUploader onUploadComplete={fetchTemplates} />

            {/* Template list */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Available Templates</h4>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : templates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No templates available
                </p>
              ) : (
                templates.map(template => (
                  <div
                    key={template.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors ${
                      selectedId === template.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => {
                      onSelect(template)
                      setIsOpen(false)
                    }}
                  >
                    {/* Check icon for selected */}
                    <div className="w-5 shrink-0">
                      {selectedId === template.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>

                    {/* Template name, badge, and metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{template.name}</span>
                        {template.is_default && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {template.is_default
                          ? 'Built-in template with standard CTE format'
                          : `${formatBytes(template.file_size || 0)} - ${template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown date'}`
                        }
                      </p>
                    </div>

                    {/* Kebab menu - only for user templates (not default) */}
                    {!template.is_default && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Template options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-[100] bg-card border shadow-lg">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setRenameTarget(template)
                            }}
                            className="cursor-pointer"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(template)
                            }}
                            className="text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
