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
 * Creates a section header with left accent bar
 * Used in both teacher and student handouts
 */
export function sectionHeader(
  text: string,
  options?: {
    level?: 1 | 2
    accentWidth?: number
    contentWidth?: number
  }
): Table {
  const level = options?.level ?? 1
  const fontSize = level === 1 ? FONT_SIZES.HEADING_1 : FONT_SIZES.HEADING_2
  const spacing = level === 1 ? 80 : 40
  const accentWidth = options?.accentWidth ?? TEACHER_WIDTHS.ACCENT_BAR
  const contentWidth = options?.contentWidth ?? TEACHER_WIDTHS.CONTENT

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [accentWidth, contentWidth],
    margins: TABLE_MARGINS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: accentWidth, type: WidthType.DXA },
            shading: { fill: COLORS.ACCENT_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.none,
            children: [new Paragraph({})],
          }),
          new TableCell({
            width: { size: contentWidth, type: WidthType.DXA },
            borders: BORDERS.none,
            children: [
              new Paragraph({
                spacing: { before: spacing, after: spacing },
                children: [headingText(text, { size: fontSize })],
              }),
            ],
          }),
        ],
      }),
    ],
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
 * Creates a note box with yellow accent bar (teacher notes, tips)
 */
export function noteBox(
  paragraphs: Paragraph[],
  options?: {
    accentWidth?: number
    contentWidth?: number
  }
): Table {
  const accentWidth = options?.accentWidth ?? TEACHER_WIDTHS.NOTE_ACCENT
  const contentWidth = options?.contentWidth ?? TEACHER_WIDTHS.NOTE_CONTENT

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [accentWidth, contentWidth],
    margins: TABLE_MARGINS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: accentWidth, type: WidthType.DXA },
            shading: { fill: COLORS.YELLOW_ACCENT, type: ShadingType.CLEAR },
            borders: BORDERS.none,
            children: [new Paragraph({})],
          }),
          new TableCell({
            width: { size: contentWidth, type: WidthType.DXA },
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
// Numbered Badge Lists
// ============================================================================

/**
 * Creates a numbered list with badge column
 * Used for objectives, questions, numbered items
 */
export function numberedBadgeList(
  items: string[],
  options?: {
    badgeWidth?: number
    contentWidth?: number
    badgeColor?: string
    alternateRows?: boolean
    badgeSize?: number
    textSize?: number
  }
): Table {
  const badgeWidth = options?.badgeWidth ?? TEACHER_WIDTHS.BADGE
  const contentWidth = options?.contentWidth ?? TEACHER_WIDTHS.BADGE_CONTENT
  const badgeColor = options?.badgeColor ?? COLORS.NAVY_BLUE
  const badgeSize = options?.badgeSize ?? FONT_SIZES.BODY
  const textSize = options?.textSize ?? FONT_SIZES.BODY
  const alternateRows = options?.alternateRows ?? false

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [badgeWidth, contentWidth],
    margins: TABLE_MARGINS,
    rows: items.map((item, idx) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: badgeWidth, type: WidthType.DXA },
            shading: { fill: badgeColor, type: ShadingType.CLEAR },
            borders: BORDERS.thin,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [whiteText(String(idx + 1), { bold: true, size: badgeSize })],
              }),
            ],
          }),
          new TableCell({
            width: { size: contentWidth, type: WidthType.DXA },
            shading: {
              fill: alternateRows && idx % 2 === 1 ? COLORS.LIGHT_GRAY : COLORS.WHITE,
              type: ShadingType.CLEAR,
            },
            borders: BORDERS.thin,
            children: [
              new Paragraph({
                children: [bodyText(item, { size: textSize })],
              }),
            ],
          }),
        ],
      })
    ),
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
  const cardWidth = options?.cardWidth ?? TEACHER_WIDTHS.VOCAB_CARD
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

/**
 * Creates a two-column checklist grid for materials
 */
