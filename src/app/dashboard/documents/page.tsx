'use client'

import { useEffect, useState } from 'react'
import { DocumentUploader } from '@/components/DocumentUploader'
import { GeneratedFilesList } from '@/components/GeneratedFilesList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Download, ChevronDown } from 'lucide-react'
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
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Documents</h1>
        <p className="text-muted-foreground mt-1">
          Upload your course materials to personalize lesson generation
        </p>
      </div>

      <Tabs defaultValue="uploaded" className="space-y-4">
        <TabsList>
          <TabsTrigger value="uploaded">Uploaded</TabsTrigger>
          <TabsTrigger value="generated">Generated</TabsTrigger>
        </TabsList>

        <TabsContent value="uploaded">
          <div className="grid md:grid-cols-2 gap-8">
            <DocumentUploader onUploadComplete={handleUploadComplete} />

            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : documents.length === 0 ? (
                  <p className="text-muted-foreground">No documents uploaded yet</p>
                ) : (
                  <>
                    {/* Bulk actions bar */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedIds.size === documents.length && documents.length > 0}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all documents"
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedIds.size > 0
                            ? `${selectedIds.size} selected`
                            : 'Select all'}
                        </span>
                      </div>
                      {selectedIds.size > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkDownload}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download {selectedIds.size} files
                        </Button>
                      )}
                    </div>

                    <ul className="space-y-3">
                      {documents.map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                        >
                          <Checkbox
                            checked={selectedIds.has(doc.id)}
                            onCheckedChange={() => toggleSelection(doc.id)}
                            aria-label={`Select ${doc.name}`}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {TYPE_LABELS[doc.type]} &bull;{' '}
                              {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {isDocx(doc.mime_type) ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Download ${doc.name}`}
                                  >
                                    <Download className="h-4 w-4" />
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
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
                                size="sm"
                                onClick={() => handleDownload(doc, 'original')}
                                aria-label={`Download ${doc.name}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(doc.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="generated">
          <Card>
            <CardHeader>
              <CardTitle>Generated Lesson Plans</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingGenerated ? (
                <p className="text-muted-foreground">Loading...</p>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
