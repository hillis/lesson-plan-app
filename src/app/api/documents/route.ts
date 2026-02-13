import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractTextFromFile, detectDocumentType } from '@/lib/document-processor'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }

  // Filter out documents with missing storage files (checks run in parallel)
  const docs = data || []
  const checks = await Promise.all(
    docs.map(async (doc) => {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 60)
      if (storageError) {
        console.warn(`Document ${doc.id} missing from storage: ${doc.file_path}`)
        return null
      }
      return doc
    })
  )
  const availableDocuments = checks.filter(Boolean)

  return NextResponse.json(availableDocuments)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const documentType = formData.get('type') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File size must be under 20MB' }, { status: 400 })
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Allowed: PDF, DOCX, DOC, TXT, Markdown' },
      { status: 400 }
    )
  }

  // Read file buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  // Extract text content
  let extractedText: string
  try {
    extractedText = await extractTextFromFile(buffer, file.type)
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse file. Ensure the file is a valid PDF, DOCX, or text document.' },
      { status: 400 }
    )
  }

  // Auto-detect type if not provided
  const type = documentType || detectDocumentType(file.name, extractedText)

  // Upload to Supabase Storage
  const filePath = `${user.id}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, buffer, { contentType: file.type })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }

  // Save document record
  const { data, error } = await supabase
    .from('documents')
    .insert({
      teacher_id: user.id,
      name: file.name,
      type,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      parsed_content: { raw_text: extractedText },
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to save document record:', error)
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
  }

  // Get document to find file path
  const { data: doc } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single()

  if (doc) {
    // Delete from storage
    await supabase.storage.from('documents').remove([doc.file_path])
  }

  // Delete record
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) {
    console.error('Failed to delete document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
