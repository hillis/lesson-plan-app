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
    return NextResponse.json({ error: 'File ID required' }, { status: 400 })
  }

  // Get file metadata
  const { data: file, error: fileError } = await supabase
    .from('generated_files')
    .select('file_path, name, mime_type, teacher_id')
    .eq('id', id)
    .single()

  if (fileError || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  // Security check: verify file belongs to authenticated user
  if (file.teacher_id !== user.id) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  // Generate signed URL with 1-hour expiry
  const { data, error } = await supabase.storage
    .from('generated-files')
    .createSignedUrl(file.file_path, 3600, {
      download: file.name // Triggers browser download with correct filename
    })

  if (error) {
    // Check for "Object not found" error indicating missing storage file
    if (error.message.includes('Object not found') || error.message.includes('not found')) {
      console.warn(`Generated file ${id} missing from storage: ${file.file_path}`)
      return NextResponse.json({ error: 'File not available' }, { status: 404 })
    }
    console.error('Storage signed URL error:', error)
    return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 })
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    filename: file.name,
    mimeType: file.mime_type
  })
}
