'use client'

import { useEffect, useState } from 'react'
import { DocumentUploader } from '@/components/DocumentUploader'
import { GeneratedFilesList } from '@/components/GeneratedFilesList'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  downloadDocument,
  downloadDocumentsBulk,
  downloadGeneratedFile,
  downloadGeneratedFilesBulk,
  type DownloadFormat
} from '@/lib/download'
import { Download, ChevronDown, FileText, Trash2 } from 'lucide-react'
import type { Document, GeneratedFile } from '@/types/database'

const TYPE_LABELS: Record<string, string> = {
  syllabus: 'Syllabus',
  standards: 'Standards',
  pacing_guide: 'Pacing Guide',
  other: 'Other',
}

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const isDocx = (mimeType: string | null) => mimeType === DOCX_MIME_TYPE

export default function DocumentsPage() {
  // Uploaded documents state
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Generated files state
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([])
  const [isLoadingGenerated, setIsLoadingGenerated] = useState(true)
  const [selectedGeneratedIds, setSelectedGeneratedIds] = useState<Set<string>>(new Set())

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(documents.map(d => d.id)))
    }
  }

  const handleBulkDownload = () => {
    const selected = documents.filter(d => selectedIds.has(d.id))
    downloadDocumentsBulk(selected.map(d => ({ id: d.id, name: d.name })))
  }

  const fetchDocuments = async () => {
    const response = await fetch('/api/documents')
    if (response.ok) {
      const data = await response.json()
      setDocuments(data)
    }
    setIsLoading(false)
  }

  const fetchGeneratedFiles = async () => {
    const response = await fetch('/api/generated-files')
    if (response.ok) {
      const data = await response.json()
      setGeneratedFiles(data)
    }
    setIsLoadingGenerated(false)
  }

  useEffect(() => {
    fetchDocuments()
    fetchGeneratedFiles()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return

    const response = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
    if (response.ok) {
      setDocuments(documents.filter((d) => d.id !== id))
      // Remove from selection if it was selected
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleDeleteGenerated = async (id: string) => {
    // Note: confirmation dialog is handled in GeneratedFilesList component
    const response = await fetch(`/api/generated-files?id=${id}`, { method: 'DELETE' })
    if (response.ok) {
      setGeneratedFiles(files => files.filter(f => f.id !== id))
      setSelectedGeneratedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleRenameGenerated = async (id: string, newName: string) => {
    const response = await fetch('/api/generated-files', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, newName })
    })
    if (response.ok) {
      const updated = await response.json()
      setGeneratedFiles(files => files.map(f => f.id === id ? updated : f))
    }
  }

  const handleUploadComplete = (doc: Document) => {
    setDocuments([doc, ...documents])
  }

  const handleDownload = (doc: Document, format: DownloadFormat = 'original') => {
    downloadDocument(doc.id, doc.name, format)
  }

  const handleDownloadGenerated = (file: GeneratedFile) => {
    downloadGeneratedFile(file.id, file.name)
  }

  const handleBulkDownloadGenerated = (files: GeneratedFile[]) => {
    downloadGeneratedFilesBulk(files.map(f => ({ id: f.id, name: f.name })))
  }

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
        <p className="text-muted-foreground text-lg">
          Manage your course materials and generated lesson plans
        </p>
      </div>

      <Tabs defaultValue="uploaded" className="space-y-6">
        <div className="glass-card p-1 rounded-xl inline-flex">
          <TabsList className="bg-transparent border-0 p-0 h-auto gap-2">
            <TabsTrigger
              value="uploaded"
              className="px-6 py-2.5 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
            >
              Uploaded Materials
            </TabsTrigger>
            <TabsTrigger
              value="generated"
              className="px-6 py-2.5 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
            >
              Generated Plans
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="uploaded" className="space-y-6 mt-0">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <DocumentUploader onUploadComplete={handleUploadComplete} />
            </div>

            <div className="lg:col-span-2 glass-card rounded-xl p-6 h-fit">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Files Library</h2>
                  <p className="text-sm text-muted-foreground">Your uploaded curriculum files</p>
                </div>
                {documents.length > 0 && selectedIds.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDownload}
                    className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Selected ({selectedIds.size})
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center p-12 text-muted-foreground">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <span>Loading files...</span>
                    </div>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center p-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">No documents uploaded yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload a syllabus or standards file to get started</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground border-b border-white/5">
                      <Checkbox
                        checked={selectedIds.size === documents.length && documents.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all documents"
                      />
                      <span>Select All</span>
                    </div>

                    <ul className="space-y-2">
                      {documents.map((doc) => (
                        <li
                          key={doc.id}
                          className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                        >
                          <Checkbox
                            checked={selectedIds.has(doc.id)}
                            onCheckedChange={() => toggleSelection(doc.id)}
                            aria-label={`Select ${doc.name}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-foreground/90">{doc.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 uppercase text-[10px] font-bold tracking-wider">
                                {TYPE_LABELS[doc.type] || 'DOC'}
                              </span>
                              <span>&bull;</span>
                              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            {isDocx(doc.mime_type) ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-white/10"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass-card border-white/10">
                                  <DropdownMenuItem onClick={() => handleDownload(doc, 'original')}>
                                    Download as DOCX
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownload(doc, 'pdf')}>
                                    Download as PDF
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-white/10"
                                onClick={() => handleDownload(doc, 'original')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="generated" className="mt-0">
          <div className="glass-card rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Generated Lesson Plans</h2>
              <p className="text-sm text-muted-foreground">All your AI-generated materials</p>
            </div>

            {isLoadingGenerated ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                <div className="animate-pulse flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10" />
                  <span>Loading generated files...</span>
                </div>
              </div>
            ) : (
              <GeneratedFilesList
                files={generatedFiles}
                selectedIds={selectedGeneratedIds}
                onSelectionChange={setSelectedGeneratedIds}
                onDownload={handleDownloadGenerated}
                onBulkDownload={handleBulkDownloadGenerated}
                onDelete={handleDeleteGenerated}
                onRename={handleRenameGenerated}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

