import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractTextFromFile, detectDocumentType } from '@/lib/document-processor'

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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
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

  // Read file buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  // Extract text content
  let extractedText: string
  try {
    extractedText = await extractTextFromFile(buffer, file.type)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to parse file: ${error}` },
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
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
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
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
