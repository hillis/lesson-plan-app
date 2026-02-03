/**
 * CTE Template Filler
 *
 * Fills the CTE lesson plan template by directly manipulating the DOCX XML,
 * matching the approach used by the Python CTE skill.
 *
 * The CTE template is an 18-row table with specific cells for each field.
 * This module reads the template, finds the table, and fills in the cells
 * by row/column index.
 */

import JSZip from 'jszip'
import type { LessonPlanInput, DayPlan, ScheduleItem } from '@/types/lesson'

// Checkbox mappings matching the Python skill exactly
const MATERIALS_CHECKBOXES: Record<string, string> = {
  textbook: 'Textbook',
  lab_manual: 'Lab Manual',
  video_dvd: 'Video/DVD',
  labs: 'Labs',
  posters: 'Posters',
  speaker: 'Speaker',
  projector: 'Projector',
  computer: 'Computer',
  supplemental_materials: 'Supplemental Materials',
  student_journals: 'Student Journals',
  other_equipment: 'Other Equipment',
}

const METHODS_CHECKBOXES: Record<string, string> = {
  discussion: 'Discussion',
  demonstration: 'Demonstration',
  lecture: 'Lecture',
  powerpoint: 'Power Point',
  multimedia: 'Multi-Media',
  guest_speaker: 'Guest Speaker',
}

const ASSESSMENT_CHECKBOXES: Record<string, string> = {
  homework: 'Homework',
  classwork: 'Classwork',
  test: 'Test',
  project_based: 'Project-based',
  teamwork: 'Teamwork',
  observation: 'Teacher Observation',
  performance: 'Performance',
  on_task: 'On-Task',
  other: 'Other',
}

const CURRICULUM_CHECKBOXES: Record<string, string> = {
  math: 'Math',
  science: 'Science',
  reading: 'Reading',
  social_studies: 'Social Studies',
  english: 'English',
  government_economics: 'Government/Economics',
  fine_arts: 'Fine Arts',
  foreign_language: 'Foreign Language',
  technology: 'Technology',
}

const OTHER_AREAS_CHECKBOXES: Record<string, string> = {
  safety: 'Safety',
  management_skills: 'Management Skills',
  teamwork: 'Teamwork',
  live_work: 'Live work',
  higher_order_reasoning: 'Higher Order Reasoning',
  varied_learning: 'Varied Learning',
  work_ethics: 'Work Ethics',
  integrated_academics: 'Integrated Academics',
  ctso: 'CTSO',
  problem_solving: 'Problem Solving',
}

/**
 * Build procedures text from schedule array
 */
function buildProceduresText(schedule: ScheduleItem[]): string {
  if (!schedule || schedule.length === 0) return ''

  return schedule
    .map((item) => {
      const time = item.time || ''
      const name = item.name || ''
      const desc = item.description || ''
      if (time && name) {
        return desc ? `${time} - ${name}: ${desc}` : `${time} - ${name}`
      }
      return name ? (desc ? `${name}: ${desc}` : name) : ''
    })
    .filter(Boolean)
    .join('\n')
}

/**
 * Build differentiation text from differentiation object
 */
function buildDifferentiationText(diff: {
  Advanced: string
  Struggling: string
  ELL: string
}): string {
  const lines: string[] = []
  if (diff.Advanced) lines.push(`Advanced Learners: ${diff.Advanced}`)
  if (diff.Struggling) lines.push(`Struggling Learners: ${diff.Struggling}`)
  if (diff.ELL) lines.push(`ELL Students: ${diff.ELL}`)
  return lines.join('\n')
}

/**
 * Build overview text from lesson data if not provided
 */
function buildOverviewText(day: DayPlan): string {
  if (day.overview) return day.overview

  const parts: string[] = [`Students will learn about ${day.topic}.`]

  if (day.objectives && day.objectives.length > 0) {
    const cleanObj = day.objectives[0]
      .toLowerCase()
      .replace(/^students will /i, '')
      .replace(/^to /i, '')
    parts.push(`The primary objective is to ${cleanObj}.`)
  }

  return parts.join(' ')
}

