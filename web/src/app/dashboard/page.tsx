import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time metrics and daily performance.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Daily Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹45,231</div>
            <p className="text-xs text-muted-foreground">+14% from yesterday</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Kitchen Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 delayed (&gt;18 mins)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Prep Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14.2 min</div>
            <p className="text-xs text-muted-foreground">Target: 14.0 min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Split</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68% UPI</div>
            <p className="text-xs text-muted-foreground">20% Card, 12% Cash</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Tables Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Hourly Sales Flow</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full bg-muted/20 border-dashed border-2 rounded-lg flex items-center justify-center text-muted-foreground">
              [Stacked Bar Chart Placeholder]
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Revenue Channel Share</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full bg-muted/20 border-dashed border-2 rounded-lg flex items-center justify-center text-muted-foreground">
              [Donut Chart Placeholder]
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Live Active Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full bg-muted/20 border-dashed border-2 rounded-lg flex items-center justify-center text-muted-foreground">
            [Data Table Placeholder: Orders with Delay Color-Coding]
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
