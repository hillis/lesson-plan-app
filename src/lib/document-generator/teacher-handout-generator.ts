/**
 * Teacher Handout Generator
 *
 * Generates a Canva-quality teacher handout document for the entire week.
 * Uses shared styles and components for consistency and maintainability.
 */

import {
  Document,
  Paragraph,
  Table,
  TextRun,
  PageBreak,
} from 'docx'
import type { LessonPlanInput } from '@/types/lesson'
import {
  COLORS,
  FONT_SIZES,
  TEACHER_WIDTHS,
  getDocumentStyles,
  getNumberingConfig,
  PAGE_MARGINS,
} from './handout-styles'
import {
  bodyText,
  headingText,
  sectionHeader,
  contentBox,
  noteBox,
  numberedBadgeList,
  cardGrid,
  checklistGrid,
  threeColumnCards,
  scheduleTable,
  teacherHeaderBanner,
  dayHeaderBanner,
} from './handout-components'

const NUMBERING_REF = 'teacher-bullet-list'
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

/**
 * Generates a Canva-quality teacher handout document for the entire week
 */
export async function generateTeacherHandout(
  lessonPlan: LessonPlanInput,
  weekNumber: number
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = []

  // === HEADER BANNER ===
  children.push(teacherHeaderBanner(weekNumber, lessonPlan.unit))
  children.push(new Paragraph({}))

  // === WEEK OVERVIEW BOX ===
  if (lessonPlan.week_overview || lessonPlan.week_focus) {
    children.push(sectionHeader('Week Overview'))

    const overviewParagraphs: Paragraph[] = []

    if (lessonPlan.week_focus) {
      overviewParagraphs.push(
        new Paragraph({
          spacing: { after: 160 },
          children: [
            headingText('Focus: ', { size: FONT_SIZES.BADGE }),
            bodyText(lessonPlan.week_focus),
          ],
        })
      )
    }

    if (lessonPlan.week_overview) {
      overviewParagraphs.push(
        new Paragraph({
          children: [bodyText(lessonPlan.week_overview)],
        })
      )
    }

    children.push(contentBox(overviewParagraphs, { width: TEACHER_WIDTHS.PAGE }))
    children.push(new Paragraph({}))
  }

  // === WEEKLY LEARNING OBJECTIVES ===
  if (lessonPlan.week_objectives && lessonPlan.week_objectives.length > 0) {
    children.push(sectionHeader('Weekly Learning Objectives'))
    children.push(numberedBadgeList(lessonPlan.week_objectives))
    children.push(new Paragraph({}))
  }

  // === MATERIALS NEEDED FOR THE WEEK ===
  if (lessonPlan.week_materials && lessonPlan.week_materials.length > 0) {
    children.push(sectionHeader('Materials Needed for the Week'))
    children.push(checklistGrid(lessonPlan.week_materials))
    children.push(new Paragraph({}))
  }

  // === ASSESSMENT OVERVIEW ===
  if (
    lessonPlan.formative_assessment ||
    lessonPlan.summative_assessment ||
    lessonPlan.weekly_deliverable
  ) {
    children.push(sectionHeader('Assessment Overview'))
    children.push(
      threeColumnCards([
        { label: 'Formative', content: lessonPlan.formative_assessment || '', color: COLORS.LIGHT_BLUE },
        { label: 'Summative', content: lessonPlan.summative_assessment || '', color: COLORS.SOFT_GREEN },
        { label: 'Deliverable', content: lessonPlan.weekly_deliverable || '', color: COLORS.CREAM_YELLOW },
      ])
    )
    children.push(new Paragraph({}))
  }

  // === DAILY SECTIONS ===
  const days = lessonPlan.days || []

  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    const dayName = day.day_label || DAY_NAMES[i] || `Day ${i + 1}`

    // Page break before each day (except first)
    if (i > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }))
    }

    // Day header banner
    children.push(dayHeaderBanner(i + 1, dayName, day.topic))
    children.push(new Paragraph({}))

    // Learning Objectives
    if (day.objectives && day.objectives.length > 0) {
      children.push(sectionHeader('Learning Objectives', { level: 2 }))

      const objParagraphs = day.objectives.map(
        (obj, idx) =>
          new Paragraph({
            numbering: { reference: NUMBERING_REF, level: 0 },
            spacing: idx === 0 ? {} : { before: 40 },
            children: [bodyText(obj, { size: FONT_SIZES.BODY_SMALL })],
          })
      )

      children.push(contentBox(objParagraphs, { width: TEACHER_WIDTHS.PAGE }))
    }

    // Materials
    if (day.day_materials && day.day_materials.length > 0) {
      children.push(sectionHeader('Materials', { level: 2 }))
      children.push(
        new Paragraph({
          children: day.day_materials.flatMap((mat, idx) => {
            const parts: TextRun[] = []
            if (idx > 0) {
              parts.push(
                new TextRun({
                  text: '  |  ',
                  color: COLORS.MEDIUM_GRAY,
                  font: 'Arial',
                })
              )
            }
            parts.push(bodyText(mat))
            return parts
          }),
        })
      )
    }

    // Schedule
    if (day.schedule && day.schedule.length > 0) {
      children.push(sectionHeader('Schedule', { level: 2 }))
      children.push(scheduleTable(day.schedule))
    }

    // Vocabulary
    if (day.vocabulary && Object.keys(day.vocabulary).length > 0) {
      children.push(sectionHeader('Vocabulary', { level: 2 }))

      const vocabItems = Object.entries(day.vocabulary).map(([term, definition]) => ({
        term,
        definition,
      }))

      children.push(cardGrid(vocabItems))
    }

    // Differentiation
    if (day.differentiation) {
      children.push(sectionHeader('Differentiation', { level: 2 }))
      children.push(
        threeColumnCards([
          { label: 'Advanced Learners', content: day.differentiation.Advanced || '', color: COLORS.LIGHT_BLUE },
          { label: 'Struggling Learners', content: day.differentiation.Struggling || '', color: COLORS.CREAM_YELLOW },
          { label: 'ELL Students', content: day.differentiation.ELL || '', color: COLORS.SOFT_GREEN },
        ])
      )
    }

    // Teacher Notes (day level)
    if (day.teacher_notes) {
      children.push(sectionHeader('Teacher Notes', { level: 2 }))
      children.push(
        noteBox([
          new Paragraph({
            children: [bodyText(day.teacher_notes, { size: FONT_SIZES.BODY_SMALL })],
          }),
        ])
      )
    }

    children.push(new Paragraph({}))
  }

  // === WEEK-LEVEL TEACHER NOTES ===
  if (lessonPlan.teacher_notes && lessonPlan.teacher_notes.length > 0) {
    children.push(new Paragraph({ children: [new PageBreak()] }))
    children.push(sectionHeader('Weekly Teacher Notes'))

    const noteParagraphs = lessonPlan.teacher_notes.map(
      (note, idx) =>
        new Paragraph({
          numbering: { reference: NUMBERING_REF, level: 0 },
          spacing: idx === 0 ? {} : { before: 80 },
          children: [bodyText(note, { size: FONT_SIZES.BODY_SMALL })],
        })
    )

    children.push(noteBox(noteParagraphs))
  }

  // Create the document
  const doc = new Document({
    numbering: getNumberingConfig(NUMBERING_REF),
    styles: getDocumentStyles(),
    sections: [
      {
        properties: {
          page: {
            margin: PAGE_MARGINS.teacher,
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
 * Generate filename for teacher handout
 */
export function getTeacherHandoutFilename(lessonPlan: LessonPlanInput, weekNumber: number): string {
  const unitSlug = (lessonPlan.unit || 'Unit')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 30)
  return `Week${weekNumber}_${unitSlug}_TeacherHandout.docx`
}
