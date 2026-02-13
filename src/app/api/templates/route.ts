import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Template } from '@/types/database'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

// Default template shipped with app (stored in public/templates/)
const DEFAULT_TEMPLATE: Template = {
  id: 'default-cte',
  teacher_id: null,
  name: 'CTE Lesson Plan',
  file_path: 'defaults/cte-lesson-plan.docx',
  file_size: null,
  is_default: true,
  created_at: '2026-01-01T00:00:00Z'
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's templates from database
  const { data: userTemplates, error } = await supabase
    .from('templates')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }

  // Prepend default template (always first)
  return NextResponse.json([DEFAULT_TEMPLATE, ...(userTemplates || [])])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type (.docx MIME or .docx extension)
  const isValidMime = file.type === ALLOWED_MIME_TYPE
  const isValidExtension = file.name.toLowerCase().endsWith('.docx')

  if (!isValidMime && !isValidExtension) {
    return NextResponse.json(
      { error: 'Only .docx files are allowed' },
      { status: 400 }
    )
  }

  // Validate file size (10MB limit)
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File size must be under 10MB' },
      { status: 400 }
    )
  }

  // Read file buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  // Upload to Supabase Storage: templates/{user.id}/{timestamp}-{filename}
  const filePath = `${user.id}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('templates')
    .upload(filePath, buffer, {
      contentType: ALLOWED_MIME_TYPE,
      upsert: false
    })

  if (uploadError) {
    console.error('Template upload error:', uploadError)
    return NextResponse.json({ error: 'Failed to upload template' }, { status: 500 })
  }

  // Extract name without .docx extension for display
  const displayName = file.name.replace(/\.docx$/i, '')

  // Insert record into templates table
  const { data, error } = await supabase
    .from('templates')
    .insert({
      teacher_id: user.id,
      name: displayName,
      file_path: filePath,
      file_size: file.size,
      is_default: false
    })
    .select()
    .single()

  if (error) {
    // Clean up storage file if database insert fails
    await supabase.storage.from('templates').remove([filePath])
    console.error('Failed to save template record:', error)
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
  }

  // Prevent deleting default template
  if (id === 'default-cte') {
    return NextResponse.json(
      { error: 'Cannot delete default template' },
      { status: 400 }
    )
  }

  // Get template to verify ownership and get file path
  const { data: template } = await supabase
    .from('templates')
    .select('file_path, teacher_id, is_default')
    .eq('id', id)
    .single()

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Verify ownership (user can only delete own templates)
  if (template.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Prevent deleting default templates (is_default check)
  if (template.is_default) {
    return NextResponse.json(
      { error: 'Cannot delete default template' },
      { status: 400 }
    )
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('templates')
    .remove([template.file_path])

  if (storageError) {
    console.warn(`Failed to delete template file: ${template.file_path}`, storageError)
    // Continue with database deletion even if storage delete fails
  }

  // Delete from database
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) {
    console.error('Failed to delete template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
