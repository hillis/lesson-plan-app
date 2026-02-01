'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DriveFilePicker } from './DriveFilePicker'
import { GenerationProgress } from './GenerationProgress'
import { useToast } from '@/hooks/use-toast'

interface LessonGeneratorProps {
  hasSyllabus: boolean
  hasStandards: boolean
}

export function LessonGenerator({ hasSyllabus, hasStandards }: LessonGeneratorProps) {
  const [weekNumber, setWeekNumber] = useState('')
  const [daysCount, setDaysCount] = useState<4 | 5>(5)
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

  const handleGenerate = async () => {
    if (!weekNumber || isNaN(parseInt(weekNumber))) {
      toast({
        title: 'Invalid week number',
        description: 'Please enter a valid week number',
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
          daysCount,
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
        setStatusMessage('Saving to Google Drive...')

        // TODO: Convert lesson_plan to actual document files
        // For now, save the JSON as a placeholder
        const saveResponse = await fetch('/api/drive/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generation_id,
            folder_name: `Week ${weekNumber} - ${lesson_plan.unit}`,
            files: [
              {
                name: `Week${weekNumber}_LessonPlan.json`,
                content: Buffer.from(JSON.stringify(lesson_plan, null, 2)).toString('base64'),
                mimeType: 'application/json',
              },
            ],
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
          <Tabs value={String(daysCount)} onValueChange={(v) => setDaysCount(Number(v) as 4 | 5)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="5">5 Days (Mon-Fri)</TabsTrigger>
              <TabsTrigger value="4">4 Days (Mon-Thu)</TabsTrigger>
            </TabsList>
          </Tabs>
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
            className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
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
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
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
