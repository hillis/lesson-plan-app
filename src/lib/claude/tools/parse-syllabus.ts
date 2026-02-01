import Anthropic from '@anthropic-ai/sdk'

export const parseSyllabusTool: Anthropic.Tool = {
  name: 'parse_syllabus',
  description: 'Parse a syllabus document to extract weekly topics, units, and course structure',
  input_schema: {
    type: 'object' as const,
    properties: {
      syllabus_text: {
        type: 'string',
        description: 'The raw text content of the syllabus',
      },
    },
    required: ['syllabus_text'],
  },
}

export async function executeParseSyllabus(syllabusText: string): Promise<{
  weeks: Array<{
    week_number: number
    unit: string
    topics: string[]
    objectives?: string[]
  }>
  course_info: {
    title?: string
    instructor?: string
    duration?: string
  }
}> {
  const client = new Anthropic()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Parse this syllabus and extract the weekly structure. Return JSON only.

Syllabus:
${syllabusText}

Return this exact JSON structure:
{
  "weeks": [
    {
      "week_number": 1,
      "unit": "Unit Name",
      "topics": ["Topic 1", "Topic 2"],
      "objectives": ["Objective 1"]
    }
  ],
  "course_info": {
    "title": "Course Title",
    "instructor": "Instructor Name",
    "duration": "18 weeks"
  }
}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse syllabus structure')

  return JSON.parse(jsonMatch[0])
}
