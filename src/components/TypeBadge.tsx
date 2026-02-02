import type { FileType } from '@/types/database'

const TYPE_STYLES: Record<FileType, string> = {
  CTE: 'bg-primary/10 text-primary dark:bg-primary/20',
  Teacher: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  Student: 'bg-success/10 text-success',
  Presentation: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
}

export function TypeBadge({ type }: { type: FileType }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_STYLES[type]}`}>
      {type}
    </span>
  )
}
