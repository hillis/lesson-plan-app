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
  // Primary colors
  NAVY_BLUE: '1A3C6E',
  ACCENT_BLUE: '4A90D9',
  LIGHT_BLUE: 'D6E3F8',

  // Neutrals
  WHITE: 'FFFFFF',
  LIGHT_GRAY: 'F5F5F5',
  MEDIUM_GRAY: '666666',
  DARK_GRAY: '333333',
  LINE_GRAY: 'DDDDDD',

  // Accent colors
  CREAM_YELLOW: 'FFF9E6',
  YELLOW_ACCENT: 'FFD93D',
  SOFT_GREEN: 'E8F5E9',
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

// Teacher handout widths (0.7" margins = 7.1" content)
export const TEACHER_WIDTHS = {
  PAGE: convertInchesToTwip(7.1),
  ACCENT_BAR: convertInchesToTwip(0.08),
  CONTENT: convertInchesToTwip(7.02),
  HALF_COL: convertInchesToTwip(3.55),
  THIRD_COL: convertInchesToTwip(2.37),
  BADGE: convertInchesToTwip(0.4),
  BADGE_CONTENT: convertInchesToTwip(6.7),
  DAY_TAB: convertInchesToTwip(1.2),
  DAY_TOPIC: convertInchesToTwip(5.9),
  SCHEDULE_TIME: convertInchesToTwip(0.8),
  SCHEDULE_ACTIVITY: convertInchesToTwip(1.5),
  SCHEDULE_DESC: convertInchesToTwip(4.8),
  NOTE_ACCENT: convertInchesToTwip(0.12),
  NOTE_CONTENT: convertInchesToTwip(6.98),
  VOCAB_CARD: convertInchesToTwip(3.25),
  DIFF_COL: convertInchesToTwip(2.2),
} as const

// Student handout widths (0.8" margins = 6.9" content)
export const STUDENT_WIDTHS = {
  PAGE: convertInchesToTwip(6.9),
  ACCENT_BAR: convertInchesToTwip(0.08),
  CONTENT: convertInchesToTwip(6.82),
  HALF_COL: convertInchesToTwip(3.45),
  BADGE: convertInchesToTwip(0.45),
  BADGE_CONTENT: convertInchesToTwip(6.45),
  Q_BADGE: convertInchesToTwip(0.5),
  Q_CONTENT: convertInchesToTwip(6.4),
  TIP_ACCENT: convertInchesToTwip(0.12),
  TIP_CONTENT: convertInchesToTwip(6.78),
  VOCAB_CARD: convertInchesToTwip(3.25),
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
    top: convertInchesToTwip(0.6),
    bottom: convertInchesToTwip(0.6),
    left: convertInchesToTwip(0.7),
    right: convertInchesToTwip(0.7),
  },
  student: {
    top: convertInchesToTwip(0.7),
    bottom: convertInchesToTwip(0.7),
    left: convertInchesToTwip(0.8),
    right: convertInchesToTwip(0.8),
  },
} as const
