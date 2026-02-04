/**
 * Shared style definitions for Teacher and Student handout generators
 *
 * Centralizes colors, borders, margins, and document styles to reduce
 * code duplication and make theming easier.
 */

import {
  BorderStyle,
  AlignmentType,
  LevelFormat,
  convertInchesToTwip,
  type IStylesOptions,
  type INumberingOptions,
} from 'docx'

// ============================================================================
// Color Palette
// ============================================================================

export const COLORS = {
  // Primary colors (matched to Python CTE skill output)
  NAVY_BLUE: '1B3A5F',
  LIGHT_BLUE: 'D5E8F0',

  // Neutrals
  WHITE: 'FFFFFF',
  LIGHT_GRAY: 'F5F5F5',
  MEDIUM_GRAY: '666666',
  DARK_GRAY: '333333',
  LINE_GRAY: 'DDDDDD',
  BORDER_GRAY: 'CCCCCC',

  // Accent colors
  CREAM_YELLOW: 'FFF9E6',
} as const

// ============================================================================
// Border Definitions
// ============================================================================

export const BORDERS = {
  none: {
    top: { style: BorderStyle.NONE, size: 0, color: COLORS.WHITE },
    bottom: { style: BorderStyle.NONE, size: 0, color: COLORS.WHITE },
    left: { style: BorderStyle.NONE, size: 0, color: COLORS.WHITE },
    right: { style: BorderStyle.NONE, size: 0, color: COLORS.WHITE },
  },
  thin: {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  },
} as const

// ============================================================================
// Layout Constants
// ============================================================================

export const TABLE_MARGINS = { top: 100, bottom: 100, left: 180, right: 180 }

// Teacher handout widths (0.5" margins = 7.5" content)
export const TEACHER_WIDTHS = {
  PAGE: convertInchesToTwip(7.5),
  HALF_COL: convertInchesToTwip(3.75),
  THIRD_COL: convertInchesToTwip(2.5),
  DAY_TAB: convertInchesToTwip(1.0),
  DAY_TOPIC: convertInchesToTwip(6.5),
  SCHEDULE_TIME: convertInchesToTwip(0.8),
  SCHEDULE_ACTIVITY: convertInchesToTwip(1.5),
  SCHEDULE_DESC: convertInchesToTwip(5.2),
  VOCAB_TERM: convertInchesToTwip(3.75),
  VOCAB_DEF: convertInchesToTwip(3.75),
} as const

// Student handout widths (0.6" margins = 7.3" content)
export const STUDENT_WIDTHS = {
  PAGE: convertInchesToTwip(7.3),
  HALF_COL: convertInchesToTwip(3.65),
  VOCAB_TERM: convertInchesToTwip(2.0),
  VOCAB_DEF: convertInchesToTwip(5.3),
} as const

// ============================================================================
// Font Sizes (in half-points)
// ============================================================================

export const FONT_SIZES = {
  TITLE: 56, // 28pt
  HEADING_1: 32, // 16pt
  HEADING_2: 26, // 13pt
  SUBHEADING: 30, // 15pt
  BODY: 22, // 11pt
  BODY_SMALL: 20, // 10pt
  CAPTION: 18, // 9pt
  DAY_HEADER: 36, // 18pt
  DAY_NUMBER: 28, // 14pt
  BADGE: 24, // 12pt
  STUDENT_TITLE: 48, // 24pt
  Q_BADGE: 28, // 14pt
} as const

// ============================================================================
// Document Styles
// ============================================================================

export function getDocumentStyles(): IStylesOptions {
  return {
    default: {
      document: {
        run: {
          font: 'Arial',
          size: FONT_SIZES.BODY,
        },
        paragraph: {
          spacing: { after: 120, line: 276 },
        },
      },
    },
  }
}

// ============================================================================
// Numbering Configuration
// ============================================================================

export function getNumberingConfig(reference: string): INumberingOptions {
  return {
    config: [
      {
        reference,
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
  }
}

// ============================================================================
// Page Margin Presets
// ============================================================================

export const PAGE_MARGINS = {
  teacher: {
    top: convertInchesToTwip(0.5),
    bottom: convertInchesToTwip(0.5),
    left: convertInchesToTwip(0.5),
    right: convertInchesToTwip(0.5),
  },
  student: {
    top: convertInchesToTwip(0.6),
    bottom: convertInchesToTwip(0.6),
    left: convertInchesToTwip(0.6),
    right: convertInchesToTwip(0.6),
  },
} as const