/**
 * Infer materials from lesson content
 */
function inferMaterials(day: DayPlan): string[] {
  const materials: string[] = []
  const allText = `${day.topic} ${day.overview || ''} ${day.objectives?.join(' ') || ''} ${day.day_materials?.join(' ') || ''} ${day.schedule?.map((s) => `${s.name} ${s.description}`).join(' ') || ''}`.toLowerCase()

  if (/presentation|present|show|display|screen|projector|slides|powerpoint/.test(allText)) {
    materials.push('projector')
  }
  if (/computer|premiere|photoshop|editing|software|digital|laptop/.test(allText)) {
    materials.push('computer')
  }
  if (/video|watch|film|movie|clip|youtube|dvd/.test(allText)) {
    materials.push('video_dvd')
  }
  if (/lab|studio|hands-on|practice|filming|shoot|record/.test(allText)) {
    materials.push('labs')
  }
  if (/audio|sound|music|listen|speaker|playback/.test(allText)) {
    materials.push('speaker')
  }
  if (/handout|worksheet|guide|reference|template|storyboard|script/.test(allText)) {
    materials.push('supplemental_materials')
  }
  if (/camera|tripod|lighting|light|microphone|mic|equipment|gear/.test(allText)) {
    materials.push('other_equipment')
  }
  if (/journal|notebook|notes|reflection/.test(allText)) {
    materials.push('student_journals')
  }
  if (/poster|chart|diagram|visual aid/.test(allText)) {
    materials.push('posters')
  }

  return materials
}

/**
 * Infer instructional methods from lesson content
 */
function inferMethods(day: DayPlan): string[] {
  const methods: string[] = []
  const allText = `${day.topic} ${day.overview || ''} ${day.objectives?.join(' ') || ''} ${day.schedule?.map((s) => `${s.name} ${s.description}`).join(' ') || ''}`.toLowerCase()
  const activityNames = day.schedule?.map((s) => s.name.toLowerCase()) || []

  if (/discussion|discuss|debate|share|q&a/.test(allText)) {
    methods.push('discussion')
  }
  if (/demonstrat|show how|model|walk through|tutorial/.test(allText)) {
    methods.push('demonstration')
  }
  if (
    activityNames.some((n) => /direct instruction|lecture|mini-lecture|instruction/.test(n)) ||
    /lecture|direct instruction|teach|explain|present content|introduce/.test(allText)
  ) {
    methods.push('lecture')
  }
  if (/powerpoint|presentation|slides/.test(allText)) {
    methods.push('powerpoint')
  }
  if (/video|multimedia|multi-media|youtube|film|audio|digital/.test(allText)) {
    methods.push('multimedia')
  }
  if (/guest speaker|guest|industry professional|visitor/.test(allText)) {
    methods.push('guest_speaker')
  }

  return methods
}

/**
 * Infer assessment strategies from lesson content
 */
function inferAssessment(day: DayPlan): string[] {
  const assessment: string[] = []
  const allText = `${day.topic} ${day.overview || ''} ${day.objectives?.join(' ') || ''} ${day.schedule?.map((s) => `${s.name} ${s.description}`).join(' ') || ''}`.toLowerCase()

  if (/classwork|class work|activity|practice|exercise|in-class|exit ticket/.test(allText)) {
    assessment.push('classwork')
  }
  if (/observ|monitor|circulate|watch|check in/.test(allText)) {
    assessment.push('observation')
  }
  if (/project|final|deliverable|portfolio|create|produce/.test(allText)) {
    assessment.push('project_based')
  }
  if (/team|group|partner|collaborat|crew|together|peer/.test(allText)) {
    assessment.push('teamwork')
  }
  if (/perform|present|demonstrat|show|pitch/.test(allText)) {
    assessment.push('performance')
  }
  if (/participat|engag|on-task|focused|active/.test(allText)) {
    assessment.push('on_task')
  }
  if (/test|quiz|exam/.test(allText)) {
    assessment.push('test')
  }
  if (/homework|home work|take home|assignment/.test(allText)) {
    assessment.push('homework')
  }

  return assessment
}

