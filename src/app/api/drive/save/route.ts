import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createDriveClient, createFolder, uploadFile } from '@/lib/google/drive'
import { generateAllDocuments, type GeneratedFile } from '@/lib/document-generator'
import type { LessonPlanInput } from '@/types/lesson'

// Map document-generator types to display types per CONTEXT.md
function mapToDisplayType(type: GeneratedFile['type']): string {
  const mapping: Record<string, string> = {
    'lesson_plan': 'CTE',
    'teacher_handout': 'Teacher',
    'student_handout': 'Student',
    'presentation': 'Presentation',
  }
  return mapping[type] || 'CTE'
}

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
  const { generation_id, files: providedFiles, folder_name, lesson_plan, week_number, folder_id } = body

  // Generate documents from lesson_plan if provided, otherwise use provided files
  let files: Array<{ name: string; content: string; mimeType: string }>
  let generatedFilesForStorage: GeneratedFile[] = []

  if (lesson_plan) {
    // Generate DOCX files from the lesson plan
    generatedFilesForStorage = await generateAllDocuments(lesson_plan as LessonPlanInput)
    files = generatedFilesForStorage.map(file => ({
      name: file.name,
      content: file.content.toString('base64'),
      mimeType: file.mimeType,
    }))
  } else if (providedFiles && Array.isArray(providedFiles) && providedFiles.length > 0) {
    files = providedFiles
  } else {
    return NextResponse.json({ error: 'No files or lesson_plan provided' }, { status: 400 })
  }

  // Auto-save to Supabase Storage (always happens before Drive upload)
  // This ensures files persist in app storage regardless of Drive save success
  if (generatedFilesForStorage.length > 0) {
    const weekNum = week_number || (lesson_plan ? parseInt(lesson_plan.week) : 1)

    for (const file of generatedFilesForStorage) {
      const filePath = `${user.id}/${Date.now()}-${file.name}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('generated-files')
        .upload(filePath, file.content, {
          contentType: file.mimeType,
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        // Continue with Drive save even if storage fails
        // Files will still be available in Drive
        continue
      }

      // Map type to display type
      const fileType = mapToDisplayType(file.type)

      // Save metadata to database
      const { error: dbError } = await supabase.from('generated_files').insert({
        teacher_id: user.id,
        generation_id: generation_id || null,
        name: file.name,
        file_path: filePath,
        file_size: file.content.length,
        mime_type: file.mimeType,
        file_type: fileType,
        week_number: weekNum,
        week_start_date: null,  // Optional, can be null
      })

      if (dbError) {
        console.error('Database insert error:', dbError)
        // Continue with Drive save
      }
    }
  }

  try {
    const drive = createDriveClient(
      teacher.google_drive_token.access_token,
      teacher.google_drive_token.refresh_token
    )

    // Use client-provided folder_id, fall back to database, then undefined (root)
    const parentFolderId = folder_id && folder_id !== 'root'
      ? folder_id
      : (teacher.google_drive_folder_id || undefined)

    // Create folder for this generation
    const folder = await createFolder(
      drive,
      folder_name || `Week ${new Date().toISOString().slice(0, 10)}`,
      parentFolderId
    )

    // Upload each file to Drive
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
