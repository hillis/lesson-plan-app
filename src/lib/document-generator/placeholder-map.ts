import type { LessonPlanInput, DayPlan, ScheduleItem } from '@/types/lesson'

/**
 * Data structure matching docx-templates placeholders in the CTE template.
 * Each field corresponds to a {= fieldName} placeholder in the template.
 */
export interface PlaceholderData {
  week: string
  courseTitle: string
  topic: string
  duration: string
  contentStandards: string
  overview: string
  additionalMaterials: string
  procedures: string
  differentiation: string
  evaluation: string
}

/**
 * Format a schedule array into a readable string.
 * Each item appears on its own line with time, name, and description.
 *
 * @param schedule - Array of schedule items from the day plan
 * @returns Formatted string with newline-separated schedule entries
 */
export function formatSchedule(schedule: ScheduleItem[]): string {
  return schedule
    .map((item) => `${item.time} - ${item.name}: ${item.description}`)
    .join('\n')
}

/**
 * Format differentiation strategies into a readable string.
 * Groups Advanced, Struggling, and ELL strategies with labels.
 *
 * @param diff - Differentiation object with strategies for each learner group
 * @returns Formatted string with labeled differentiation strategies
 */
export function formatDifferentiation(diff: {
  Advanced: string
  Struggling: string
  ELL: string
}): string {
  return [
    `Advanced: ${diff.Advanced}`,
    `Struggling: ${diff.Struggling}`,
    `ELL: ${diff.ELL}`,
  ].join('\n')
}

/**
 * Map lesson plan data to template placeholder values.
 * Transforms the structured LessonPlanInput into flat PlaceholderData
 * suitable for docx-templates merge.
 *
 * @param lessonPlan - The full lesson plan input with week-level data
 * @param dayIndex - Zero-based index of the day to extract (0-4 for a 5-day week)
 * @returns PlaceholderData object ready for template merging
 */
export function mapLessonPlanToPlaceholders(
  lessonPlan: LessonPlanInput,
  dayIndex: number
): PlaceholderData {
  const day: DayPlan = lessonPlan.days[dayIndex]

  if (!day) {
    throw new Error(
      `Day index ${dayIndex} out of range. Lesson plan has ${lessonPlan.days.length} days.`
    )
  }

  return {
    week: lessonPlan.week,
    courseTitle: lessonPlan.unit,
    topic: day.topic,
    duration: '90', // Default duration in minutes; could be configurable
    contentStandards: day.content_standards,
    overview: day.overview || '',
    additionalMaterials: day.day_materials.join('\n'),
    procedures: formatSchedule(day.schedule),
    differentiation: formatDifferentiation(day.differentiation),
    evaluation: 'See lesson objectives', // Placeholder text for evaluation
  }
}
