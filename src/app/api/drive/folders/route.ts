import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createDriveClient, listFolders } from '@/lib/google/drive'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: teacher } = await supabase
    .from('teachers')
    .select('google_drive_token')
    .eq('id', user.id)
    .single()

  if (!teacher?.google_drive_token) {
    return NextResponse.json({ error: 'Google Drive not connected' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const parentId = searchParams.get('parentId') || undefined

  try {
    const drive = createDriveClient(
      teacher.google_drive_token.access_token,
      teacher.google_drive_token.refresh_token
    )

    const folders = await listFolders(drive, parentId)
    return NextResponse.json(folders)
  } catch (error) {
    console.error('Drive folders error:', error)
    return NextResponse.json({ error: 'Failed to list folders' }, { status: 500 })
  }
}
