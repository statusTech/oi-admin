/**
 * DataTable — shadcn Table + @tanstack/react-table v8 wrapper.
 *
 * @example
 * const columns = [
 *   {
 *     accessorKey: "name",
 *     header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
 *   },
 *   {
 *     accessorKey: "amount",
 *     header: "Valor",
 *     cell: ({ row }) => formatCurrency(row.getValue("amount")),
 *   },
 * ]
 *
 * <DataTable columns={columns} data={rows} onRowClick={(row) => console.log(row)} />
 */

import React, { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { cn } from "@/lib/utils"

/**
 * @param {object} props
 * @param {import("@tanstack/react-table").ColumnDef<TData>[]} props.columns
 * @param {TData[]} props.data
 * @param {boolean} [props.pagination] - show pagination controls (default true)
 * @param {boolean} [props.sorting] - enable column sorting (default true)
 * @param {(row: TData) => void} [props.onRowClick]
 * @param {React.ReactNode} [props.empty] - content shown when data is empty
 * @param {string} [props.className] - extra class applied to the <Table>
 */
export function DataTable({
  columns,
  data,
  pagination = true,
  sorting: enableSorting = true,
  onRowClick,
  empty,
  className,
  numberCellClassName = ''
}) {
  const [sortingState, setSortingState] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sortingState,
      columnFilters,
      pagination: paginationState,
    },
    onSortingChange: setSortingState,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPaginationState,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: !pagination,
  })

  return (
    <div className="w-full">
      <Table className={className}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell 
                    key={cell.id}
                    className={cn(
                      !Number.isNaN(Number(cell.getValue())) ? numberCellClassName : 'text-[13px]',
                      'max-md:text-sm'
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {empty ?? "Nenhum resultado encontrado."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {pagination && <DataTablePagination table={table} />}
    </div>
  )
}
