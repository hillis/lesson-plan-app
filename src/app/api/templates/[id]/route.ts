import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Prevent renaming default template
  if (id === 'default-cte') {
    return NextResponse.json(
      { error: 'Cannot rename default template' },
      { status: 400 }
    )
  }

  // Get new name from request body
  let body: { name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name } = body

  // Validate new name
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json(
      { error: 'Name is required and cannot be empty' },
      { status: 400 }
    )
  }

  const trimmedName = name.trim()

  // Verify template exists and belongs to user
  const { data: template, error: fetchError } = await supabase
    .from('templates')
    .select('id, teacher_id, is_default')
    .eq('id', id)
    .single()

  if (fetchError || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Verify ownership
  if (template.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Prevent renaming default templates (is_default check)
  if (template.is_default) {
    return NextResponse.json(
      { error: 'Cannot rename default template' },
      { status: 400 }
    )
  }

  // Update name in database
  const { data: updatedTemplate, error: updateError } = await supabase
    .from('templates')
    .update({ name: trimmedName })
    .eq('id', id)
    .eq('teacher_id', user.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(updatedTemplate)
}
