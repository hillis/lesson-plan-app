import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
  HeightRule,
  TableLayoutType,
  LevelFormat,
} from 'docx'
import type { StudentHandout } from '@/types/lesson'

// Color constants matching CTE Lesson skill design
const COLORS = {
  NAVY_BLUE: '1A3C6E',
  DARK_GRAY: '333333',
  MEDIUM_GRAY: '666666',
  LIGHT_BLUE: 'D6E3F8',
  LIGHT_GRAY: 'F8F9FA',
  ACCENT_BLUE: '4A90D9',
  CREAM_YELLOW: 'FFF9E6',
  SOFT_GREEN: 'E8F5E9',
  WHITE: 'FFFFFF',
  LINE_GRAY: 'DDDDDD',
}

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

const thinBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
}

/**
 * Creates a section header with left accent bar sidebar
 */
function createSectionHeader(text: string): Table {
  const accentWidth = convertInchesToTwip(0.08)
  const contentWidth = convertInchesToTwip(6.82)

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [accentWidth, contentWidth],
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          // Accent bar
          new TableCell({
            width: { size: accentWidth, type: WidthType.DXA },
            shading: { fill: COLORS.ACCENT_BLUE, type: ShadingType.CLEAR },
            borders: noBorder,
            children: [new Paragraph({})],
          }),
          // Content cell
          new TableCell({
            width: { size: contentWidth, type: WidthType.DXA },
            borders: noBorder,
            children: [
              new Paragraph({
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text,
                    bold: true,
                    size: 30, // 15pt
                    color: COLORS.NAVY_BLUE,
                    font: 'Cambria',
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
 * Generates a Canva-quality student handout document
 */
export async function generateStudentHandout(
  handout: StudentHandout,
  weekNumber: number
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = []

  // === HEADER BANNER with accent bar ===
  const fullWidth = convertInchesToTwip(6.9)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [fullWidth],
    borders: thinBorder,
    rows: [
      // Accent bar (thin top bar)
      new TableRow({
        height: { value: 100, rule: HeightRule.EXACT },
        children: [
          new TableCell({
            shading: { fill: COLORS.ACCENT_BLUE, type: ShadingType.CLEAR },
            borders: noBorder,
            children: [new Paragraph({})],
          }),
        ],
      }),
      // Main header cell
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
            borders: noBorder,
            children: [
              // Title
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 160, after: 80 },
                children: [
                  new TextRun({
                    text: handout.title || 'Student Handout',
                    bold: true,
                    size: 48, // 24pt
                    color: COLORS.WHITE,
                    font: 'Cambria',
                  }),
                ],
              }),
              // Subtitle
              ...(handout.subtitle
                ? [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 160 },
                      children: [
                        new TextRun({
                          text: handout.subtitle,
                          size: 24, // 12pt
                          color: COLORS.LIGHT_BLUE,
                          font: 'Calibri',
                        }),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
        ],
      }),
    ],
  })
  children.push(headerTable)
  children.push(new Paragraph({})) // Spacing

  // === INSTRUCTIONS BOX ===
  if (handout.instructions) {
    children.push(createSectionHeader('Instructions'))

    const instructionsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: [fullWidth],
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: fullWidth, type: WidthType.DXA },
              shading: { fill: COLORS.LIGHT_BLUE, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: handout.instructions,
                      size: 22, // 11pt
                      color: COLORS.DARK_GRAY,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
    children.push(instructionsTable)
    children.push(new Paragraph({}))
  }

  // === MAIN CONTENT SECTIONS ===
  for (const section of handout.sections || []) {
    children.push(createSectionHeader(section.heading || 'Content'))

    // Content text
    if (section.content) {
      children.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: section.content,
              size: 22,
              color: COLORS.DARK_GRAY,
            }),
          ],
        })
      )
    }

    // Items (numbered or bulleted)
    if (section.items && section.items.length > 0) {
      if (section.numbered) {
        // Numbered items with circular badges
        const badgeWidth = convertInchesToTwip(0.45)
        const itemContentWidth = convertInchesToTwip(6.45)
        const itemsTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          columnWidths: [badgeWidth, itemContentWidth],
          borders: thinBorder,
          rows: section.items.map((item, idx) =>
            new TableRow({
              children: [
                // Number badge cell
                new TableCell({
                  width: { size: badgeWidth, type: WidthType.DXA },
                  shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
                  verticalAlign: 'center',
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: String(idx + 1),
                          bold: true,
                          size: 24,
                          color: COLORS.WHITE,
                        }),
                      ],
                    }),
                  ],
                }),
                // Content cell
                new TableCell({
                  width: { size: itemContentWidth, type: WidthType.DXA },
                  shading: {
                    fill: idx % 2 === 1 ? COLORS.LIGHT_GRAY : COLORS.WHITE,
                    type: ShadingType.CLEAR,
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: item,
                          size: 22,
                          color: COLORS.DARK_GRAY,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            })
          ),
        })
        children.push(itemsTable)
      } else {
        // Bulleted items - use proper Word numbering
        for (const item of section.items) {
          children.push(
            new Paragraph({
              numbering: { reference: 'student-bullet-list', level: 0 },
              children: [
                new TextRun({
                  text: item,
                  size: 22,
                  color: COLORS.DARK_GRAY,
                }),
              ],
            })
          )
        }
      }
    }

    // Blank lines for writing
    if (section.blank_lines && section.blank_lines > 0) {
      children.push(new Paragraph({}))
      for (let i = 0; i < section.blank_lines; i++) {
        children.push(
          new Paragraph({
            spacing: { after: 280 },
            children: [
              new TextRun({
                text: '_'.repeat(85),
                color: COLORS.LINE_GRAY,
              }),
            ],
          })
        )
      }
    }

    children.push(new Paragraph({}))
  }

  // === QUESTIONS SECTION ===
  if (handout.questions && handout.questions.length > 0) {
    children.push(createSectionHeader('Questions'))

    for (let i = 0; i < handout.questions.length; i++) {
      const question = handout.questions[i]

      const qBadgeWidth = convertInchesToTwip(0.5)
      const qContentWidth = convertInchesToTwip(6.4)
      const questionTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths: [qBadgeWidth, qContentWidth],
        borders: thinBorder,
        rows: [
          new TableRow({
            children: [
              // Question number badge
              new TableCell({
                width: { size: qBadgeWidth, type: WidthType.DXA },
                shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
                verticalAlign: 'center',
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: String(i + 1),
                        bold: true,
                        size: 28,
                        color: COLORS.WHITE,
                      }),
                    ],
                  }),
                ],
              }),
              // Question and answer area
              new TableCell({
                width: { size: qContentWidth, type: WidthType.DXA },
                shading: {
                  fill: i % 2 === 1 ? COLORS.LIGHT_GRAY : COLORS.WHITE,
                  type: ShadingType.CLEAR,
                },
                children: [
                  // Question text
                  new Paragraph({
                    spacing: { after: 200 },
                    children: [
                      new TextRun({
                        text: question,
                        size: 22,
                        color: COLORS.DARK_GRAY,
                      }),
                    ],
                  }),
                  // Answer lines
                  ...Array(3)
                    .fill(null)
                    .map(
                      () =>
                        new Paragraph({
                          spacing: { after: 160 },
                          children: [
                            new TextRun({
                              text: '_'.repeat(80),
                              color: COLORS.LINE_GRAY,
                            }),
                          ],
                        })
                    ),
                ],
              }),
            ],
          }),
        ],
      })
      children.push(questionTable)
      children.push(new Paragraph({}))
    }
  }

  // === VOCABULARY SECTION ===
  if (handout.vocabulary && Object.keys(handout.vocabulary).length > 0) {
    children.push(createSectionHeader('Vocabulary'))

    const vocabItems = Object.entries(handout.vocabulary)
    const vocabRows: TableRow[] = []

    // Create vocabulary cards in two columns
    for (let i = 0; i < vocabItems.length; i += 2) {
      const rowCells: TableCell[] = []

      for (let j = 0; j < 2; j++) {
        if (i + j < vocabItems.length) {
          const [term, definition] = vocabItems[i + j]
          const cardBg = Math.floor(i / 2) % 2 === 0 ? COLORS.LIGHT_BLUE : COLORS.LIGHT_GRAY

          rowCells.push(
            new TableCell({
              width: { size: convertInchesToTwip(3.25), type: WidthType.DXA },
              shading: { fill: cardBg, type: ShadingType.CLEAR },
              children: [
                // Term (bold, navy)
                new Paragraph({
                  spacing: { after: 80 },
                  children: [
                    new TextRun({
                      text: term,
                      bold: true,
                      size: 22,
                      color: COLORS.NAVY_BLUE,
                    }),
                  ],
                }),
                // Definition
                new Paragraph({
                  children: [
                    new TextRun({
                      text: definition,
                      size: 20,
                      color: COLORS.DARK_GRAY,
                    }),
                  ],
                }),
              ],
            })
          )
        } else {
          // Empty cell for odd number of items
          rowCells.push(
            new TableCell({
              width: { size: convertInchesToTwip(3.25), type: WidthType.DXA },
              borders: noBorder,
              children: [new Paragraph({ text: '' })],
            })
          )
        }
      }

      vocabRows.push(new TableRow({ children: rowCells }))
    }

    const vocabColWidth = convertInchesToTwip(3.45)
    const vocabTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: [vocabColWidth, vocabColWidth],
      borders: thinBorder,
      rows: vocabRows,
    })
    children.push(vocabTable)
    children.push(new Paragraph({}))
  }

  // === TIPS/NOTES SECTION ===
  if (handout.tips && handout.tips.length > 0) {
    children.push(createSectionHeader('Tips & Notes'))

    const tipAccentWidth = convertInchesToTwip(0.12)
    const tipContentWidth = convertInchesToTwip(6.78)
    const tipsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: [tipAccentWidth, tipContentWidth],
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            // Yellow accent bar
            new TableCell({
              width: { size: tipAccentWidth, type: WidthType.DXA },
              shading: { fill: 'FFD93D', type: ShadingType.CLEAR },
              borders: noBorder,
              children: [new Paragraph({ text: '' })],
            }),
            // Content cell
            new TableCell({
              width: { size: tipContentWidth, type: WidthType.DXA },
              shading: { fill: COLORS.CREAM_YELLOW, type: ShadingType.CLEAR },
              children: handout.tips.map(
                (tip, idx) =>
                  new Paragraph({
                    numbering: { reference: 'student-bullet-list', level: 0 },
                    spacing: idx === 0 ? {} : { before: 80 },
                    children: [
                      new TextRun({
                        text: tip,
                        size: 20,
                        color: COLORS.DARK_GRAY,
                      }),
                    ],
                  })
              ),
            }),
          ],
        }),
      ],
    })
    children.push(tipsTable)
  }

  // Create the document
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'student-bullet-list',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '\u2022',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
          },
          paragraph: {
            spacing: { after: 120, line: 276 }, // 1.15 line spacing
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.7),
              bottom: convertInchesToTwip(0.7),
              left: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
            },
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
