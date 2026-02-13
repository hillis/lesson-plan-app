import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('generated_files')
    .select('*')
    .eq('teacher_id', user.id)
    .order('week_number', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch generated files:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }

  // Filter out files with missing storage files (checks run in parallel)
  const files = data || []
  const checks = await Promise.all(
    files.map(async (file) => {
      const { error: storageError } = await supabase.storage
        .from('generated-files')
        .createSignedUrl(file.file_path, 60)
      if (storageError) {
        console.warn(`Generated file ${file.id} missing from storage: ${file.file_path}`)
        return null
      }
      return file
    })
  )
  const availableFiles = checks.filter(Boolean)

  return NextResponse.json(availableFiles)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, newName } = await request.json()

  if (!id || !newName) {
    return NextResponse.json({ error: 'File ID and new name required' }, { status: 400 })
  }

  // Get existing file to verify ownership and preserve extension
  const { data: file, error: fetchError } = await supabase
    .from('generated_files')
    .select('name, teacher_id')
    .eq('id', id)
    .single()

  if (fetchError || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  // Security check: verify file belongs to authenticated user
  if (file.teacher_id !== user.id) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  // Preserve extension: extract from current name, strip from newName, recombine
  const extension = file.name.split('.').pop()
  const baseName = newName.replace(/\.[^/.]+$/, '') // Strip any extension user might have added
  const finalName = `${baseName}.${extension}`

  // Update name in database
  const { data: updated, error: updateError } = await supabase
    .from('generated_files')
    .update({ name: finalName })
    .eq('id', id)
    .eq('teacher_id', user.id)
    .select()
    .single()

  if (updateError) {
    console.error('Failed to rename file:', updateError)
    return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 })
  }

  return NextResponse.json(updated)
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
    return NextResponse.json({ error: 'File ID required' }, { status: 400 })
  }

  // Get file to find file path
  const { data: file } = await supabase
    .from('generated_files')
    .select('file_path')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single()

  if (file) {
    // Delete from storage first
    await supabase.storage.from('generated-files').remove([file.file_path])
  }

  // Delete record from database
  const { error } = await supabase
    .from('generated_files')
    .delete()
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) {
    console.error('Failed to delete file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
