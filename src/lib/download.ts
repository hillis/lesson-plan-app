import { toast } from 'sonner'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export type DownloadFormat = 'original' | 'pdf'

/**
 * Download a document with progress tracking shown in toast notifications.
 * For larger files, shows download progress percentage.
 *
 * @param docId - The document ID to download
 * @param filename - The filename to save the file as
 * @param format - Download format: 'original' (default) or 'pdf' (for DOCX files)
 */
export async function downloadDocument(
  docId: string,
  filename: string,
  format: DownloadFormat = 'original'
): Promise<void> {
  let toastId: string | number = ''

  try {
    // Show initial loading toast
    const formatLabel = format === 'pdf' ? 'Converting to PDF...' : 'Preparing download...'
    toastId = toast.loading(formatLabel)

    // Fetch from API with format parameter
    const response = await fetch(`/api/documents/download?id=${docId}&format=${format}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Download failed' }))
      throw new Error(errorData.error || 'Download failed')
    }

    // For PDF conversion, the API returns the file directly (not a signed URL)
    if (format === 'pdf') {
      // The response is the PDF blob directly
      const blob = await response.blob()

      // Adjust filename for PDF
      const pdfFilename = filename.replace(/\.docx$/i, '.pdf')

      // Create object URL and trigger download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = pdfFilename
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Download complete', { id: toastId, description: pdfFilename })
      return
    }

    // Original format: use signed URL approach with progress tracking
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

/**
 * Download a generated file with progress tracking shown in toast notifications.
 * Uses the same pattern as downloadDocument but calls the generated-files endpoint.
 *
 * @param fileId - The generated file ID to download
 * @param filename - The filename to save the file as
 */
export async function downloadGeneratedFile(
  fileId: string,
  filename: string
): Promise<void> {
  let toastId: string | number = ''

  try {
    // Show initial loading toast
    toastId = toast.loading('Preparing download...')

    // Fetch from generated-files API
    const response = await fetch(`/api/generated-files/download?id=${fileId}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Download failed' }))
      throw new Error(errorData.error || 'Download failed')
    }

    // Use signed URL approach with progress tracking
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
 * Bulk download multiple generated files as a single .zip file.
 * Uses JSZip for browser-based zip creation and file-saver for download trigger.
 *
 * @param files - Array of generated files with id and name
 */
export async function downloadGeneratedFilesBulk(
  files: Array<{ id: string; name: string }>
): Promise<void> {
  // Safety limit per RESEARCH.md pitfall #5 - JSZip memory issues
  if (files.length > 10) {
    toast.error('Too many files selected', {
      description: 'Please select 10 or fewer files for bulk download'
    })
    return
  }

  if (files.length === 0) {
    toast.error('No files selected')
    return
  }

  let toastId: string | number = ''

  try {
    toastId = toast.loading('Preparing download...')

    const zip = new JSZip()

    // Fetch and add each file to the zip
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      toast.loading(`Downloading file ${i + 1} of ${files.length}...`, { id: toastId })

      // Fetch signed URL from generated-files API
      const response = await fetch(`/api/generated-files/download?id=${file.id}`)
      if (!response.ok) {
        throw new Error(`Failed to get download URL for ${file.name}`)
      }

      const { signedUrl } = await response.json()

      // Fetch actual file from signed URL
      const fileResponse = await fetch(signedUrl)
      if (!fileResponse.ok) {
        throw new Error(`Failed to download ${file.name}`)
      }

      const blob = await fileResponse.blob()
      zip.file(file.name, blob)
    }

    toast.loading('Creating zip file...', { id: toastId })

    // Generate zip with compression
    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    // Generate filename with date
    const filename = `generated-files-${new Date().toISOString().split('T')[0]}.zip`

    // Trigger download
    saveAs(content, filename)

    toast.success(`Downloaded ${files.length} files`, {
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

/**
 * Download all generated files as a single ZIP using server-side streaming.
 * Bypasses the 10-file JSZip limit by using the server-side archiver endpoint.
 *
 * @param fileIds - Array of generated file IDs to include in ZIP
 */
export async function downloadAllGeneratedFiles(
  fileIds: string[]
): Promise<void> {
  if (fileIds.length === 0) {
    toast.error('No files to download')
    return
  }

  const toastId = toast.loading('Preparing download...')

  try {
    const response = await fetch('/api/generated-files/download-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }))
      throw new Error(error.error || 'Download failed')
    }

    toast.loading('Creating ZIP file...', { id: toastId })

    const blob = await response.blob()
    const filename = response.headers
      .get('Content-Disposition')
      ?.match(/filename="(.+)"/)?.[1] || `lesson-plans-${new Date().toISOString().split('T')[0]}.zip`

    saveAs(blob, filename)
    toast.success(`Downloaded ${fileIds.length} files`, { id: toastId })
  } catch (error) {
    toast.error('Download failed', {
      id: toastId,
      description: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
