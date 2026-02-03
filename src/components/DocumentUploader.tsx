'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { Document, DocumentType } from '@/types/database'
import { Upload, File, FileText, Calendar, CheckCircle2 } from 'lucide-react'

interface DocumentUploaderProps {
  onUploadComplete?: (doc: Document) => void
}

const DOCUMENT_TYPES: { value: DocumentType; label: string; description: string; icon: any }[] = [
  { value: 'syllabus', label: 'Syllabus', description: 'Course syllabus with weekly topics', icon: FileText },
  { value: 'standards', label: 'Standards', description: 'Content standards or learning objectives', icon: CheckCircle2 },
  { value: 'pacing_guide', label: 'Pacing Guide', description: 'Calendar or pacing guide', icon: Calendar },
  { value: 'other', label: 'Other', description: 'Other course materials', icon: File },
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
    <div className="glass-card rounded-xl overflow-hidden h-full flex flex-col">
      <div className="p-6 pb-4">
        <h3 className="font-bold text-xl flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload Document
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your syllabus, standards, or other course materials
        </p>
      </div>

      <div className="px-6 pb-6 space-y-4 flex-1 flex flex-col">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Document Type</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DOCUMENT_TYPES.map((type) => {
              const Icon = type.icon
              const isSelected = selectedType === type.value
              return (
                <Button
                  key={type.value}
                  variant="outline"
                  className={`
                    justify-start h-auto py-3 px-3 relative overflow-hidden transition-all duration-200
                    ${isSelected
                      ? 'border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary z-10 ring-1 ring-primary'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-muted-foreground hover:text-foreground'
                    }
                  `}
                  onClick={() => setSelectedType(
                    isSelected ? null : type.value
                  )}
                >
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                  )}
                  <div className="flex gap-3 items-start text-left w-full">
                    <div className={`
                      p-2 rounded-md shrink-0 transition-colors
                      ${isSelected ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className={`font-semibold text-sm mb-0.5 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {type.label}
                      </div>
                      <div className="text-[10px] leading-tight opacity-70 whitespace-normal text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 flex-1 flex flex-col items-center justify-center min-h-[160px] cursor-pointer group
            ${isDragging
              ? 'border-primary bg-primary/10 scale-[0.99] shadow-inner'
              : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/30'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          {isUploading ? (
            <div className="space-y-3">
              <div className="relative">
                <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
              <p className="text-sm font-medium animate-pulse">Processing document...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/5 group-hover:border-primary/20 group-hover:bg-primary/5">
                <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-foreground font-medium mb-1 group-hover:text-primary transition-colors">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground max-w-[200px] mb-4">
                Supports PDF, DOCX, TXT, and MD files
              </p>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="default"
                size="sm"
                className="rounded-full px-6 shadow-lg shadow-primary/20 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300"
                onClick={(e) => {
                  e.stopPropagation()
                  document.getElementById('file-upload')?.click()
                }}
              >
                Select File
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

