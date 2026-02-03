export interface LessonPlanInput {
  week: string
  unit: string
  week_focus: string
  week_overview: string
  week_objectives: string[]
  week_materials: string[]
  formative_assessment: string
  summative_assessment: string
  weekly_deliverable: string
  days: DayPlan[]
  vocabulary_summary?: Record<string, string>
  teacher_notes?: string[]
  standards_alignment: string
  student_handouts?: StudentHandout[]
  skip_presentations?: boolean
}

export interface DayPlan {
  day_label?: string
  topic: string
  objectives: string[]
  day_materials: string[]
  schedule: ScheduleItem[]
  vocabulary: Record<string, string>
  differentiation: {
    Advanced: string
    Struggling: string
    ELL: string
  }
  teacher_notes: string
  content_standards: string
  overview?: string
  materials?: string[]
  methods?: string[]
  assessment?: string[]
}

export interface ScheduleItem {
  time: string
  name: string
  description: string
}

export interface StudentHandout {
  name: string
  title: string
  subtitle: string
  instructions: string
  sections: HandoutSection[]
  vocabulary?: Record<string, string>
  questions?: string[]
  tips?: string[]
}

export interface HandoutSection {
  heading: string
  numbered?: boolean
  items: string[]
  content?: string
  blank_lines?: number
}
