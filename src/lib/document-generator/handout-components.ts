/**
 * Reusable component builders for Teacher and Student handout generators
 *
 * These functions create common document elements (tables, lists, boxes)
 * that are shared between both handout types.
 */

import {
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  ShadingType,
  HeightRule,
  TableLayoutType,
  VerticalAlign,
} from 'docx'
import {
  COLORS,
  BORDERS,
  TABLE_MARGINS,
  FONT_SIZES,
  TEACHER_WIDTHS,
  STUDENT_WIDTHS,
} from './handout-styles'
import { BorderStyle, convertInchesToTwip } from 'docx'

// ============================================================================
// Text Helpers
// ============================================================================

/**
 * Creates a TextRun with standard body styling
 */
export function bodyText(text: string, options?: { bold?: boolean; size?: number }): TextRun {
  return new TextRun({
    text,
    size: options?.size ?? FONT_SIZES.BODY,
    color: COLORS.DARK_GRAY,
    font: 'Arial',
    bold: options?.bold,
  })
}

/**
 * Creates a TextRun with navy blue heading styling
 */
export function headingText(
  text: string,
  options?: { size?: number; bold?: boolean }
): TextRun {
  return new TextRun({
    text,
    size: options?.size ?? FONT_SIZES.HEADING_1,
    color: COLORS.NAVY_BLUE,
    font: 'Arial',
    bold: options?.bold ?? true,
  })
}

/**
 * Creates a TextRun with white text (for dark backgrounds)
 */
export function whiteText(
  text: string,
  options?: { size?: number; bold?: boolean }
): TextRun {
  return new TextRun({
    text,
    size: options?.size ?? FONT_SIZES.BODY,
    color: COLORS.WHITE,
    font: 'Arial',
    bold: options?.bold,
  })
}

// ============================================================================
// Section Headers
// ============================================================================

/**
 * Creates a section header with navy bottom border (matches Python CTE skill)
 * Used in both teacher and student handouts
 */
export function sectionHeader(
  text: string,
  options?: {
    level?: 1 | 2
  }
): Paragraph {
  const level = options?.level ?? 1
  const fontSize = level === 1 ? FONT_SIZES.HEADING_1 : FONT_SIZES.HEADING_2

  return new Paragraph({
    spacing: { before: 200, after: 120 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 12,
        color: COLORS.NAVY_BLUE,
      },
    },
    children: [headingText(text, { size: fontSize })],
  })
}

// ============================================================================
// Content Boxes
// ============================================================================

/**
 * Creates a colored content box with paragraphs inside
 * Used for overview, instructions, tips, etc.
 */
export function contentBox(
  paragraphs: Paragraph[],
  options?: {
    bgColor?: string
    width?: number
    hasBorder?: boolean
  }
): Table {
  const width = options?.width ?? TEACHER_WIDTHS.PAGE
  const bgColor = options?.bgColor ?? COLORS.LIGHT_BLUE
  const borders = options?.hasBorder !== false ? BORDERS.thin : BORDERS.none

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [width],
    margins: TABLE_MARGINS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: width, type: WidthType.DXA },
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            borders,
            children: paragraphs,
          }),
        ],
      }),
    ],
  })
}

/**
 * Creates a simple cream yellow note box (matches Python CTE skill)
 */
export function noteBox(
  paragraphs: Paragraph[],
  options?: {
    width?: number
  }
): Table {
  const width = options?.width ?? TEACHER_WIDTHS.PAGE

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [width],
    margins: TABLE_MARGINS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: width, type: WidthType.DXA },
            shading: { fill: COLORS.CREAM_YELLOW, type: ShadingType.CLEAR },
            borders: BORDERS.thin,
            children: paragraphs,
          }),
        ],
      }),
    ],
  })
}

// ============================================================================
// Simple Lists (matches Python CTE skill)
// ============================================================================

/**
 * Creates a simple numbered list (1. 2. 3. format)
 */
export function simpleNumberedList(
  items: string[],
  options?: { indent?: number; size?: number }
): Paragraph[] {
  const indent = options?.indent ?? 360
  const size = options?.size ?? FONT_SIZES.BODY

  return items.map(
    (item, idx) =>
      new Paragraph({
        indent: { left: indent, hanging: 360 },
        spacing: { after: 80 },
        children: [bodyText(`${idx + 1}. ${item}`, { size })],
      })
  )
}

/**
 * Creates a simple bullet list (• format)
 */
