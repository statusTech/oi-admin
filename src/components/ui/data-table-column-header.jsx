import React from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * Column header with tri-state sort toggle (asc → desc → none).
 * Usage: `header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />`
 */
export function DataTableColumnHeader({ column, title, className }) {
  if (!column.getCanSort()) {
    return <div className={cn("text-sm font-medium", className)}>{title}</div>
  }

  const sorted = column.getIsSorted()

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      <span>{title}</span>
      {sorted === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : sorted === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  )
}
