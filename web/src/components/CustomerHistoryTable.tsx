"use client"

import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, CalendarClock } from "lucide-react"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type CustomerHistory = {
  id: string
  enteredAt: string
  exitedAt: string
  tableNumber: string
  contact: string
  orderedItems: string
  amount: number
}

const data: CustomerHistory[] = [
  {
    id: "txn_84i9",
    enteredAt: "18:30",
    exitedAt: "19:45",
    tableNumber: "T-04",
    contact: "ken99@yahoo.com",
    orderedItems: "Truffle Pasta, Garlic Bread, Coke",
    amount: 1450,
  },
  {
    id: "txn_euv4",
    enteredAt: "19:00",
    exitedAt: "20:15",
    tableNumber: "T-12",
    contact: "+91 9876543210",
    orderedItems: "Margherita Pizza, Iced Tea",
    amount: 850,
  },
  {
    id: "txn_1ws0",
    enteredAt: "13:15",
    exitedAt: "14:30",
    tableNumber: "T-02",
    contact: "monserrat@gmail.com",
    orderedItems: "Caesar Salad, Grilled Chicken",
    amount: 1200,
  },
  {
    id: "txn_53ae",
    enteredAt: "20:45",
    exitedAt: "22:10",
    tableNumber: "T-08",
    contact: "silas22@gmail.com",
    orderedItems: "Ribeye Steak, Mashed Potatoes, Wine",
    amount: 3200,
  },
  {
    id: "txn_cj4p",
    enteredAt: "14:00",
    exitedAt: "15:20",
    tableNumber: "T-05",
    contact: "+91 8888888888",
    orderedItems: "Mushroom Risotto",
    amount: 950,
  },
]

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

const columnHelper = createColumnHelper<typeof features, CustomerHistory>()

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        className="data-checked:bg-main data-checked:border-main data-indeterminate:bg-main"
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        className="data-checked:bg-main data-checked:border-main"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("tableNumber", {
    header: "Table",
    cell: ({ row }) => <div className="font-bold">{row.getValue("tableNumber")}</div>,
  }),
  columnHelper.accessor("contact", {
    header: ({ column }) => {
      return (
        <Button
          variant="noShadow"
          className="bg-transparent hover:bg-muted text-foreground p-0 h-auto font-heading"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Contact Info
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("contact")}</div>,
  }),
  columnHelper.accessor("orderedItems", {
    header: "Order Summary",
    cell: ({ row }) => <div className="truncate max-w-[200px]">{row.getValue("orderedItems")}</div>,
  }),
  columnHelper.accessor("enteredAt", {
    header: "Time In",
    cell: ({ row }) => <div>{row.getValue("enteredAt")}</div>,
  }),
  columnHelper.accessor("exitedAt", {
    header: "Time Out",
    cell: ({ row }) => <div>{row.getValue("exitedAt")}</div>,
  }),
  columnHelper.accessor("amount", {
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)
      return <div className="text-right font-bold text-green-700 dark:text-green-400">{formatted}</div>
    },
  }),
  columnHelper.display({
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const history = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="noShadow"
                className="size-8 bg-secondary-background p-0 text-foreground"
              />
            }
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(history.id)}>
              Copy Transaction ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View full receipt</DropdownMenuItem>
            <DropdownMenuItem>Issue refund</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }),
])

export function CustomerHistoryTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full font-base text-foreground bg-background">
      <div className="flex items-center justify-between pb-6">
        <div>
          <h2 className="text-2xl font-black font-heading tracking-tight">Customer History</h2>
          <p className="text-muted-foreground font-bold mt-1">Review past orders, entry/exit times, and contact details.</p>
        </div>
        <Button className="bg-main text-main-foreground hover:bg-main/90 border-2 border-border shadow-shadow">
          <CalendarClock className="w-4 h-4 mr-2" /> Select Date Range
        </Button>
      </div>

      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Filter by contact info..."
          value={(table.getColumn("contact")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("contact")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="noShadow"
                className="ml-auto bg-secondary-background text-foreground"
              />
            }
          >
            Columns <ChevronDown className="w-4 h-4 ml-2" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="rounded-base border-2 border-border bg-background shadow-shadow overflow-hidden">
        <Table>
          <TableHeader className="font-heading bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                className="bg-muted text-foreground border-b-2 border-border"
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead className="text-foreground py-3" key={header.id}>
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="bg-background text-foreground transition-colors hover:bg-muted/50 data-[state=selected]:bg-main/20 data-[state=selected]:text-foreground"
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className="px-4 py-3" key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center font-bold"
                >
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between py-4">
        <div className="text-foreground text-sm font-bold">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="noShadow"
            className="bg-secondary-background text-foreground"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="noShadow"
            className="bg-secondary-background text-foreground"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
