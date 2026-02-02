'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { Upload } from 'lucide-react'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

interface TemplateUploaderProps {
  onUploadComplete: () => void
}

export function TemplateUploader({ onUploadComplete }: TemplateUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const validateFile = (file: File): string | null => {
    // Check file type - accept either MIME type or extension (lenient validation)
    if (file.type !== ALLOWED_TYPE && !file.name.endsWith('.docx')) {
      return 'Only .docx files are allowed'
    }
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be under 10MB'
    }
    return null
  }

  const handleUpload = useCallback(async (file: File) => {
    const error = validateFile(file)
    if (error) {
      toast({ title: 'Upload failed', description: error, variant: 'destructive' })
      return
    }

    setIsUploading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            try {
              const response = JSON.parse(xhr.responseText)
              reject(new Error(response.error || 'Upload failed'))
            } catch {
              reject(new Error('Upload failed'))
            }
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('POST', '/api/templates')
        xhr.send(formData)
      })

      toast({ title: 'Template uploaded', description: `${file.name} is ready to use.` })
      onUploadComplete()
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }, [toast, onUploadComplete])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    // Reset input value so same file can be selected again
    e.target.value = ''
  }, [handleUpload])

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-4 text-center transition-colors
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">Uploading... {progress}%</p>
        </div>
      ) : (
        <>
          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag & drop a template, or click to browse
          </p>
          <p className="text-xs text-muted-foreground/70 mb-3">
            .docx files only, max 10MB
          </p>
          <input
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            className="hidden"
            id="template-upload"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('template-upload')?.click()}
          >
            Choose File
          </Button>
        </>
      )}
    </div>
  )
}
