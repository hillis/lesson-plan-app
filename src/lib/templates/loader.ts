import { SupabaseClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import * as path from 'path'

const DEFAULT_TEMPLATE_ID = 'default-cte'

/**
 * Load a template file from Supabase Storage or the default location.
 * For the default CTE template, loads from public/templates/.
 * For user templates, fetches from Supabase Storage.
 *
 * @param supabase - Authenticated Supabase client
 * @param templateId - Template identifier ('default-cte' or a UUID)
 * @returns Promise<Buffer> - The template file as a Buffer
 */
export async function loadTemplate(
  supabase: SupabaseClient,
  templateId: string
): Promise<Buffer> {
  // Default CTE template - load from public/templates/
  if (templateId === DEFAULT_TEMPLATE_ID) {
    return loadDefaultTemplate()
  }

  // User template - load from Supabase Storage
  try {
    // Get template metadata to find file_path
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('file_path')
      .eq('id', templateId)
      .single()

    if (fetchError || !template?.file_path) {
      console.warn(`Template ${templateId} not found, using default`)
      return loadDefaultTemplate()
    }

    // Download from storage
    const { data, error: downloadError } = await supabase.storage
      .from('templates')
      .download(template.file_path)

    if (downloadError || !data) {
      console.warn(`Failed to download template ${templateId}:`, downloadError)
      return loadDefaultTemplate()
    }

    return Buffer.from(await data.arrayBuffer())
  } catch (error) {
    console.error('Template load error:', error)
    return loadDefaultTemplate()
  }
}

/**
 * Load the default CTE lesson plan template from the filesystem.
 * In Next.js API routes, public/ files are accessible via process.cwd().
 *
 * @returns Buffer - The default template file
 * @throws Error if the default template file is not found
 */
async function loadDefaultTemplate(): Promise<Buffer> {
  const templatePath = path.join(
    process.cwd(),
    'public',
    'templates',
    'cte-lesson-plan.docx'
  )

  try {
    return await readFile(templatePath)
  } catch {
    throw new Error(
      `Default template not found at ${templatePath}. Please ensure cte-lesson-plan.docx exists in public/templates/`
    )
  }
}

export { DEFAULT_TEMPLATE_ID }