export function simpleBulletList(
  items: string[],
  options?: { indent?: number; size?: number }
): Paragraph[] {
  const indent = options?.indent ?? 360
  const size = options?.size ?? FONT_SIZES.BODY

  return items.map(
    (item) =>
      new Paragraph({
        indent: { left: indent, hanging: 180 },
        spacing: { after: 60 },
        children: [bodyText(`• ${item}`, { size })],
      })
  )
}

/**
 * Creates inline vocabulary (term - definition; term - definition format)
 */
export function inlineVocabulary(
  items: Array<{ term: string; definition: string }>
): Paragraph {
  const textRuns: TextRun[] = []

  items.forEach((item, idx) => {
    if (idx > 0) {
      textRuns.push(
        new TextRun({
          text: '; ',
          color: COLORS.MEDIUM_GRAY,
          font: 'Arial',
          size: FONT_SIZES.BODY_SMALL,
        })
      )
    }
    textRuns.push(
      new TextRun({
        text: item.term,
        bold: true,
        color: COLORS.NAVY_BLUE,
        font: 'Arial',
        size: FONT_SIZES.BODY_SMALL,
      })
    )
    textRuns.push(
      new TextRun({
        text: ` - ${item.definition}`,
        color: COLORS.DARK_GRAY,
        font: 'Arial',
        size: FONT_SIZES.BODY_SMALL,
      })
    )
  })

  return new Paragraph({
    spacing: { after: 120 },
    children: textRuns,
  })
}

/**
 * Creates a two-column vocabulary table for student handouts
 */
export function vocabTable(
  items: Array<{ term: string; definition: string }>
): Table {
  const termWidth = STUDENT_WIDTHS.VOCAB_TERM
  const defWidth = STUDENT_WIDTHS.VOCAB_DEF

  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: termWidth, type: WidthType.DXA },
        shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
        borders: BORDERS.thin,
        children: [
          new Paragraph({
            children: [whiteText('Term', { bold: true })],
          }),
        ],
      }),
      new TableCell({
        width: { size: defWidth, type: WidthType.DXA },
        shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
        borders: BORDERS.thin,
        children: [
          new Paragraph({
            children: [whiteText('Definition', { bold: true })],
          }),
        ],
      }),
    ],
  })

  const dataRows = items.map(
    (item, idx) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: termWidth, type: WidthType.DXA },
            shading: {
              fill: idx % 2 === 1 ? COLORS.LIGHT_GRAY : COLORS.WHITE,
              type: ShadingType.CLEAR,
            },
            borders: BORDERS.thin,
            children: [
              new Paragraph({
                children: [headingText(item.term, { size: FONT_SIZES.BODY_SMALL })],
              }),
            ],
          }),
          new TableCell({
            width: { size: defWidth, type: WidthType.DXA },
            shading: {
              fill: idx % 2 === 1 ? COLORS.LIGHT_GRAY : COLORS.WHITE,
              type: ShadingType.CLEAR,
            },
            borders: BORDERS.thin,
            children: [
              new Paragraph({
                children: [bodyText(item.definition, { size: FONT_SIZES.BODY_SMALL })],
              }),
            ],
          }),
        ],
      })
  )

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [termWidth, defWidth],
    margins: TABLE_MARGINS,
    rows: [headerRow, ...dataRows],
  })
}

/**
 * Creates inline differentiation text with bold labels
 */
export function inlineDifferentiation(
  differentiation: { Advanced?: string; Struggling?: string; ELL?: string }
): Paragraph {
  const textRuns: TextRun[] = []
  const items = [
    { label: 'Advanced', value: differentiation.Advanced },
    { label: 'Struggling', value: differentiation.Struggling },
    { label: 'ELL', value: differentiation.ELL },
  ].filter(item => item.value)

  items.forEach((item, idx) => {
    if (idx > 0) {
      textRuns.push(
        new TextRun({
          text: ' | ',
          color: COLORS.MEDIUM_GRAY,
          font: 'Arial',
          size: FONT_SIZES.BODY_SMALL,
        })
      )
    }
    textRuns.push(
      new TextRun({
        text: `${item.label}: `,
        bold: true,
        color: COLORS.NAVY_BLUE,
        font: 'Arial',
        size: FONT_SIZES.BODY_SMALL,
      })
    )
    textRuns.push(
      new TextRun({
        text: item.value || '',
        color: COLORS.DARK_GRAY,
        font: 'Arial',
        size: FONT_SIZES.BODY_SMALL,
      })
    )
  })

  return new Paragraph({
    spacing: { after: 120 },
    children: textRuns,
  })
}

// ============================================================================
// Card Grids
// ============================================================================

/**
 * Creates a two-column card grid for vocabulary or materials
 */
