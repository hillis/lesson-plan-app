# Model Selection and Extended Thinking Design

**Date:** 2026-02-02
**Status:** Approved

## Overview

Add the ability to select which Claude model is used for lesson plan generation, and optionally enable extended thinking when using Opus 4.

## UI Design

**Location:** In `LessonGenerator.tsx`, below "Days per Week" section

**Layout:**
```
Model Settings
┌─────────────────────────────────────────────┐
│  [Sonnet 4 (Faster)]  [Opus 4 (Higher Quality)]  │
└─────────────────────────────────────────────┘

☐ Enable Extended Thinking  ← Only visible when Opus 4 selected
   (Better reasoning, slower generation)
```

**Behavior:**
- Default: Sonnet 4 selected (current behavior)
- When Opus 4 selected: Show thinking checkbox (default unchecked)
- When Sonnet 4 selected: Hide thinking checkbox

**State:**
```typescript
const [selectedModel, setSelectedModel] = useState<'sonnet' | 'opus'>('sonnet')
const [enableThinking, setEnableThinking] = useState(false)
```

## Data Flow

**Frontend → API:**
```typescript
// LessonGenerator sends to /api/generate
{
  weekNumber: 5,
  selectedDays: ['Mon', 'Tue', 'Wed'],
  selectedModel: 'opus',      // NEW
  enableThinking: true,       // NEW
  includeHandouts: true,
  ...
}
```

**API → Claude Agent:**
- `route.ts` passes `selectedModel` and `enableThinking` to `generateLessonPlanWithAgent()`
- Agent passes to `executeGenerateLesson()`

**Claude API Call:**
```typescript
// In generate-lesson.ts
const modelMap = {
  'sonnet': 'claude-sonnet-4-20250514',
  'opus': 'claude-opus-4-20250514'
}

const response = await client.messages.create({
  model: modelMap[params.model],
  max_tokens: params.enableThinking ? 16000 : 8192,
  // Extended thinking config when enabled
  ...(params.enableThinking && {
    thinking: {
      type: 'enabled',
      budget_tokens: 10000
    }
  }),
  messages: [{ role: 'user', content: prompt }],
})
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/LessonGenerator.tsx` | Add model toggle buttons, thinking checkbox, new state |
| `src/app/api/generate/route.ts` | Accept `selectedModel` and `enableThinking`, pass to agent |
| `src/lib/claude/agent.ts` | Update `GenerationRequest` interface, pass params through |
| `src/lib/claude/tools/generate-lesson.ts` | Accept model/thinking params, configure Claude API call |

## Notes

- No database changes needed - these are generation-time settings, not persisted
- Default model is Sonnet 4 (maintains current behavior)
- Extended thinking only available with Opus 4
