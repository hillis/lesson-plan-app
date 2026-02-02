export type DocumentType = 'syllabus' | 'standards' | 'pacing_guide' | 'other'

export type FileType = 'CTE' | 'Teacher' | 'Student' | 'Presentation'

export interface GeneratedFile {
  id: string
  teacher_id: string
  generation_id: string | null
  name: string
  file_path: string
  file_size: number
  mime_type: string
  file_type: FileType
  week_number: number
  week_start_date: string | null  // ISO date string
  created_at: string              // ISO timestamp
}

export interface Template {
  id: string
  teacher_id: string | null  // null for default templates
  name: string
  file_path: string
  file_size: number | null
  is_default: boolean
  created_at: string
}

export interface Document {
  id: string
  teacher_id: string
  name: string
  type: DocumentType
  file_path: string
  file_size: number | null
  mime_type: string | null
  parsed_content: ParsedContent | null
  created_at: string
}

export interface ParsedContent {
  raw_text: string
  structured_data?: {
    weeks?: WeekData[]
    standards?: StandardData[]
    units?: UnitData[]
  }
}

export interface WeekData {
  week_number: number
  unit: string
  topics: string[]
  objectives?: string[]
}

export interface StandardData {
  code: string
  description: string
  category?: string
}

export interface UnitData {
  name: string
  duration: string
  topics: string[]
}

export interface Teacher {
  id: string
  email: string
  name: string | null
  school: string | null
  google_drive_token: {
    access_token: string
    refresh_token: string | null
  } | null
  google_drive_folder_id: string | null
  created_at: string
}

export interface Generation {
  id: string
  teacher_id: string
  week_number: number | null
  unit_name: string | null
  config: GenerationConfig
  output_files: OutputFile[] | null
  drive_folder_url: string | null
  status: 'pending' | 'generating' | 'completed' | 'failed'
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface GenerationConfig {
  days: string[]
  include_presentations: boolean
  include_handouts: boolean
  include_vocabulary: boolean
  custom_instructions?: string
}

export interface OutputFile {
  name: string
  type: 'lesson_plan' | 'teacher_handout' | 'student_handout' | 'presentation'
  path: string
  day?: number
}