export function checklistGrid(
  items: string[],
  options?: {
    colWidth?: number
  }
): Table {
  const colWidth = options?.colWidth ?? TEACHER_WIDTHS.HALF_COL

  const rows: TableRow[] = []

  for (let i = 0; i < items.length; i += 2) {
    const rowCells: TableCell[] = []

    for (let j = 0; j < 2; j++) {
      if (i + j < items.length) {
        rowCells.push(
          new TableCell({
            width: { size: colWidth, type: WidthType.DXA },
            shading: {
              fill: Math.floor(i / 2) % 2 === 1 ? COLORS.LIGHT_GRAY : COLORS.WHITE,
              type: ShadingType.CLEAR,
            },
            borders: BORDERS.thin,
            children: [
              new Paragraph({
                children: [bodyText(`[ ] ${items[i + j]}`)],
              }),
            ],
          })
        )
      } else {
        rowCells.push(
          new TableCell({
            width: { size: colWidth, type: WidthType.DXA },
            borders: BORDERS.none,
            children: [new Paragraph({})],
          })
        )
      }
    }

    rows.push(new TableRow({ children: rowCells }))
  }

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
 * Creates a question block with badge and answer lines
 */
export function questionBlock(
  question: string,
  index: number,
  options?: {
    answerLines?: number
  }
): Table {
  const answerLines = options?.answerLines ?? 3
  const badgeWidth = STUDENT_WIDTHS.Q_BADGE
  const contentWidth = STUDENT_WIDTHS.Q_CONTENT

  const answerParagraphs = Array(answerLines)
    .fill(null)
    .map(
      () =>
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: '_'.repeat(80),
              color: COLORS.LINE_GRAY,
              font: 'Arial',
            }),
          ],
        })
    )

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [badgeWidth, contentWidth],
    margins: TABLE_MARGINS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: badgeWidth, type: WidthType.DXA },
            shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.thin,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [whiteText(String(index + 1), { bold: true, size: FONT_SIZES.Q_BADGE })],
              }),
            ],
          }),
          new TableCell({
            width: { size: contentWidth, type: WidthType.DXA },
            shading: {
              fill: index % 2 === 1 ? COLORS.LIGHT_GRAY : COLORS.WHITE,
              type: ShadingType.CLEAR,
            },
            borders: BORDERS.thin,
            children: [
              new Paragraph({
                spacing: { after: 200 },
                children: [bodyText(question)],
              }),
              ...answerParagraphs,
            ],
          }),
        ],
      }),
    ],
  })
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
 * Creates a teacher handout header banner
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
        height: { value: 100, rule: HeightRule.EXACT },
        children: [
          new TableCell({
            shading: { fill: COLORS.ACCENT_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.none,
            children: [new Paragraph({})],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.none,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: `WEEK ${weekNumber}`,
                    bold: true,
                    size: FONT_SIZES.BODY,
                    color: COLORS.LIGHT_BLUE,
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 80 },
                children: [whiteText(unit, { bold: true, size: FONT_SIZES.TITLE })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 160 },
                children: [
                  new TextRun({
                    text: 'Media Foundations \u00B7 Teacher Guide',
                    size: FONT_SIZES.BODY,
                    color: COLORS.LIGHT_BLUE,
                    font: 'Arial',
                  }),
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
  const subtitleParagraphs = subtitle
    ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: subtitle,
              size: FONT_SIZES.BADGE,
              color: COLORS.LIGHT_BLUE,
              font: 'Arial',
            }),
          ],
        }),
      ]
    : []

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [STUDENT_WIDTHS.PAGE],
    margins: TABLE_MARGINS,
    rows: [
      new TableRow({
        height: { value: 100, rule: HeightRule.EXACT },
        children: [
          new TableCell({
            shading: { fill: COLORS.ACCENT_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.none,
            children: [new Paragraph({})],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.none,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 160, after: 80 },
                children: [whiteText(title || 'Student Handout', { bold: true, size: FONT_SIZES.STUDENT_TITLE })],
              }),
              ...subtitleParagraphs,
            ],
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
          new TableCell({
            width: { size: TEACHER_WIDTHS.DAY_TAB, type: WidthType.DXA },
            shading: { fill: COLORS.ACCENT_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.thin,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [whiteText(`DAY ${dayNumber}`, { bold: true, size: FONT_SIZES.DAY_NUMBER })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [whiteText(dayName, { size: FONT_SIZES.BODY_SMALL })],
              }),
            ],
          }),
          new TableCell({
            width: { size: TEACHER_WIDTHS.DAY_TOPIC, type: WidthType.DXA },
            shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
            borders: BORDERS.thin,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { before: 160, after: 160 },
                children: [whiteText(topic || 'Untitled', { bold: true, size: FONT_SIZES.DAY_HEADER })],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
