import { CustomerHistoryTable } from "@/components/CustomerHistoryTable"
import { CustomerHistoryChart } from "@/components/CustomerHistoryChart"

export default function CustomerHistoryPage() {
  return (
    <div className="p-8 space-y-8">
      <CustomerHistoryChart />
      <CustomerHistoryTable />
    </div>
  )
}
