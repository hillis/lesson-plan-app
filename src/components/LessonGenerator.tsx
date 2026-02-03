'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { DriveFilePicker } from './DriveFilePicker'
import { GenerationProgress } from './GenerationProgress'
import { TemplatePanel } from './TemplatePanel'
import { useToast } from '@/hooks/use-toast'
import type { Template } from '@/types/database'

interface LessonGeneratorProps {
  hasSyllabus: boolean
  hasStandards: boolean
}

export function LessonGenerator({ hasSyllabus, hasStandards }: LessonGeneratorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default-cte')
  const [weekNumber, setWeekNumber] = useState('')
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  const [selectedModel, setSelectedModel] = useState<'sonnet' | 'opus'>('sonnet')
  const [enableThinking, setEnableThinking] = useState(false)
  const [includeHandouts, setIncludeHandouts] = useState(true)
  const [includePresentations, setIncludePresentations] = useState(false)
  const [customInstructions, setCustomInstructions] = useState('')
  const [saveToDrive, setSaveToDrive] = useState(true)
  const [driveFolderId, setDriveFolderId] = useState<string>('root')
  const [driveFolderName, setDriveFolderName] = useState('My Drive')

  const [status, setStatus] = useState<'idle' | 'generating' | 'saving' | 'complete' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [result, setResult] = useState<{
    driveUrl?: string
    lessonPlan?: unknown
  } | null>(null)

  const { toast } = useToast()

  // Load saved folder preference on mount
  useEffect(() => {
    const loadFolderPreference = async () => {
      try {
        const response = await fetch('/api/teacher/folder-preference')
        if (response.ok) {
          const { folder_id } = await response.json()
          if (folder_id) {
            setDriveFolderId(folder_id)
            // Note: We don't have the folder name from the API, so we show a generic label
            // The DriveFilePicker will show the correct name when opened
            setDriveFolderName('Saved folder')
          }
          // If folder_id is null, keep defaults ('root' and 'My Drive')
        }
      } catch (error) {
        // Silently fail - will use default My Drive
        console.error('Failed to load folder preference:', error)
      }
    }

    loadFolderPreference()
  }, [])

  const toggleDay = (day: string) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        // Don't allow deselecting the last day
        if (prev.length === 1) return prev
        return prev.filter(d => d !== day)
      }
      // Add day and sort to maintain order
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      return [...prev, day].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
    })
  }

  const handleGenerate = async () => {
    if (!weekNumber || isNaN(parseInt(weekNumber))) {
      toast({
        title: 'Invalid week number',
        description: 'Please enter a valid week number',
        variant: 'destructive',
      })
      return
    }

    if (selectedDays.length === 0) {
      toast({
        title: 'No days selected',
        description: 'Please select at least one day',
        variant: 'destructive',
      })
      return
    }

    setStatus('generating')
    setStatusMessage('Creating your lesson plans...')
    setResult(null)

    try {
      // Step 1: Generate lesson plan
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekNumber: parseInt(weekNumber),
          selectedDays,
          selectedModel,
          enableThinking: selectedModel === 'opus' ? enableThinking : false,
          classDuration: 90,
          includeHandouts,
          includePresentations,
          customInstructions: customInstructions || undefined,
        }),
      })

      if (!generateResponse.ok) {
        const error = await generateResponse.json()
        throw new Error(error.error || 'Generation failed')
      }

      const { generation_id, lesson_plan } = await generateResponse.json()

      // Step 2: Save to Google Drive if requested
      if (saveToDrive) {
        setStatus('saving')
        setStatusMessage('Generating documents and saving to Google Drive...')

        // Send lesson_plan to the server - it will generate DOCX files
        const saveResponse = await fetch('/api/drive/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generation_id,
            folder_name: `Week ${weekNumber} - ${lesson_plan.unit}`,
            lesson_plan,
            folder_id: driveFolderId,
            template_id: selectedTemplateId,
          }),
        })

        if (saveResponse.ok) {
          const { folder_url } = await saveResponse.json()
          setResult({ driveUrl: folder_url, lessonPlan: lesson_plan })
        }
      } else {
        setResult({ lessonPlan: lesson_plan })
      }

      setStatus('complete')
      setStatusMessage('Lesson plans generated successfully!')
      toast({
        title: 'Success!',
        description: 'Your lesson plans have been generated.',
      })
    } catch (error) {
      setStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'Unknown error')
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lesson Plan Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Lesson Plan Template</Label>
          <TemplatePanel
            selectedId={selectedTemplateId}
            onSelect={(template: Template) => setSelectedTemplateId(template.id)}
          />
        </div>

        {/* Week Number */}
        <div className="space-y-2">
          <Label htmlFor="week">Week Number</Label>
          <Input
            id="week"
            type="number"
            min="1"
            max="52"
            placeholder="e.g., 5"
            value={weekNumber}
            onChange={(e) => setWeekNumber(e.target.value)}
          />
        </div>

        {/* Days */}
        <div className="space-y-2">
          <Label>Days per Week</Label>
          <div className="flex gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
              <Button
                key={day}
                type="button"
                variant={selectedDays.includes(day) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleDay(day)}
                className={cn(
                  'flex-1',
                  selectedDays.includes(day) && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                {day}
              </Button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label>AI Model</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={selectedModel === 'sonnet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedModel('sonnet')
                setEnableThinking(false)
              }}
              className={cn(
                'flex-1',
                selectedModel === 'sonnet' && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              Sonnet 4 (Faster)
            </Button>
            <Button
              type="button"
              variant={selectedModel === 'opus' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedModel('opus')}
              className={cn(
                'flex-1',
                selectedModel === 'opus' && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              Opus 4 (Higher Quality)
            </Button>
          </div>
          {selectedModel === 'opus' && (
            <label className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={enableThinking}
                onChange={(e) => setEnableThinking(e.target.checked)}
                className="rounded"
              />
              <span>Enable Extended Thinking (better reasoning, slower)</span>
            </label>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          <Label>Include</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeHandouts}
                onChange={(e) => setIncludeHandouts(e.target.checked)}
                className="rounded"
              />
              <span>Student Handouts</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includePresentations}
                onChange={(e) => setIncludePresentations(e.target.checked)}
                className="rounded"
              />
              <span>PowerPoint Presentations (slower)</span>
            </label>
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="space-y-2">
          <Label htmlFor="instructions">Additional Instructions (optional)</Label>
          <textarea
            id="instructions"
            className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
            placeholder="e.g., Focus on hands-on activities, Include a quiz on Friday..."
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
          />
        </div>

        {/* Google Drive */}
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={saveToDrive}
              onChange={(e) => setSaveToDrive(e.target.checked)}
              className="rounded"
            />
            <span>Save to Google Drive</span>
          </label>
          {saveToDrive && (
            <DriveFilePicker
              onSelect={(id, name) => {
                setDriveFolderId(id)
                setDriveFolderName(name)
              }}
              selectedFolderId={driveFolderId}
            />
          )}
        </div>

        {/* Progress */}
        <GenerationProgress status={status} message={statusMessage} />

        {/* Result */}
        {result?.driveUrl && (
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
            <p className="text-success-foreground">
              Files saved to Google Drive:{' '}
              <a
                href={result.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Open Folder
              </a>
            </p>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={status === 'generating' || status === 'saving'}
          className="w-full"
          size="lg"
        >
          {status === 'generating' || status === 'saving' ? (
            <>
              <span className="animate-spin mr-2">&#9696;</span>
              {status === 'generating' ? 'Generating...' : 'Saving...'}
            </>
          ) : (
            'Generate Lesson Plans'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
