import { createClient } from '@/lib/supabase/server'
import archiver from 'archiver'
import { PassThrough } from 'stream'

// Vercel timeout: increase for large downloads (2 minutes)
export const maxDuration = 120

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  let body: { fileIds?: string[] }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { fileIds } = body

  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return new Response(JSON.stringify({ error: 'No files selected' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Safety limit
  if (fileIds.length > 50) {
    return new Response(JSON.stringify({ error: 'Maximum 50 files per download' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Get file metadata - only files belonging to this user
  const { data: files, error } = await supabase
    .from('generated_files')
    .select('id, name, file_path, teacher_id')
    .in('id', fileIds)
    .eq('teacher_id', user.id)

  if (error) {
    console.error('Database error fetching files:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch files' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!files || files.length === 0) {
    return new Response(JSON.stringify({ error: 'No files found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Create streaming archive
  const archive = archiver('zip', {
    zlib: { level: 6 } // Balanced compression
  })
  const passthrough = new PassThrough()

  // Error handling
  archive.on('error', (err) => {
    console.error('Archive error:', err)
    passthrough.destroy(err)
  })

  archive.on('warning', (err) => {
    if (err.code !== 'ENOENT') {
      console.warn('Archive warning:', err)
    }
  })

  // Pipe to passthrough
  archive.pipe(passthrough)

  // Add files asynchronously (IIFE to avoid blocking response)
  ;(async () => {
    const seenNames = new Map<string, number>()

    for (const file of files) {
      try {
        const { data, error: downloadError } = await supabase.storage
          .from('generated-files')
          .download(file.file_path)

        if (downloadError || !data) {
          console.warn(`Skipping file ${file.id}: ${downloadError?.message || 'No data returned'}`)
          continue
        }

        // Handle duplicate names with numeric suffix
        let zipName = file.name
        const count = seenNames.get(file.name) || 0
        if (count > 0) {
          const lastDotIndex = file.name.lastIndexOf('.')
          if (lastDotIndex > 0) {
            const base = file.name.slice(0, lastDotIndex)
            const ext = file.name.slice(lastDotIndex + 1)
            zipName = `${base}_${count}.${ext}`
          } else {
            zipName = `${file.name}_${count}`
          }
        }
        seenNames.set(file.name, count + 1)

        const buffer = Buffer.from(await data.arrayBuffer())
        archive.append(buffer, { name: zipName })
      } catch (err) {
        console.warn(`Error processing file ${file.id}:`, err)
      }
    }

    await archive.finalize()
  })()

  const date = new Date().toISOString().split('T')[0]

  return new Response(passthrough as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="lesson-plans-${date}.zip"`,
    },
  })
}
