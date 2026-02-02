'use client'

import { Progress } from '@/components/ui/progress'

interface GenerationProgressProps {
  status: 'idle' | 'generating' | 'saving' | 'complete' | 'error'
  message?: string
}

const STATUS_INFO = {
  idle: { progress: 0, label: 'Ready to generate' },
  generating: { progress: 50, label: 'Generating lesson plans...' },
  saving: { progress: 80, label: 'Saving to Google Drive...' },
  complete: { progress: 100, label: 'Complete!' },
  error: { progress: 0, label: 'Error occurred' },
}

export function GenerationProgress({ status, message }: GenerationProgressProps) {
  const info = STATUS_INFO[status]

  if (status === 'idle') return null

  return (
    <div className="space-y-2">
      <Progress value={info.progress} />
      <p className={`text-sm ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
        {message || info.label}
      </p>
    </div>
  )
}