export function cardGrid(
  items: Array<{ term: string; definition: string }>,
  options?: {
    cardWidth?: number
    alternateColors?: boolean
    color1?: string
    color2?: string
  }
): Table {
  const cardWidth = options?.cardWidth ?? convertInchesToTwip(3.25)
  const alternateColors = options?.alternateColors ?? true
  const color1 = options?.color1 ?? COLORS.LIGHT_BLUE
  const color2 = options?.color2 ?? COLORS.LIGHT_GRAY

  const rows: TableRow[] = []

  for (let i = 0; i < items.length; i += 2) {
    const rowCells: TableCell[] = []

    for (let j = 0; j < 2; j++) {
      if (i + j < items.length) {
        const { term, definition } = items[i + j]
        const cardBg = alternateColors && Math.floor(i / 2) % 2 === 1 ? color2 : color1

        rowCells.push(
          new TableCell({
            width: { size: cardWidth, type: WidthType.DXA },
            shading: { fill: cardBg, type: ShadingType.CLEAR },
            borders: BORDERS.thin,
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [headingText(term, { size: FONT_SIZES.BODY })],
              }),
              new Paragraph({
                children: [bodyText(definition, { size: FONT_SIZES.BODY_SMALL })],
              }),
            ],
          })
        )
      } else {
        rowCells.push(
          new TableCell({
            width: { size: cardWidth, type: WidthType.DXA },
            borders: BORDERS.none,
            children: [new Paragraph({})],
          })
        )
      }
    }

    rows.push(new TableRow({ children: rowCells }))
  }

  const colWidth = cardWidth + 200 // slight gap
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [colWidth, colWidth],
    margins: TABLE_MARGINS,
    rows,
  })
}


// ============================================================================
// Three-Column Cards (Differentiation, Assessment)
// ============================================================================

/**
 * Creates a three-column card row for assessment or differentiation
 */
export function threeColumnCards(
  cards: Array<{ label: string; content: string; color: string }>
): Table {
  const colWidth = TEACHER_WIDTHS.THIRD_COL

  const cells = cards.map(({ label, content, color }) =>
    new TableCell({
      width: { size: colWidth, type: WidthType.DXA },
      shading: { fill: color, type: ShadingType.CLEAR },
      borders: BORDERS.thin,
      children: [
        new Paragraph({
          spacing: { after: 80 },
          children: [headingText(label, { size: FONT_SIZES.BODY_SMALL })],
        }),
        new Paragraph({
          children: [bodyText(content || 'N/A', { size: FONT_SIZES.CAPTION })],
        }),
      ],
    })
  )

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [colWidth, colWidth, colWidth],
    margins: TABLE_MARGINS,
    rows: [new TableRow({ children: cells })],
  })
}

// ============================================================================
// Schedule Table (Teacher)
// ============================================================================

export interface ScheduleItem {
  time: string
  name: string
  description: string
}

/**
 * Creates a schedule table with time, activity, and description columns
 */
export function scheduleTable(items: ScheduleItem[]): Table {
  const timeWidth = TEACHER_WIDTHS.SCHEDULE_TIME
  const activityWidth = TEACHER_WIDTHS.SCHEDULE_ACTIVITY
  const descWidth = TEACHER_WIDTHS.SCHEDULE_DESC

  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: timeWidth, type: WidthType.DXA },
        shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
        borders: BORDERS.thin,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [whiteText('Time', { bold: true })],
          }),
        ],
      }),
      new TableCell({
        width: { size: activityWidth, type: WidthType.DXA },
        shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
        borders: BORDERS.thin,
        children: [
          new Paragraph({
            children: [whiteText('Activity', { bold: true })],
          }),
        ],
      }),
      new TableCell({
        width: { size: descWidth, type: WidthType.DXA },
        shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
        borders: BORDERS.thin,
        children: [
          new Paragraph({
            children: [whiteText('Description', { bold: true })],
          }),
        ],
      }),
    ],
  })

  const dataRows = items.map(
    (item, idx) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: timeWidth, type: WidthType.DXA },
            shading: { fill: COLORS.LIGHT_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.thin,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [headingText(item.time, { size: FONT_SIZES.BODY_SMALL })],
              }),
            ],
          }),
          new TableCell({
            width: { size: activityWidth, type: WidthType.DXA },
            shading: {
              fill: idx % 2 === 1 ? COLORS.LIGHT_GRAY : COLORS.WHITE,
              type: ShadingType.CLEAR,
            },
            borders: BORDERS.thin,
            children: [
              new Paragraph({
                children: [bodyText(item.name, { bold: true, size: FONT_SIZES.BODY_SMALL })],
              }),
            ],
          }),
          new TableCell({
            width: { size: descWidth, type: WidthType.DXA },
            shading: {
              fill: idx % 2 === 1 ? COLORS.LIGHT_GRAY : COLORS.WHITE,
              type: ShadingType.CLEAR,
            },
            borders: BORDERS.thin,
            children: [
              new Paragraph({
                children: [bodyText(item.description, { size: FONT_SIZES.BODY_SMALL })],
              }),
            ],
          }),
        ],
      })
  )

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [timeWidth, activityWidth, descWidth],
    margins: TABLE_MARGINS,
    rows: [headerRow, ...dataRows],
  })
}