/**
 * Infer curriculum areas from lesson content
 */
function inferCurriculumAreas(day: DayPlan): string[] {
  const curriculum: string[] = []
  const allText = `${day.topic} ${day.overview || ''} ${day.objectives?.join(' ') || ''}`.toLowerCase()

  if (/camera|editing|software|premiere|photoshop|computer|digital|video|audio/.test(allText)) {
    curriculum.push('technology')
  }
  if (/script|writing|story|narrative|interview|news/.test(allText)) {
    curriculum.push('english')
  }
  if (/reading|research|article/.test(allText)) {
    curriculum.push('reading')
  }
  if (/composition|visual|design|aesthetic|creative|color|lighting|framing/.test(allText)) {
    curriculum.push('fine_arts')
  }
  if (/exposure|ratio|frame rate|aperture|shutter speed|iso/.test(allText)) {
    curriculum.push('math')
  }
  if (/light|sound wave|physics|optics/.test(allText)) {
    curriculum.push('science')
  }
  if (/history|documentary|social|community|news|psa|public service/.test(allText)) {
    curriculum.push('social_studies')
  }

  return curriculum
}

/**
 * Infer other areas addressed from lesson content
 */
function inferOtherAreas(day: DayPlan, curriculumAreas: string[]): string[] {
  const otherAreas: string[] = []
  const allText = `${day.topic} ${day.overview || ''} ${day.objectives?.join(' ') || ''} ${day.schedule?.map((s) => `${s.name} ${s.description}`).join(' ') || ''}`.toLowerCase()

  if (/safety|equipment|handling|protective|hazard/.test(allText)) {
    otherAreas.push('safety')
  }
  if (/time management|organize|planning|schedule|workflow|deadline/.test(allText)) {
    otherAreas.push('management_skills')
  }
  if (/team|group|collaborat|partner|crew|together/.test(allText)) {
    otherAreas.push('teamwork')
  }
  if (/client|real-world|live production|community partner/.test(allText)) {
    otherAreas.push('live_work')
  }
  if (/analyze|evaluat|create|critiqu|compare|design|develop/.test(allText)) {
    otherAreas.push('higher_order_reasoning')
  }
  if (/visual|hands-on|demonstration|practice/.test(allText) || day.differentiation) {
    otherAreas.push('varied_learning')
  }
  if (/professional|responsibility|deadline|quality|industry standard/.test(allText)) {
    otherAreas.push('work_ethics')
  }
  if (curriculumAreas.length > 0) {
    otherAreas.push('integrated_academics')
  }
  if (/skillsusa|ctso|competition|career development|leadership/.test(allText)) {
    otherAreas.push('ctso')
  }
  if (/problem|solve|troubleshoot|debug|fix|challenge|solution/.test(allText)) {
    otherAreas.push('problem_solving')
  }

  return otherAreas
}

/**
 * Mark checkboxes in XML text by replacing underscores with X
 */
