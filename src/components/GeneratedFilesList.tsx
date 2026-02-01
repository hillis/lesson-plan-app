'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TypeBadge } from '@/components/TypeBadge'
import { RenameDialog } from '@/components/RenameDialog'
import { cn } from '@/lib/utils'
import { ChevronDown, Download, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { GeneratedFile } from '@/types/database'

interface WeekGroup {
  weekNumber: number
  dateRange: string
  files: GeneratedFile[]
}

interface GeneratedFilesListProps {
  files: GeneratedFile[]
  selectedIds: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  onDownload: (file: GeneratedFile) => void
  onBulkDownload: (files: GeneratedFile[]) => void
  onDelete: (id: string) => void
  onRename: (id: string, newName: string) => void
}

function formatWeekDateRange(file: GeneratedFile): string {
  if (!file.week_start_date) return ''

  const start = new Date(file.week_start_date)
  const end = new Date(start)
  end.setDate(end.getDate() + 4) // Friday of the week

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}`
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`
}

function groupByWeek(files: GeneratedFile[]): WeekGroup[] {
  const groups = new Map<number, GeneratedFile[]>()

  for (const file of files) {
    const existing = groups.get(file.week_number) || []
    groups.set(file.week_number, [...existing, file])
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b - a) // Most recent (highest week number) first
    .map(([weekNumber, weekFiles]) => ({
      weekNumber,
      dateRange: formatWeekDateRange(weekFiles[0]),
      files: weekFiles.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    }))
}

export function GeneratedFilesList({
  files,
  selectedIds,
  onSelectionChange,
  onDownload,
  onBulkDownload,
  onDelete,
  onRename,
}: GeneratedFilesListProps) {
  // Group files by week
  const weekGroups = useMemo(() => groupByWeek(files), [files])

  // Most recent week expanded by default
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(() => {
    const mostRecent = weekGroups[0]?.weekNumber
    return mostRecent !== undefined ? new Set([mostRecent]) : new Set()
  })

  // Rename dialog state
  const [renameTarget, setRenameTarget] = useState<GeneratedFile | null>(null)

  const toggleWeek = (week: number) => {
    setOpenWeeks(prev => {
      const next = new Set(prev)
      if (next.has(week)) {
        next.delete(week)
      } else {
        next.add(week)
      }
      return next
    })
  }

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectionChange(next)
  }

  const handleWeekDownload = (group: WeekGroup) => {
    // Apply 10-file limit per RESEARCH.md JSZip memory guidance
    if (group.files.length > 10) {
      alert(`Week ${group.weekNumber} has ${group.files.length} files. Please select up to 10 files for bulk download.`)
      return
    }
    onBulkDownload(group.files)
  }

  const openRenameDialog = (file: GeneratedFile) => setRenameTarget(file)

  const handleRename = (newName: string) => {
    if (renameTarget) {
      onRename(renameTarget.id, newName)
      setRenameTarget(null)
    }
  }

  const handleDelete = (file: GeneratedFile) => {
    if (confirm('Delete this file?')) {
      onDelete(file.id)
    }
  }

  // Empty state
  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No generated files yet</p>
        <Button asChild>
          <Link href="/dashboard/generate">Generate Lesson Plans</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Rename dialog */}
      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        currentName={renameTarget?.name || ''}
        onRename={handleRename}
      />

      {/* Bulk actions bar when files are selected */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-4">
          <span className="text-sm text-gray-600">
            {selectedIds.size} file{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const selected = files.filter(f => selectedIds.has(f.id))
              if (selected.length > 10) {
                alert('Please select up to 10 files for bulk download.')
                return
              }
              onBulkDownload(selected)
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download {selectedIds.size} files
          </Button>
        </div>
      )}

      {weekGroups.map(group => (
        <Collapsible
          key={group.weekNumber}
          open={openWeeks.has(group.weekNumber)}
          onOpenChange={() => toggleWeek(group.weekNumber)}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
            <span className="font-medium">
              Week {group.weekNumber} ({group.files.length} file{group.files.length !== 1 ? 's' : ''})
              {group.dateRange && ` \u2022 ${group.dateRange}`}
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              openWeeks.has(group.weekNumber) && "rotate-180"
            )} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {/* Per-week "Download Week X" button */}
            <div className="flex justify-end px-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeekDownload(group)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Week {group.weekNumber}
              </Button>
            </div>

            {/* File list with checkboxes, badges, download buttons */}
            {group.files.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-white rounded border"
              >
                <Checkbox
                  checked={selectedIds.has(file.id)}
                  onCheckedChange={() => toggleSelection(file.id)}
                  aria-label={`Select ${file.name}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <TypeBadge type={file.file_type} />
                    <span className="text-xs text-gray-500">
                      {new Date(file.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(file)}
                    aria-label={`Download ${file.name}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" aria-label="More options">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openRenameDialog(file)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(file)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}
