import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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

  // Get document metadata
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('file_path, name, mime_type, teacher_id')
    .eq('id', id)
    .single()

  if (docError || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Security check: verify document belongs to authenticated user
  if (doc.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Create signed URL (valid for 1 hour to handle slow connections)
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.file_path, 3600, {
      download: doc.name // Triggers browser download with original filename
    })

  if (error) {
    // Check for "Object not found" error indicating missing storage file
    if (error.message.includes('Object not found') || error.message.includes('not found')) {
      console.warn(`Document ${id} missing from storage: ${doc.file_path}`)
      return NextResponse.json({ error: 'File not available' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    filename: doc.name,
    mimeType: doc.mime_type
  })
}
