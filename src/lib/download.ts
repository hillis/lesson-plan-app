import { toast } from 'sonner'

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
