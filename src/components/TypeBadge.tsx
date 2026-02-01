import type { FileType } from '@/types/database'

const TYPE_STYLES: Record<FileType, string> = {
  CTE: 'bg-blue-100 text-blue-800',
  Teacher: 'bg-purple-100 text-purple-800',
  Student: 'bg-green-100 text-green-800',
  Presentation: 'bg-orange-100 text-orange-800',
}

export function TypeBadge({ type }: { type: FileType }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_STYLES[type]}`}>
      {type}
    </span>
  )
}
