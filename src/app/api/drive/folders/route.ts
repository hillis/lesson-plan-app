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
      teacher.google_drive_token.refresh_token,
      async (tokens) => {
        // Persist refreshed tokens to database
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

    const folders = await listFolders(drive, parentId)
    return NextResponse.json(folders)
  } catch (error: unknown) {
    console.error('Drive folders error:', error)

    // Check for auth-specific errors (token expired, scope insufficient)
    const errCode = (error as { code?: number })?.code
    if (errCode === 401 || errCode === 403) {
      return NextResponse.json(
        { error: 'Drive access expired', needsReauth: true },
        { status: 401 }
      )
    }

    return NextResponse.json({ error: 'Failed to list folders' }, { status: 500 })
  }
}
