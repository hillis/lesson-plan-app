import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: teacher } = await supabase
    .from('teachers')
    .select('google_drive_folder_id')
    .eq('id', user.id)
    .single()

  // Return null folder_id if not set (will default to My Drive on client)
  return NextResponse.json({
    folder_id: teacher?.google_drive_folder_id || null,
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { folder_id } = await request.json()

  // Convert 'root' to null for database storage
  const folderIdToStore = folder_id === 'root' ? null : folder_id

  const { error } = await supabase
    .from('teachers')
    .update({ google_drive_folder_id: folderIdToStore })
    .eq('id', user.id)

  if (error) {
    console.error('Failed to save folder preference:', error)
    return NextResponse.json({ error: 'Failed to save preference' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
