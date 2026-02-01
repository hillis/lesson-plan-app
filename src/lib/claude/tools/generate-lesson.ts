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
      days_count: { type: 'number', description: 'Number of days (4 or 5)' },
      class_duration: { type: 'number', description: 'Class duration in minutes' },
      standards_text: { type: 'string', description: 'Relevant content standards' },
      additional_context: { type: 'string', description: 'Any additional instructions' },
    },
    required: ['week_number', 'unit_name', 'topics', 'days_count', 'class_duration'],
  },
}

export async function executeGenerateLesson(params: {
  week_number: number
  unit_name: string
  topics: string[]
  days_count: number
  class_duration: number
  standards_text?: string
  additional_context?: string
}): Promise<LessonPlanInput> {
  const client = new Anthropic()

  const prompt = `You are an expert curriculum designer. Generate a detailed lesson plan for:

Week ${params.week_number}: ${params.unit_name}
Topics: ${params.topics.join(', ')}
Days: ${params.days_count}
Class Duration: ${params.class_duration} minutes

${params.standards_text ? `Standards:\n${params.standards_text}\n` : ''}
${params.additional_context ? `Additional Notes:\n${params.additional_context}\n` : ''}

Generate a complete JSON lesson plan with this structure:
{
  "week": "${params.week_number}",
  "unit": "${params.unit_name}",
  "week_focus": "Brief focus statement",
  "week_overview": "Detailed week description",
  "week_objectives": ["Objective 1", "Objective 2"],
  "week_materials": ["Material 1", "Material 2"],
  "formative_assessment": "Daily assessments",
  "summative_assessment": "Major assessment with points",
  "weekly_deliverable": "What is due at end of week",
  "standards_alignment": "Standards reference",
  "days": [
    {
      "topic": "Day topic",
      "objectives": ["Learning objective 1"],
      "day_materials": ["Material for this day"],
      "schedule": [
        {"time": "10 min", "name": "Bell Ringer", "description": "Activity description"}
      ],
      "vocabulary": {"Term": "Definition"},
      "differentiation": {
        "Advanced": "Extension activity",
        "Struggling": "Support provided",
        "ELL": "Language accommodations"
      },
      "teacher_notes": "Notes for the teacher",
      "content_standards": "Standard code"
    }
  ]
}

Each day's schedule should total ${params.class_duration} minutes.
Include a Bell Ringer, Direct Instruction, Guided/Independent Practice, and Wrap-Up.
Make activities engaging and hands-on where appropriate.
Return ONLY valid JSON, no other text.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to generate lesson plan')

  return JSON.parse(jsonMatch[0])
}
