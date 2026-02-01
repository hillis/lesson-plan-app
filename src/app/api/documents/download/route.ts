import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { convertDocxToPdf } from 'docx-pdf-converter'

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const format = searchParams.get('format') || 'original'

  if (!id) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
  }

  // Get document metadata
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('file_path, name, mime_type, teacher_id')
    .eq('id', id)
    .single()

  if (docError || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Security check: verify document belongs to authenticated user
  if (doc.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Handle PDF conversion for DOCX files
  if (format === 'pdf') {
    // Only DOCX files can be converted to PDF
    if (doc.mime_type !== DOCX_MIME_TYPE) {
      return NextResponse.json(
        { error: 'Only DOCX files can be converted to PDF' },
        { status: 400 }
      )
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.file_path)

    if (downloadError || !fileData) {
      // Check for "Object not found" error indicating missing storage file
      if (downloadError?.message.includes('Object not found') || downloadError?.message.includes('not found')) {
        console.warn(`Document ${id} missing from storage: ${doc.file_path}`)
        return NextResponse.json({ error: 'File not available' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 })
    }

    try {
      // Convert DOCX buffer to PDF
      const buffer = Buffer.from(await fileData.arrayBuffer())
      const result = await convertDocxToPdf(buffer, doc.name)

      // Generate PDF filename (replace .docx with .pdf)
      const pdfFilename = doc.name.replace(/\.docx$/i, '.pdf')

      // Return PDF directly as response (convert Buffer to Uint8Array for Response)
      return new Response(new Uint8Array(result.buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${pdfFilename}"`,
        },
      })
    } catch (conversionError) {
      console.error('DOCX to PDF conversion error:', conversionError)
      return NextResponse.json(
        { error: 'Failed to convert document to PDF' },
        { status: 500 }
      )
    }
  }

  // Original format: return signed URL
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.file_path, 3600, {
      download: doc.name // Triggers browser download with original filename
    })

  if (error) {
    // Check for "Object not found" error indicating missing storage file
    if (error.message.includes('Object not found') || error.message.includes('not found')) {
      console.warn(`Document ${id} missing from storage: ${doc.file_path}`)
      return NextResponse.json({ error: 'File not available' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    filename: doc.name,
    mimeType: doc.mime_type
  })
}
