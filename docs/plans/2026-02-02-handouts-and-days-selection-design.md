# Handouts and Days Selection Design

**Date:** 2026-02-02
**Status:** Approved

## Overview

This design addresses three issues with lesson plan generation:
1. Days per week selection needs individual day checkboxes instead of 4/5 day tabs
2. Student handouts are not being generated
3. Teacher handouts are not being generated

## Task 1: Days per Week UI Change

### Current State
Two tabs: "5 Days (Mon-Fri)" or "4 Days (Mon-Thu)"

### New Design
Replace tabs with a row of 5 toggle buttons/checkboxes:
- State changes from `daysCount: 4 | 5` to `selectedDays: string[]`
- Default: all 5 days selected
- Minimum: at least 1 day must be selected (validation)

### UI Layout
```
Days per Week
[✓ Mon] [✓ Tue] [✓ Wed] [✓ Thu] [✓ Fri]
```

### Data Flow Changes
1. `LessonGenerator.tsx`: Change state and UI
2. API request: Send `selectedDays: ['Mon', 'Wed', 'Fri']` instead of `daysCount: 5`
3. `/api/generate/route.ts`: Use `selectedDays` array directly in config
4. Claude prompt: Pass selected days so it generates only those days
5. Document generation: Only generate documents for selected days

## Task 2: Student Handout Generation

### Design Elements (from CTE Lesson skill)

| Element | Styling |
|---------|---------|
| Header Banner | Navy (#1A3C6E) with blue accent bar (#4A90D9) at top |
| Title | White, 24pt Cambria, centered |
| Subtitle | Light blue (#D6E3F8), 12pt |
| Section Headers | Navy text with left accent bar sidebar |
| Instructions Box | Light blue (#D6E3F8) background |
| Numbered Items | Circular navy badges with white numbers, alternating row backgrounds |
| Vocabulary | Two-column card layout, alternating blue/gray backgrounds |
| Questions | Number badges + answer lines (gray underscores) |
| Tips Section | Yellow accent bar (#FFD93D) with cream background |

### File Structure
```
src/lib/document-generator/
├── index.ts                      # Main orchestrator (update)
├── student-handout-generator.ts  # NEW - port from skill
└── ...existing files
```

### Function Signature
```typescript
export async function generateStudentHandout(
  handout: StudentHandout,
  weekNumber: number
): Promise<Buffer>
```

### Output
One DOCX file per handout in `student_handouts[]` array, named like `{HandoutName}_StudentHandout.docx`

## Task 3: Teacher Handout Generation

### Design Elements (from CTE Lesson skill)

| Element | Styling |
|---------|---------|
| Header Banner | Full-width navy with accent bar, "WEEK X" badge, unit title (28pt white), subtitle |
| Week Overview | Light blue card with "Focus:" label + overview text |
| Weekly Objectives | Numbered circular navy badges (1, 2, 3...) with objective text |
| Materials | Two-column checklist with `[ ]` checkboxes, alternating rows |
| Assessment Cards | 3-column layout: Formative (blue), Summative (green), Deliverable (yellow) |
| Daily Sections | Page break per day, tab-style header (Day # badge + topic bar) |
| Schedule Tables | Time column highlighted, navy header row |
| Vocabulary | Two-column card layout by category |
| Differentiation | Color-coded columns (Advanced/Struggling/ELL) |
| Teacher Notes | Sticky-note style with yellow accent bar |

### Key Difference from Student Handout
- Teacher handout is **one document for the entire week** (all days combined)
- Student handouts are **one per handout entry** (topic-specific)

### File Structure
```
src/lib/document-generator/
├── teacher-handout-generator.ts  # NEW - port from skill
```

### Function Signature
```typescript
export async function generateTeacherHandout(
  lessonPlan: LessonPlanInput,
  weekNumber: number
): Promise<Buffer>
```

### Output
One DOCX file per week, named like `Week{X}_{Unit}_TeacherHandout.docx`

## Task 4: Claude Prompt Updates

### New Fields to Request

**For Teacher Handout (week-level):**
```typescript
week_overview: string         // Summary of the week
week_objectives: string[]     // 3-5 weekly learning objectives
week_materials: string[]      // All materials needed for the week
formative_assessment: string  // Daily/ongoing assessments
summative_assessment: string  // Major assessments with points
weekly_deliverable: string    // What's due at end of week
vocabulary_summary: Record<string, string>  // Terms by category
teacher_notes: string[]       // Tips for the teacher
```

**For Student Handouts:**
```typescript
student_handouts: [{
  name: string           // e.g., "Copyright Guide"
  title: string          // Display title
  subtitle: string       // e.g., "Media Foundations - Week 2"
  instructions: string   // How to use the handout
  sections: [{
    heading: string
    numbered?: boolean
    items: string[]
  }]
  vocabulary?: Record<string, string>
}]
```

### Prompt Addition
Add explicit instructions telling Claude to generate:
- 1-3 student handouts per week (based on lesson topics)
- Teacher handout summary fields for the week

## Task 5: Integration into Document Pipeline

Update `generateAllDocuments()` in `src/lib/document-generator/index.ts` to:
1. Call `generateTeacherHandout()` once per week
2. Call `generateStudentHandout()` for each entry in `student_handouts[]`
3. Save files to Supabase storage
4. Track in `generated_files` table with correct `file_type` values

## Implementation Order

1. Task 1: Days per Week UI (independent, can start immediately)
2. Task 4: Claude Prompt Updates (needed before handouts work)
3. Task 2: Student Handout Generation
4. Task 3: Teacher Handout Generation
5. Task 5: Integration (depends on 2, 3, 4)

## Files to Modify

- `src/components/LessonGenerator.tsx` - Days UI
- `src/app/api/generate/route.ts` - Accept selectedDays
- `src/lib/claude/tools/generate-lesson.ts` - Prompt updates
- `src/types/lesson.ts` - Add week-level fields
- `src/lib/document-generator/index.ts` - Orchestrator
- `src/lib/document-generator/student-handout-generator.ts` - NEW
- `src/lib/document-generator/teacher-handout-generator.ts` - NEW
