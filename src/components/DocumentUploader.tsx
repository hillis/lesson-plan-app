'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { Document, DocumentType } from '@/types/database'

interface DocumentUploaderProps {
  onUploadComplete?: (doc: Document) => void
}

const DOCUMENT_TYPES: { value: DocumentType; label: string; description: string }[] = [
  { value: 'syllabus', label: 'Syllabus', description: 'Course syllabus with weekly topics' },
  { value: 'standards', label: 'Standards', description: 'Content standards or learning objectives' },
  { value: 'pacing_guide', label: 'Pacing Guide', description: 'Calendar or pacing guide' },
  { value: 'other', label: 'Other', description: 'Other course materials' },
]

export function DocumentUploader({ onUploadComplete }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null)
  const { toast } = useToast()

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    if (selectedType) {
      formData.append('type', selectedType)
    }

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const doc = await response.json()
      toast({
        title: 'Document uploaded',
        description: `${file.name} has been processed and saved.`,
      })
      onUploadComplete?.(doc)
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      setSelectedType(null)
    }
  }, [selectedType, onUploadComplete, toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Upload your syllabus, standards, or other course materials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Document Type (optional)</Label>
          <div className="grid grid-cols-2 gap-2">
            {DOCUMENT_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={selectedType === type.value ? 'default' : 'outline'}
                className="justify-start h-auto py-2"
                onClick={() => setSelectedType(
                  selectedType === type.value ? null : type.value
                )}
              >
                <div className="text-left">
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs opacity-70">{type.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-200'}
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="space-y-2">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-gray-500">Processing document...</p>
            </div>
          ) : (
            <>
              <p className="text-gray-500 mb-2">
                Drag & drop a file here, or click to browse
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Supports PDF, Word (.docx), and text files
              </p>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload" asChild>
                <Button variant="outline" className="cursor-pointer">
                  Choose File
                </Button>
              </Label>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
