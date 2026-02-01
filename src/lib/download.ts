import { toast } from 'sonner'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

/**
 * Download a document with progress tracking shown in toast notifications.
 * For larger files, shows download progress percentage.
 *
 * @param docId - The document ID to download
 * @param filename - The filename to save the file as
 */
export async function downloadDocument(docId: string, filename: string): Promise<void> {
  let toastId: string | number = ''

  try {
    // Show initial loading toast
    toastId = toast.loading('Preparing download...')

    // Fetch signed URL from API
    const response = await fetch(`/api/documents/download?id=${docId}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Download failed' }))
      throw new Error(errorData.error || 'Download failed')
    }

    const { signedUrl } = await response.json()

    // Fetch actual file from signed URL
    const fileResponse = await fetch(signedUrl)

    if (!fileResponse.ok) {
      throw new Error('Failed to retrieve file')
    }

    // Get content-length for progress tracking
    const contentLength = fileResponse.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0

    // Check if body is readable stream
    if (!fileResponse.body) {
      throw new Error('ReadableStream not supported')
    }

    // Get reader for streaming
    const reader = fileResponse.body.getReader()
    const chunks: Uint8Array[] = []
    let receivedLength = 0

    // Read in loop with progress updates
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      chunks.push(value)
      receivedLength += value.length

      // Update toast with progress percentage for files with known size
      if (total > 0) {
        const percent = Math.round((receivedLength / total) * 100)
        toast.loading(`Downloading ${filename}... ${percent}%`, { id: toastId })
      }
    }

    // Concatenate all chunks into a single array
    const allChunks = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      allChunks.set(chunk, position)
      position += chunk.length
    }

    // Create blob from concatenated array
    const blob = new Blob([allChunks])

    // Create object URL and trigger download
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    // Clean up
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Update toast to success
    toast.success('Download complete', { id: toastId, description: filename })
  } catch (error) {
    // Update toast to error
    toast.error('Download failed', {
      id: toastId,
      description: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Bulk download multiple documents as a single .zip file.
 * Uses JSZip for browser-based zip creation and file-saver for download trigger.
 *
 * @param documents - Array of documents with id and name
 */
export async function downloadDocumentsBulk(
  documents: Array<{ id: string; name: string }>
): Promise<void> {
  // Safety limit per RESEARCH.md pitfall #3 - JSZip memory issues
  if (documents.length > 10) {
    toast.error('Too many files selected', {
      description: 'Please select 10 or fewer documents for bulk download'
    })
    return
  }

  if (documents.length === 0) {
    toast.error('No documents selected')
    return
  }

  let toastId: string | number = ''

  try {
    toastId = toast.loading('Preparing download...')

    const zip = new JSZip()

    // Fetch and add each document to the zip
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i]
      toast.loading(`Downloading file ${i + 1} of ${documents.length}...`, { id: toastId })

      // Fetch signed URL from API
      const response = await fetch(`/api/documents/download?id=${doc.id}`)
      if (!response.ok) {
        throw new Error(`Failed to get download URL for ${doc.name}`)
      }

      const { signedUrl } = await response.json()

      // Fetch actual file from signed URL
      const fileResponse = await fetch(signedUrl)
      if (!fileResponse.ok) {
        throw new Error(`Failed to download ${doc.name}`)
      }

      const blob = await fileResponse.blob()
      zip.file(doc.name, blob)
    }

    toast.loading('Creating zip file...', { id: toastId })

    // Generate zip with compression
    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    // Generate filename with date
    const filename = `documents-${new Date().toISOString().split('T')[0]}.zip`

    // Trigger download
    saveAs(content, filename)

    toast.success(`Downloaded ${documents.length} files`, {
      id: toastId,
      description: filename
    })
  } catch (error) {
    toast.error('Bulk download failed', {
      id: toastId,
      description: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
