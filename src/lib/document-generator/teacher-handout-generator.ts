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
  PageBreak,
} from 'docx'
import type { LessonPlanInput, DayPlan } from '@/types/lesson'

// Color constants matching CTE Lesson skill design
const COLORS = {
  NAVY_BLUE: '1A3C6E',
  DARK_GRAY: '333333',
  MEDIUM_GRAY: '666666',
  LIGHT_BLUE: 'D6E3F8',
  LIGHT_GRAY: 'F5F5F5',
  ACCENT_BLUE: '4A90D9',
  CREAM_YELLOW: 'FFF9E6',
  SOFT_GREEN: 'E8F5E9',
  WHITE: 'FFFFFF',
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
function createSectionHeader(text: string, level: 1 | 2 = 1): Table {
  const fontSize = level === 1 ? 32 : 26 // 16pt or 13pt
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          // Accent bar
          new TableCell({
            width: { size: convertInchesToTwip(0.08), type: WidthType.DXA },
            shading: { fill: COLORS.ACCENT_BLUE, type: ShadingType.CLEAR },
            borders: noBorder,
            children: [new Paragraph({ text: '' })],
          }),
          // Content cell
          new TableCell({
            width: { size: convertInchesToTwip(6.8), type: WidthType.DXA },
            borders: noBorder,
            children: [
              new Paragraph({
                spacing: { before: level === 1 ? 80 : 40, after: level === 1 ? 80 : 40 },
                children: [
                  new TextRun({
                    text,
                    bold: true,
                    size: fontSize,
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
 * Generates a Canva-quality teacher handout document for the entire week
 */
export async function generateTeacherHandout(
  lessonPlan: LessonPlanInput,
  weekNumber: number
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = []
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  // === HEADER BANNER with accent bar ===
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: thinBorder,
    rows: [
      // Accent bar (thin top bar)
      new TableRow({
        height: { value: 100, rule: HeightRule.EXACT },
        children: [
          new TableCell({
            shading: { fill: COLORS.ACCENT_BLUE, type: ShadingType.CLEAR },
            borders: noBorder,
            children: [new Paragraph({ text: '' })],
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
              // Week number badge
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: `WEEK ${weekNumber}`,
                    bold: true,
                    size: 22,
                    color: COLORS.LIGHT_BLUE,
                    font: 'Calibri',
                  }),
                ],
              }),
              // Unit title
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text: lessonPlan.unit,
                    bold: true,
                    size: 56, // 28pt
                    color: COLORS.WHITE,
                    font: 'Cambria',
                  }),
                ],
              }),
              // Subtitle
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 160 },
                children: [
                  new TextRun({
                    text: 'Media Foundations \u00B7 Teacher Guide',
                    size: 22,
                    color: COLORS.LIGHT_BLUE,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
  children.push(headerTable)
  children.push(new Paragraph({ text: '' }))

  // === WEEK OVERVIEW BOX ===
  if (lessonPlan.week_overview || lessonPlan.week_focus) {
    children.push(createSectionHeader('Week Overview', 1))

    const overviewChildren: Paragraph[] = []

    if (lessonPlan.week_focus) {
      overviewChildren.push(
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: 'Focus: ',
              bold: true,
              size: 24,
              color: COLORS.NAVY_BLUE,
            }),
            new TextRun({
              text: lessonPlan.week_focus,
              size: 22,
              color: COLORS.DARK_GRAY,
            }),
          ],
        })
      )
    }

    if (lessonPlan.week_overview) {
      overviewChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: lessonPlan.week_overview,
              size: 22,
              color: COLORS.DARK_GRAY,
            }),
          ],
        })
      )
    }

    const overviewTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: COLORS.LIGHT_BLUE, type: ShadingType.CLEAR },
              children: overviewChildren,
            }),
          ],
        }),
      ],
    })
    children.push(overviewTable)
    children.push(new Paragraph({ text: '' }))
  }

  // === WEEKLY LEARNING OBJECTIVES ===
  if (lessonPlan.week_objectives && lessonPlan.week_objectives.length > 0) {
    children.push(createSectionHeader('Weekly Learning Objectives', 1))

    const objRows = lessonPlan.week_objectives.map(
      (obj, idx) =>
        new TableRow({
          children: [
            // Number badge cell
            new TableCell({
              width: { size: convertInchesToTwip(0.4), type: WidthType.DXA },
              shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
              verticalAlign: 'center',
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: String(idx + 1),
                      bold: true,
                      size: 22,
                      color: COLORS.WHITE,
                    }),
                  ],
                }),
              ],
            }),
            // Objective text cell
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: obj,
                      size: 22,
                      color: COLORS.DARK_GRAY,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
    )

    const objTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: objRows,
    })
    children.push(objTable)
    children.push(new Paragraph({ text: '' }))
  }

  // === MATERIALS NEEDED FOR THE WEEK ===
  if (lessonPlan.week_materials && lessonPlan.week_materials.length > 0) {
    children.push(createSectionHeader('Materials Needed for the Week', 1))

    const matRows: TableRow[] = []
    const materials = lessonPlan.week_materials

    for (let i = 0; i < materials.length; i += 2) {
      const rowCells: TableCell[] = []

      for (let j = 0; j < 2; j++) {
        if (i + j < materials.length) {
          rowCells.push(
            new TableCell({
              width: { size: convertInchesToTwip(3.4), type: WidthType.DXA },
              shading: {
                fill: Math.floor(i / 2) % 2 === 1 ? COLORS.LIGHT_GRAY : COLORS.WHITE,
                type: ShadingType.CLEAR,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `[ ] ${materials[i + j]}`,
                      size: 22,
                      color: COLORS.DARK_GRAY,
                    }),
                  ],
                }),
              ],
            })
          )
        } else {
          rowCells.push(
            new TableCell({
              width: { size: convertInchesToTwip(3.4), type: WidthType.DXA },
              borders: noBorder,
              children: [new Paragraph({ text: '' })],
            })
          )
        }
      }

      matRows.push(new TableRow({ children: rowCells }))
    }

    const matTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: matRows,
    })
    children.push(matTable)
    children.push(new Paragraph({ text: '' }))
  }

  // === ASSESSMENT OVERVIEW ===
  if (
    lessonPlan.formative_assessment ||
    lessonPlan.summative_assessment ||
    lessonPlan.weekly_deliverable
  ) {
    children.push(createSectionHeader('Assessment Overview', 1))

    const assessments = [
      { key: 'formative_assessment', label: 'Formative', color: COLORS.LIGHT_BLUE },
      { key: 'summative_assessment', label: 'Summative', color: COLORS.SOFT_GREEN },
      { key: 'weekly_deliverable', label: 'Deliverable', color: COLORS.CREAM_YELLOW },
    ]

    const assessCells = assessments.map(({ key, label, color }) => {
      const value = lessonPlan[key as keyof LessonPlanInput] as string | undefined
      return new TableCell({
        width: { size: convertInchesToTwip(2.2), type: WidthType.DXA },
        shading: { fill: color, type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: label,
                bold: true,
                size: 22,
                color: COLORS.NAVY_BLUE,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: value || 'N/A',
                size: 20,
                color: COLORS.DARK_GRAY,
              }),
            ],
          }),
        ],
      })
    })

    const assessTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: [new TableRow({ children: assessCells })],
    })
    children.push(assessTable)
    children.push(new Paragraph({ text: '' }))
  }

  // === DAILY SECTIONS ===
  const days = lessonPlan.days || []

  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    const dayName = day.day_label || dayNames[i] || `Day ${i + 1}`

    // Page break before each day (except first)
    if (i > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }))
    }

    // Day header - Tab-style banner with topic
    const dayHeaderTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            // Day number "tab"
            new TableCell({
              width: { size: convertInchesToTwip(1.2), type: WidthType.DXA },
              shading: { fill: COLORS.ACCENT_BLUE, type: ShadingType.CLEAR },
              verticalAlign: 'center',
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `DAY ${i + 1}`,
                      bold: true,
                      size: 28,
                      color: COLORS.WHITE,
                      font: 'Cambria',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: dayName,
                      size: 20,
                      color: COLORS.WHITE,
                    }),
                  ],
                }),
              ],
            }),
            // Topic bar
            new TableCell({
              width: { size: convertInchesToTwip(5.7), type: WidthType.DXA },
              shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
              verticalAlign: 'center',
              children: [
                new Paragraph({
                  spacing: { before: 160, after: 160 },
                  children: [
                    new TextRun({
                      text: day.topic || 'Untitled',
                      bold: true,
                      size: 36,
                      color: COLORS.WHITE,
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
    children.push(dayHeaderTable)
    children.push(new Paragraph({ text: '' }))

    // Learning Objectives
    if (day.objectives && day.objectives.length > 0) {
      children.push(createSectionHeader('Learning Objectives', 2))

      const objBox = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: thinBorder,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: COLORS.LIGHT_BLUE, type: ShadingType.CLEAR },
                children: day.objectives.map(
                  (obj, idx) =>
                    new Paragraph({
                      spacing: idx === 0 ? {} : { before: 40 },
                      children: [
                        new TextRun({
                          text: `\u2022 ${obj}`,
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
      children.push(objBox)
    }

    // Materials
    if (day.day_materials && day.day_materials.length > 0) {
      children.push(createSectionHeader('Materials', 2))
      children.push(
        new Paragraph({
          children: day.day_materials.map((mat, idx) => {
            const parts: TextRun[] = []
            if (idx > 0) {
              parts.push(
                new TextRun({
                  text: '  \u2022  ',
                  color: COLORS.MEDIUM_GRAY,
                })
              )
            }
            parts.push(
              new TextRun({
                text: mat,
                size: 22,
                color: COLORS.DARK_GRAY,
              })
            )
            return parts
          }).flat(),
        })
      )
    }

    // Schedule
    if (day.schedule && day.schedule.length > 0) {
      children.push(createSectionHeader('Schedule', 2))

      const scheduleRows = [
        // Header row
        new TableRow({
          children: [
            new TableCell({
              width: { size: convertInchesToTwip(0.8), type: WidthType.DXA },
              shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Time',
                      bold: true,
                      size: 22,
                      color: COLORS.WHITE,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: convertInchesToTwip(1.5), type: WidthType.DXA },
              shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Activity',
                      bold: true,
                      size: 22,
                      color: COLORS.WHITE,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: COLORS.NAVY_BLUE, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Description',
                      bold: true,
                      size: 22,
                      color: COLORS.WHITE,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // Data rows
        ...day.schedule.map(
          (item, idx) =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: convertInchesToTwip(0.8), type: WidthType.DXA },
                  shading: { fill: COLORS.LIGHT_BLUE, type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: item.time,
                          bold: true,
                          size: 20,
                          color: COLORS.NAVY_BLUE,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: convertInchesToTwip(1.5), type: WidthType.DXA },
                  shading: {
                    fill: idx % 2 === 1 ? COLORS.LIGHT_GRAY : COLORS.WHITE,
                    type: ShadingType.CLEAR,
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: item.name,
                          bold: true,
                          size: 20,
                          color: COLORS.DARK_GRAY,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  shading: {
                    fill: idx % 2 === 1 ? COLORS.LIGHT_GRAY : COLORS.WHITE,
                    type: ShadingType.CLEAR,
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: item.description,
                          size: 20,
                          color: COLORS.DARK_GRAY,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            })
        ),
      ]

      const scheduleTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: thinBorder,
        rows: scheduleRows,
      })
      children.push(scheduleTable)
    }

    // Vocabulary
    if (day.vocabulary && Object.keys(day.vocabulary).length > 0) {
      children.push(createSectionHeader('Vocabulary', 2))

      const vocabItems = Object.entries(day.vocabulary)
      const vocabRows: TableRow[] = []

      for (let v = 0; v < vocabItems.length; v += 2) {
        const rowCells: TableCell[] = []
        for (let j = 0; j < 2; j++) {
          if (v + j < vocabItems.length) {
            const [term, definition] = vocabItems[v + j]
            const cardBg = Math.floor(v / 2) % 2 === 0 ? COLORS.LIGHT_BLUE : COLORS.LIGHT_GRAY
            rowCells.push(
              new TableCell({
                width: { size: convertInchesToTwip(3.25), type: WidthType.DXA },
                shading: { fill: cardBg, type: ShadingType.CLEAR },
                children: [
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

      const vocabTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: thinBorder,
        rows: vocabRows,
      })
      children.push(vocabTable)
    }

    // Differentiation
    if (day.differentiation) {
      children.push(createSectionHeader('Differentiation', 2))

      const diffLevels = [
        { key: 'Advanced', label: 'Advanced Learners', color: COLORS.LIGHT_BLUE },
        { key: 'Struggling', label: 'Struggling Learners', color: COLORS.CREAM_YELLOW },
        { key: 'ELL', label: 'ELL Students', color: COLORS.SOFT_GREEN },
      ]

      const diffCells = diffLevels.map(({ key, label, color }) => {
        const value = day.differentiation[key as keyof typeof day.differentiation]
        return new TableCell({
          width: { size: convertInchesToTwip(2.2), type: WidthType.DXA },
          shading: { fill: color, type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: label,
                  bold: true,
                  size: 20,
                  color: COLORS.NAVY_BLUE,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: value || 'N/A',
                  size: 18,
                  color: COLORS.DARK_GRAY,
                }),
              ],
            }),
          ],
        })
      })

      const diffTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: thinBorder,
        rows: [new TableRow({ children: diffCells })],
      })
      children.push(diffTable)
    }

    // Teacher Notes
    if (day.teacher_notes) {
      children.push(createSectionHeader('Teacher Notes', 2))

      const notesTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: thinBorder,
        rows: [
          new TableRow({
            children: [
              // Yellow accent bar
              new TableCell({
                width: { size: convertInchesToTwip(0.12), type: WidthType.DXA },
                shading: { fill: 'FFD93D', type: ShadingType.CLEAR },
                borders: noBorder,
                children: [new Paragraph({ text: '' })],
              }),
              // Content cell
              new TableCell({
                shading: { fill: COLORS.CREAM_YELLOW, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: day.teacher_notes,
                        size: 20,
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
      children.push(notesTable)
    }

    children.push(new Paragraph({ text: '' }))
  }

  // === WEEK-LEVEL TEACHER NOTES ===
  if (lessonPlan.teacher_notes && lessonPlan.teacher_notes.length > 0) {
    children.push(new Paragraph({ children: [new PageBreak()] }))
    children.push(createSectionHeader('Weekly Teacher Notes', 1))

    const weekNotesTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            // Yellow accent bar
            new TableCell({
              width: { size: convertInchesToTwip(0.12), type: WidthType.DXA },
              shading: { fill: 'FFD93D', type: ShadingType.CLEAR },
              borders: noBorder,
              children: [new Paragraph({ text: '' })],
            }),
            // Content cell
            new TableCell({
              shading: { fill: COLORS.CREAM_YELLOW, type: ShadingType.CLEAR },
              children: lessonPlan.teacher_notes.map(
                (note, idx) =>
                  new Paragraph({
                    spacing: idx === 0 ? {} : { before: 80 },
                    children: [
                      new TextRun({
                        text: `\u2022 ${note}`,
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
    children.push(weekNotesTable)
  }

  // Create the document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
          },
          paragraph: {
            spacing: { after: 120, line: 276 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.6),
              bottom: convertInchesToTwip(0.6),
              left: convertInchesToTwip(0.7),
              right: convertInchesToTwip(0.7),
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
 * Generate filename for teacher handout
 */
export function getTeacherHandoutFilename(lessonPlan: LessonPlanInput, weekNumber: number): string {
  const unitSlug = (lessonPlan.unit || 'Unit')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 30)
  return `Week${weekNumber}_${unitSlug}_TeacherHandout.docx`
}
