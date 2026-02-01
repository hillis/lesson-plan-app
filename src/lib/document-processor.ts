import mammoth from 'mammoth'

// Dynamically import pdf-parse to avoid the test file loading issue
async function parsePDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse/lib/pdf-parse')).default
  const data = await pdfParse(buffer)
  return data.text
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    return await parsePDF(buffer)
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return buffer.toString('utf-8')
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}

export function detectDocumentType(
  filename: string,
  content: string
): 'syllabus' | 'standards' | 'pacing_guide' | 'other' {
  const lowerName = filename.toLowerCase()
  const lowerContent = content.toLowerCase().slice(0, 2000)

  if (lowerName.includes('syllabus') || lowerContent.includes('course syllabus')) {
    return 'syllabus'
  }

  if (
    lowerName.includes('standard') ||
    lowerContent.includes('content standard') ||
    lowerContent.includes('learning standard')
  ) {
    return 'standards'
  }

  if (
    lowerName.includes('pacing') ||
    lowerName.includes('calendar') ||
    lowerContent.includes('pacing guide')
  ) {
    return 'pacing_guide'
  }

  return 'other'
}
