import Anthropic from '@anthropic-ai/sdk'
import type { LessonPlanInput } from '@/types/lesson'

export const generateLessonTool: Anthropic.Tool = {
  name: 'generate_lesson_plan',
  description: 'Generate a complete lesson plan for a week based on syllabus topics and standards',
  input_schema: {
    type: 'object' as const,
    properties: {
      week_number: { type: 'number', description: 'Week number (1-18)' },
      unit_name: { type: 'string', description: 'Name of the unit' },
      topics: {
        type: 'array',
        items: { type: 'string' },
        description: 'Topics to cover this week',
      },
      selected_days: {
        type: 'array',
        items: { type: 'string' },
        description: 'Days to generate plans for (e.g., ["Mon", "Tue", "Wed"])',
      },
      class_duration: { type: 'number', description: 'Class duration in minutes' },
      standards_text: { type: 'string', description: 'Relevant content standards' },
      include_handouts: { type: 'boolean', description: 'Whether to generate student handouts' },
      additional_context: { type: 'string', description: 'Any additional instructions' },
    },
    required: ['week_number', 'unit_name', 'topics', 'selected_days', 'class_duration'],
  },
}

export async function executeGenerateLesson(params: {
  week_number: number
  unit_name: string
  topics: string[]
  selected_days: string[]
  model?: 'sonnet' | 'opus'
  enable_thinking?: boolean
  class_duration: number
  standards_text?: string
  include_handouts?: boolean
  additional_context?: string
}): Promise<LessonPlanInput> {
  const client = new Anthropic()

  const dayLabels: Record<string, string> = {
    'Mon': 'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
  }
  const selectedDayNames = params.selected_days.map(d => dayLabels[d] || d).join(', ')

  const handoutSection = params.include_handouts ? `
  "student_handouts": [
    {
      "name": "Handout name (e.g., Camera Parts Guide)",
      "title": "Display title for the handout",
      "subtitle": "Media Foundations - Week ${params.week_number}",
      "instructions": "Clear instructions for students on how to use this handout",
      "sections": [
        {
          "heading": "Section heading",
          "numbered": true,
          "items": ["Step or item 1", "Step or item 2"]
        }
      ],
      "vocabulary": {"Term": "Definition"}
    }
  ],
  "teacher_notes": ["Note 1 for teacher", "Note 2 for teacher"],` : ''

  const prompt = `You are an expert curriculum designer. Generate a detailed lesson plan for:

Week ${params.week_number}: ${params.unit_name}
Topics: ${params.topics.join(', ')}
Days: ${selectedDayNames} (${params.selected_days.length} days)
Class Duration: ${params.class_duration} minutes

${params.standards_text ? `Standards:\n${params.standards_text}\n` : ''}
${params.additional_context ? `Additional Notes:\n${params.additional_context}\n` : ''}

Generate a complete JSON lesson plan with this structure:
{
  "week": "${params.week_number}",
  "unit": "${params.unit_name}",
  "week_focus": "Brief focus statement for this week",
  "week_overview": "Detailed week description (2-3 sentences)",
  "week_objectives": ["Weekly objective 1", "Weekly objective 2", "Weekly objective 3"],
  "week_materials": ["Material needed for the week 1", "Material 2"],
  "formative_assessment": "Description of daily/ongoing assessments",
  "summative_assessment": "Description of major assessment with points",
  "weekly_deliverable": "What students must complete by end of week",
  "standards_alignment": "Standards reference text",${handoutSection}
  "days": [
    {
      "day_label": "Monday",
      "topic": "Day topic",
      "overview": "Brief overview of this day's lesson",
      "objectives": ["Learning objective 1", "Learning objective 2"],
      "day_materials": ["Material for this specific day"],
      "schedule": [
        {"time": "10 min", "name": "Bell Ringer", "description": "Warm-up activity description"},
        {"time": "25 min", "name": "Direct Instruction", "description": "Main teaching content"},
        {"time": "30 min", "name": "Guided Practice", "description": "Hands-on activity"},
        {"time": "20 min", "name": "Independent Practice", "description": "Student work time"},
        {"time": "5 min", "name": "Wrap-Up", "description": "Exit ticket or summary"}
      ],
      "vocabulary": {"Term1": "Definition1", "Term2": "Definition2"},
      "differentiation": {
        "Advanced": "Extension activity for advanced learners",
        "Struggling": "Support strategies for struggling learners",
        "ELL": "Language accommodations for English learners"
      },
      "teacher_notes": "Helpful notes for the teacher",
      "content_standards": "Relevant standard codes"
    }
  ]
}

IMPORTANT:
- Generate exactly ${params.selected_days.length} day objects in the "days" array, one for each: ${selectedDayNames}
- Each day MUST have a "day_label" field with the full day name (Monday, Tuesday, etc.)
- Each day's schedule times should total ${params.class_duration} minutes
- Include Bell Ringer, Direct Instruction, Practice activities, and Wrap-Up in each day
- Make activities engaging and hands-on where appropriate
${params.include_handouts ? '- Generate 1-3 student handouts that support the week\'s lessons (guides, worksheets, reference sheets)' : ''}
- Return ONLY valid JSON, no other text`

  // Model mapping
  const modelMap: Record<string, string> = {
    'sonnet': 'claude-sonnet-4-20250514',
    'opus': 'claude-opus-4-20250514',
  }
  const selectedModel = modelMap[params.model || 'sonnet']
  const useThinking = params.model === 'opus' && params.enable_thinking

  // Build request options
  const requestOptions: Anthropic.MessageCreateParams = {
    model: selectedModel,
    max_tokens: useThinking ? 16000 : 8192,
    messages: [{ role: 'user', content: prompt }],
  }

  // Add extended thinking if enabled (Opus only)
  if (useThinking) {
    requestOptions.thinking = {
      type: 'enabled',
      budget_tokens: 10000,
    }
  }

  const response = await client.messages.create(requestOptions)

  // Extract text from response (handle both regular and thinking responses)
  let text = ''
  for (const block of response.content) {
    if (block.type === 'text') {
      text = block.text
      break
    }
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to generate lesson plan')

  return JSON.parse(jsonMatch[0])
}