function markCheckboxes(text: string, checkboxMap: Record<string, string>, selected: string[]): string {
  let result = text
  for (const [key, label] of Object.entries(checkboxMap)) {
    if (selected.includes(key)) {
      // Match underscore(s) followed by the label (case-insensitive)
      const pattern = new RegExp(`_+\\s*${escapeRegex(label)}`, 'gi')
      result = result.replace(pattern, `X ${label}`)
    }
  }
  return result
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Set text in a table cell, preserving structure but replacing content.
 * Handles both cells with existing text and empty cells.
 */
function setCellText(cellXml: string, newText: string): string {
  // Remove red color (RGB 255,0,0 or similar red values)
  let result = cellXml.replace(/<w:color[^>]*w:val="FF0000"[^>]*\/>/gi, '')
  result = result.replace(/<w:color[^>]*w:val="C00000"[^>]*\/>/gi, '')
  result = result.replace(/<w:color[^>]*w:val="[A-F0-9]{2}0000"[^>]*\/>/gi, '')

  // Escape the new text for XML
  const escapedText = newText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Check if the cell has any <w:t> text elements (not namespace like w14:)
  const hasTextElements = /<w:t[\s>]/.test(result) || /<w:t\/>/.test(result)

  if (hasTextElements) {
    // Replace existing text elements
    const textPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g
    let firstMatch = true

    result = result.replace(textPattern, (match, content) => {
      if (firstMatch) {
        firstMatch = false
        return `<w:t xml:space="preserve">${escapedText}</w:t>`
      }
      return '<w:t></w:t>'
    })
  } else {
    // Empty cell - need to insert text into existing paragraph
    // Find the first <w:p> element and insert a <w:r><w:t> inside it
    const paragraphPattern = /(<w:p[^>]*>)([\s\S]*?)(<\/w:p>)/
    const match = result.match(paragraphPattern)

    if (match) {
      const newRun = `<w:r><w:t xml:space="preserve">${escapedText}</w:t></w:r>`
      // Insert the run before the closing </w:p> tag
      result = result.replace(paragraphPattern, `$1$2${newRun}$3`)
    }
  }

  return result
}

/**
 * Find and get cells from a table row in the document XML
 */
function getTableCells(documentXml: string): string[][] {
  const rows: string[][] = []
  const rowPattern = /<w:tr[^>]*>([\s\S]*?)<\/w:tr>/g
  let rowMatch

  while ((rowMatch = rowPattern.exec(documentXml)) !== null) {
    const rowXml = rowMatch[0]
    const cells: string[] = []
    const cellPattern = /<w:tc[^>]*>([\s\S]*?)<\/w:tc>/g
    let cellMatch

    while ((cellMatch = cellPattern.exec(rowXml)) !== null) {
      cells.push(cellMatch[0])
    }

    rows.push(cells)
  }

  return rows
}

/**
 * Replace a cell in the document XML
 */
function replaceCell(documentXml: string, rowIndex: number, cellIndex: number, newCellXml: string): string {
  let currentRow = 0
  let result = documentXml

  const rowPattern = /<w:tr[^>]*>[\s\S]*?<\/w:tr>/g
  result = result.replace(rowPattern, (rowMatch) => {
    if (currentRow === rowIndex) {
      let currentCell = 0
      const cellPattern = /<w:tc[^>]*>[\s\S]*?<\/w:tc>/g
      const newRow = rowMatch.replace(cellPattern, (cellMatch) => {
        if (currentCell === cellIndex) {
          currentCell++
          return newCellXml
        }
        currentCell++
        return cellMatch
      })
      currentRow++
      return newRow
    }
    currentRow++
    return rowMatch
  })

  return result
}

/**
 * Fill the CTE template with lesson data
 *
 * @param templateBuffer - The template DOCX file as a Buffer
 * @param lessonPlan - The lesson plan data
 * @param dayIndex - Zero-based index of the day (0-4)
 * @returns Promise<Buffer> - The filled document as a Buffer
 */
export async function fillCTETemplate(
  templateBuffer: Buffer,
  lessonPlan: LessonPlanInput,
  dayIndex: number
): Promise<Buffer> {
  const day = lessonPlan.days[dayIndex]
  if (!day) {
    throw new Error(`Day index ${dayIndex} out of range. Lesson plan has ${lessonPlan.days.length} days.`)
  }

  // Unzip the template
  const zip = await JSZip.loadAsync(templateBuffer)
  const documentXmlFile = zip.file('word/document.xml')

  if (!documentXmlFile) {
    throw new Error('Invalid DOCX file: missing word/document.xml')
  }

  let documentXml = await documentXmlFile.async('string')

  // Build all the content
  const weekNum = lessonPlan.week
  const proceduresText = buildProceduresText(day.schedule)
  const differentiationText = buildDifferentiationText(day.differentiation)
  const overviewText = buildOverviewText(day)
  const materials = inferMaterials(day)
  const methods = inferMethods(day)
  const assessment = inferAssessment(day)
  const curriculumAreas = inferCurriculumAreas(day)
  const otherAreas = inferOtherAreas(day, curriculumAreas)

  // Get table cells
  const cells = getTableCells(documentXml)

  // CTE Template Row/Cell mapping (0-indexed):
  // Row 1: Week (cell 0), Course Title (cell 1)
  // Row 2: Topic (cell 0), Duration (cell 1)
  // Row 5: Content Standards (cell 0)
  // Row 7: Overview (cell 0), Materials checkboxes (cell 1)
  // Row 9: Procedures (cell 0)
  // Row 11: Methods checkboxes (cell 0)
  // Row 13: Assessment checkboxes (cell 0), Differentiation (cell 2)
  // Row 15: Curriculum checkboxes (cell 0), Embedded Credit (cell 2)
  // Row 17: Other Areas checkboxes (cell 0), Lesson Evaluation (cell 2)

  // Fill Row 1: Week and Course Title
  if (cells[1]?.[0]) {
    const newCell = setCellText(cells[1][0], `Week: ${weekNum}`)
    documentXml = replaceCell(documentXml, 1, 0, newCell)
  }
  if (cells[1]?.[1]) {
    const newCell = setCellText(cells[1][1], 'Course Title: Media Foundations')
    documentXml = replaceCell(documentXml, 1, 1, newCell)
  }

  // Fill Row 2: Topic and Duration
  if (cells[2]?.[0]) {
    const newCell = setCellText(cells[2][0], `Topic: ${day.topic}`)
    documentXml = replaceCell(documentXml, 2, 0, newCell)
  }
  if (cells[2]?.[1]) {
    const newCell = setCellText(cells[2][1], 'Estimate duration in minutes: 90')
    documentXml = replaceCell(documentXml, 2, 1, newCell)
  }

  // Fill Row 5: Content Standards
  if (cells[5]?.[0]) {
    const newCell = setCellText(cells[5][0], day.content_standards || '')
    documentXml = replaceCell(documentXml, 5, 0, newCell)
  }

  // Fill Row 7: Overview and Materials
  if (cells[7]?.[0]) {
    const newCell = setCellText(cells[7][0], overviewText)
    documentXml = replaceCell(documentXml, 7, 0, newCell)
  }
  if (cells[7]?.[1]) {
    const newCell = markCheckboxes(cells[7][1], MATERIALS_CHECKBOXES, materials)
    documentXml = replaceCell(documentXml, 7, 1, newCell)
  }

  // Fill Row 9: Procedures
  if (cells[9]?.[0]) {
    const newCell = setCellText(cells[9][0], proceduresText)
    documentXml = replaceCell(documentXml, 9, 0, newCell)
  }

  // Fill Row 11: Methods
  if (cells[11]?.[0]) {
    const newCell = markCheckboxes(cells[11][0], METHODS_CHECKBOXES, methods)
    documentXml = replaceCell(documentXml, 11, 0, newCell)
  }

  // Fill Row 13: Assessment and Differentiation
  if (cells[13]?.[0]) {
    const newCell = markCheckboxes(cells[13][0], ASSESSMENT_CHECKBOXES, assessment)
    documentXml = replaceCell(documentXml, 13, 0, newCell)
  }
  if (cells[13]?.[1]) {
    const newCell = setCellText(cells[13][1], differentiationText)
    documentXml = replaceCell(documentXml, 13, 1, newCell)
  }

  // Fill Row 15: Curriculum and Embedded Credit
  if (cells[15]?.[0]) {
    const newCell = markCheckboxes(cells[15][0], CURRICULUM_CHECKBOXES, curriculumAreas)
    documentXml = replaceCell(documentXml, 15, 0, newCell)
  }
  // Skip embedded credit (cells[15][1]) - usually empty

  // Fill Row 17: Other Areas and Lesson Evaluation
  if (cells[17]?.[0]) {
    const newCell = markCheckboxes(cells[17][0], OTHER_AREAS_CHECKBOXES, otherAreas)
    documentXml = replaceCell(documentXml, 17, 0, newCell)
  }
  // Skip lesson evaluation (cells[17][1]) - usually empty

  // Update the document.xml in the zip
  zip.file('word/document.xml', documentXml)

  // Generate the output buffer
  return Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }))
}