// ============================================================================
// Question Block (Student)
// ============================================================================

/**
 * Creates a simple question with numbered format and answer line
 */
export function questionBlock(
  question: string,
  index: number,
  options?: {
    answerLines?: number
  }
): Paragraph[] {
  const answerLines = options?.answerLines ?? 2

  const paragraphs: Paragraph[] = [
    // Question with number
    new Paragraph({
      spacing: { before: 160, after: 120 },
      children: [
        new TextRun({
          text: `${index + 1}. `,
          bold: true,
          color: COLORS.NAVY_BLUE,
          font: 'Arial',
          size: FONT_SIZES.BODY,
        }),
        bodyText(question),
      ],
    }),
  ]

  // Answer lines
  for (let i = 0; i < answerLines; i++) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 160 },
        indent: { left: 360 },
        children: [
          new TextRun({
            text: '_'.repeat(85),
            color: COLORS.LINE_GRAY,
            font: 'Arial',
          }),
        ],
      })
    )
  }

  return paragraphs
}

// ============================================================================
// Writing Lines (Student)
// ============================================================================

/**
 * Creates blank writing lines for student responses
 */
export function writingLines(count: number): Paragraph[] {
  return Array(count)
    .fill(null)
    .map(
      () =>
        new Paragraph({
          spacing: { after: 280 },
          children: [
            new TextRun({
              text: '_'.repeat(85),
              color: COLORS.LINE_GRAY,
              font: 'Arial',
            }),
          ],
        })
    )
}

// ============================================================================
// Header Banners
// ============================================================================

/**
 * Creates a teacher handout header banner (single navy box - matches Python CTE skill)
 */
export function teacherHeaderBanner(
  weekNumber: number,
  unit: string
): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [TEACHER_WIDTHS.PAGE],
    margins: TABLE_MARGINS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.none,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
                children: [
                  whiteText(`WEEK ${weekNumber}: `, { bold: true, size: FONT_SIZES.TITLE }),
                  whiteText(unit.toUpperCase(), { bold: true, size: FONT_SIZES.TITLE }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

/**
 * Creates a student handout header banner
 */
export function studentHeaderBanner(
  title: string,
  subtitle?: string
): Table {
  const contentParagraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: subtitle ? 80 : 200 },
      children: [whiteText(title || 'Student Handout', { bold: true, size: FONT_SIZES.STUDENT_TITLE })],
    }),
  ]

  if (subtitle) {
    contentParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: subtitle,
            size: FONT_SIZES.BODY,
            color: COLORS.LIGHT_BLUE,
            font: 'Arial',
          }),
        ],
      })
    )
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [STUDENT_WIDTHS.PAGE],
    margins: TABLE_MARGINS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.none,
            children: contentParagraphs,
          }),
        ],
      }),
    ],
  })
}

/**
 * Creates a day header banner for teacher handout
 */
export function dayHeaderBanner(
  dayNumber: number,
  dayName: string,
  topic: string
): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [TEACHER_WIDTHS.DAY_TAB, TEACHER_WIDTHS.DAY_TOPIC],
    margins: TABLE_MARGINS,
    rows: [
      new TableRow({
        children: [
          // Navy "DAY X" tab
          new TableCell({
            width: { size: TEACHER_WIDTHS.DAY_TAB, type: WidthType.DXA },
            shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.thin,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 120 },
                children: [whiteText(`DAY ${dayNumber}`, { bold: true, size: FONT_SIZES.DAY_NUMBER })],
              }),
            ],
          }),
          // Light blue "DayName: Topic"
          new TableCell({
            width: { size: TEACHER_WIDTHS.DAY_TOPIC, type: WidthType.DXA },
            shading: { fill: COLORS.LIGHT_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.thin,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { before: 120, after: 120 },
                children: [
                  headingText(`${dayName}: `, { size: FONT_SIZES.DAY_HEADER }),
                  headingText(topic || 'Untitled', { size: FONT_SIZES.DAY_HEADER, bold: false }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
