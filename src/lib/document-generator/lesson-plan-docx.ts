import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Packer,
} from 'docx'
import type { DayPlan } from '@/types/lesson'

export async function generateLessonPlanDocx(
  day: DayPlan,
  weekNumber: number,
  dayNumber: number,
  unit: string
): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: 'CTE LESSON PLAN',
                bold: true,
                size: 28,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),

          // Info table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph(`Unit: ${unit}`)],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph(`Week ${weekNumber}, Day ${dayNumber}`)],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph(`Topic: ${day.topic}`)],
                    columnSpan: 2,
                  }),
                ],
              }),
            ],
          }),

          // Objectives
          new Paragraph({
            text: 'Learning Objectives:',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          ...day.objectives.map(
            (obj) =>
              new Paragraph({
                text: `• ${obj}`,
                spacing: { after: 50 },
              })
          ),

          // Schedule
          new Paragraph({
            text: 'Procedures/Activities:',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          ...day.schedule.map(
            (item) =>
              new Paragraph({
                text: `${item.time} - ${item.name}: ${item.description}`,
                spacing: { after: 50 },
              })
          ),

          // Differentiation
          new Paragraph({
            text: 'Provision for Individual Differences:',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({ text: `Advanced Learners: ${day.differentiation.Advanced}` }),
          new Paragraph({ text: `Struggling Learners: ${day.differentiation.Struggling}` }),
          new Paragraph({ text: `ELL Students: ${day.differentiation.ELL}` }),

          // Standards
          new Paragraph({
            text: 'Content Standards:',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({ text: day.content_standards }),
        ],
      },
    ],
  })

  return await Packer.toBuffer(doc)
}
