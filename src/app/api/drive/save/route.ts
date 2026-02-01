import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createDriveClient, createFolder, uploadFile } from '@/lib/google/drive'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get teacher's Google tokens
  const { data: teacher } = await supabase
    .from('teachers')
    .select('google_drive_token, google_drive_folder_id')
    .eq('id', user.id)
    .single()

  if (!teacher?.google_drive_token) {
    return NextResponse.json(
      { error: 'Google Drive not connected. Please re-login.' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const { generation_id, files, folder_name } = body

  if (!files || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: 'No files to save' }, { status: 400 })
  }

  try {
    const drive = createDriveClient(
      teacher.google_drive_token.access_token,
      teacher.google_drive_token.refresh_token
    )

    // Create folder for this generation
    const folder = await createFolder(
      drive,
      folder_name || `Week ${new Date().toISOString().slice(0, 10)}`,
      teacher.google_drive_folder_id || undefined
    )

    // Upload each file
    const uploadedFiles = []
    for (const file of files) {
      const result = await uploadFile(
        drive,
        file.name,
        Buffer.from(file.content, 'base64'),
        file.mimeType,
        folder.id
      )
      uploadedFiles.push({
        name: file.name,
        url: result.url,
      })
    }

    // Update generation with Drive folder URL
    if (generation_id) {
      await supabase
        .from('generations')
        .update({ drive_folder_url: folder.url })
        .eq('id', generation_id)
    }

    return NextResponse.json({
      folder_url: folder.url,
      files: uploadedFiles,
    })
  } catch (error) {
    console.error('Drive save error:', error)
    return NextResponse.json(
      { error: 'Failed to save to Google Drive' },
      { status: 500 }
    )
  }
}
