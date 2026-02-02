import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createDriveClient, createFolder } from '@/lib/google/drive'

export async function POST(request: Request) {
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

  const { name, parentId } = await request.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
  }

  try {
    const drive = createDriveClient(
      teacher.google_drive_token.access_token,
      teacher.google_drive_token.refresh_token,
      async (tokens) => {
        await supabase
          .from('teachers')
          .update({
            google_drive_token: {
              access_token: tokens.access_token || teacher.google_drive_token.access_token,
              refresh_token: tokens.refresh_token || teacher.google_drive_token.refresh_token,
              scopes: teacher.google_drive_token.scopes,
            },
          })
          .eq('id', user.id)
      }
    )

    // Use undefined for root, not 'root' string
    const actualParentId = parentId && parentId !== 'root' ? parentId : undefined
    const folder = await createFolder(drive, name.trim(), actualParentId)

    return NextResponse.json({
      id: folder.id,
      name: name.trim(),
    })
  } catch (error: any) {
    console.error('Create folder error:', error)

    if (error.code === 401 || error.code === 403) {
      return NextResponse.json(
        { error: 'Drive access expired', needsReauth: true },
        { status: 401 }
      )
    }

    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}
