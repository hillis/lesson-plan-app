'use client'

import { useEffect, useState } from 'react'
import { DocumentUploader } from '@/components/DocumentUploader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { downloadDocument } from '@/lib/download'
import { Download } from 'lucide-react'
import type { Document } from '@/types/database'

const TYPE_LABELS: Record<string, string> = {
  syllabus: 'Syllabus',
  standards: 'Standards',
  pacing_guide: 'Pacing Guide',
  other: 'Other',
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchDocuments = async () => {
    const response = await fetch('/api/documents')
    if (response.ok) {
      const data = await response.json()
      setDocuments(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return

    const response = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
    if (response.ok) {
      setDocuments(documents.filter((d) => d.id !== id))
    }
  }

  const handleUploadComplete = (doc: Document) => {
    setDocuments([doc, ...documents])
  }

  const handleDownload = (doc: Document) => {
    downloadDocument(doc.id, doc.name)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Documents</h1>
        <p className="text-gray-500 mt-1">
          Upload your course materials to personalize lesson generation
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <DocumentUploader onUploadComplete={handleUploadComplete} />

        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : documents.length === 0 ? (
              <p className="text-gray-500">No documents uploaded yet</p>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        {TYPE_LABELS[doc.type]} &bull;{' '}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        aria-label={`Download ${doc.name}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
