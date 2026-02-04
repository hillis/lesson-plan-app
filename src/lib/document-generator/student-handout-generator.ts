/**
 * Student Handout Generator
 *
 * Generates a Canva-quality student handout document.
 * Uses shared styles and components for consistency and maintainability.
 */

import {
  Document,
  Paragraph,
  Table,
} from 'docx'
import type { StudentHandout } from '@/types/lesson'
import {
  COLORS,
  FONT_SIZES,
  STUDENT_WIDTHS,
  getDocumentStyles,
  getNumberingConfig,
  PAGE_MARGINS,
} from './handout-styles'
import {
  bodyText,
  sectionHeader,
  contentBox,
  noteBox,
  simpleNumberedList,
  simpleBulletList,
  vocabTable,
  questionBlock,
  writingLines,
  studentHeaderBanner,
} from './handout-components'

const NUMBERING_REF = 'student-bullet-list'

/**
 * Generates a Canva-quality student handout document
 */
export async function generateStudentHandout(
  handout: StudentHandout,
  weekNumber: number
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = []

  // === HEADER BANNER ===
  children.push(studentHeaderBanner(handout.title, handout.subtitle))
  children.push(new Paragraph({}))

  // === INSTRUCTIONS BOX ===
  if (handout.instructions) {
    children.push(
      contentBox(
        [new Paragraph({ children: [bodyText(handout.instructions)] })],
        { width: STUDENT_WIDTHS.PAGE, bgColor: COLORS.LIGHT_BLUE }
      )
    )
    children.push(new Paragraph({}))
  }

  // === MAIN CONTENT SECTIONS ===
  for (const section of handout.sections || []) {
    children.push(sectionHeader(section.heading || 'Content'))

    // Content text
    if (section.content) {
      children.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [bodyText(section.content)],
        })
      )
    }

    // Items (numbered or bulleted)
    if (section.items && section.items.length > 0) {
      if (section.numbered) {
        // Simple numbered items
        children.push(...simpleNumberedList(section.items))
      } else {
        // Simple bulleted items
        children.push(...simpleBulletList(section.items))
      }
    }

    // Blank lines for writing
    if (section.blank_lines && section.blank_lines > 0) {
      children.push(new Paragraph({}))
      children.push(...writingLines(section.blank_lines))
    }

    children.push(new Paragraph({}))
  }

  // === QUESTIONS SECTION ===
  if (handout.questions && handout.questions.length > 0) {
    children.push(sectionHeader('Questions'))

    for (let i = 0; i < handout.questions.length; i++) {
      children.push(...questionBlock(handout.questions[i], i))
    }
    children.push(new Paragraph({}))
  }

  // === VOCABULARY SECTION ===
  if (handout.vocabulary && Object.keys(handout.vocabulary).length > 0) {
    children.push(sectionHeader('Vocabulary'))

    const vocabItems = Object.entries(handout.vocabulary).map(([term, definition]) => ({
      term,
      definition,
    }))

    children.push(vocabTable(vocabItems))
    children.push(new Paragraph({}))
  }

  // === TIPS/NOTES SECTION ===
  if (handout.tips && handout.tips.length > 0) {
    children.push(sectionHeader('Tips & Notes'))

    const tipParagraphs = simpleBulletList(handout.tips, { size: FONT_SIZES.BODY_SMALL })

    children.push(noteBox(tipParagraphs, { width: STUDENT_WIDTHS.PAGE }))
  }

  // Create the document
  const doc = new Document({
    numbering: getNumberingConfig(NUMBERING_REF),
    styles: getDocumentStyles(),
    sections: [
      {
        properties: {
          page: {
            margin: PAGE_MARGINS.student,
          },
        },
        children,
      },
    ],
  })

  // Convert to buffer
  const { Packer } = await import('docx')
  return await Packer.toBuffer(doc)
}

/**
 * Generate filename for student handout
 */
export function getStudentHandoutFilename(handout: StudentHandout): string {
  const nameSlug = (handout.name || 'Handout')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 25)
  return `${nameSlug}_StudentHandout.docx`
}
