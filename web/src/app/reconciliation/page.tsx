/* eslint-disable */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, Download, AlertCircle, Banknote, Percent, FileWarning, Calculator } from "lucide-react";
import { DatePickerWithRange } from "@/components/DatePicker";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

// Mock Data for Audit Table
const AUDIT_DATA = [
  { id: "SW-8910", platform: "Swiggy", date: "2023-10-24", gross: 850, expectedPayout: 593.55, actualPayout: 593.55, discrepancy: 0, reason: "" },
  { id: "ZO-4412", platform: "Zomato", date: "2023-10-24", gross: 1200, expectedPayout: 837.95, actualPayout: 837.95, discrepancy: 0, reason: "" },
  { id: "SW-8914", platform: "Swiggy", date: "2023-10-24", gross: 450, expectedPayout: 314.23, actualPayout: 214.23, discrepancy: 100, reason: "Incorrect Customer Refund Deducted" },
  { id: "ZO-4419", platform: "Zomato", date: "2023-10-24", gross: 950, expectedPayout: 663.38, actualPayout: 620.00, discrepancy: 43.38, reason: "Commission Overcharge (25% applied instead of 22%)" },
  { id: "ON-1102", platform: "ONDC", date: "2023-10-25", gross: 600, expectedPayout: 546.00, actualPayout: 546.00, discrepancy: 0, reason: "" },
];

export default function ReconciliationPage() {
  const [orderValue, setOrderValue] = useState<number>(1000);
  const [commissionPercent, setCommissionPercent] = useState<number>(22);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(), to: addDays(new Date(), 7) });

  // Financial Math Engine
  const calcDeductions = (gross: number, commPct: number) => {
    const commission = gross * (commPct / 100);
    const gstOnCommission = commission * 0.18;
    const tds194O = gross * 0.01; // 1% Sec 194O
    const tcs52 = gross * 0.01;   // 1% TCS (0.5 CGST + 0.5 SGST)
    const totalDeductions = commission + gstOnCommission + tds194O + tcs52;
    const netBankPayout = gross - totalDeductions;
    
    return {
      gross,
      commission,
      gstOnCommission,
      tds194O,
      tcs52,
      totalDeductions,
      netBankPayout
    };
  };

  const d = calcDeductions(orderValue, commissionPercent);
  const discrepancies = AUDIT_DATA.filter(row => row.discrepancy > 0);

  const exportDisputeCSV = () => {
    if (discrepancies.length === 0) return alert("No discrepancies to export!");
    
    const headers = ["Order ID", "Platform", "Date", "Gross Value", "Expected Payout", "Actual Bank Payout", "Shortage (Discrepancy)", "Identified Reason"];
    const csvContent = [
      headers.join(","),
      ...discrepancies.map(row => 
        `${row.id},${row.platform},${row.date},${row.gross},${row.expectedPayout},${row.actualPayout},${row.discrepancy},"${row.reason}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Aggregator_Dispute_Claim.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bank Payouts & Reconciliation</h1>
        <p className="text-muted-foreground mt-1">Audit delivery aggregator commissions, track hidden deductions, and export dispute files.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Subtraction Stack Calculator */}
        <Card className="lg:col-span-1 border-primary/20">
          <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
            <CardTitle className="flex items-center"><Calculator className="w-5 h-5 mr-2" /> Payout Calculator</CardTitle>
            <CardDescription>Simulate standard Indian deduction rules.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Gross Order Value (₹)</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="number" className="pl-9" value={orderValue} onChange={e => setOrderValue(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Platform Commission (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="number" step="0.1" className="pl-9" value={commissionPercent} onChange={e => setCommissionPercent(Number(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Waterfall Visualization */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between font-bold text-lg text-green-600">
                <span>Gross Revenue</span>
                <span>₹{d.gross.toFixed(2)}</span>
              </div>
              
              <div className="pl-4 space-y-2 border-l-2 border-red-200 dark:border-red-900/50">
                <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                  <span>- Platform Commission ({commissionPercent}%)</span>
                  <span>-₹{d.commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                  <span>- GST on Commission (18%)</span>
                  <span>-₹{d.gstOnCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                  <span>- Sec 194O TDS (1% Gross)</span>
                  <span>-₹{d.tds194O.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                  <span>- Sec 52 TCS (1% Gross)</span>
                  <span>-₹{d.tcs52.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-xl pt-4 border-t border-dashed text-blue-600 dark:text-blue-400">
                <span>Net Bank Payout</span>
                <span>₹{d.netBankPayout.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>Total Deductions: ₹{d.totalDeductions.toFixed(2)} ({(d.totalDeductions/d.gross*100).toFixed(1)}% of Gross)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <CardTitle>Payout Discrepancy Audit</CardTitle>
              <CardDescription>Reconciliation engine flagging unauthorized aggregator deductions.</CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-[300px]" />
              {discrepancies.length > 0 && (
                <Button onClick={exportDisputeCSV} variant="destructive" className="bg-red-600 hover:bg-red-700 w-full">
                  <Download className="w-4 h-4 mr-2" /> Export Dispute Claim CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {discrepancies.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                  Found {discrepancies.length} orders with missing payouts totaling ₹{discrepancies.reduce((a,b)=>a+b.discrepancy,0).toFixed(2)}. Export CSV and file a merchant support ticket.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border">
                <thead className="bg-muted/50 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">Expected</th>
                    <th className="px-4 py-3 text-right">Actual Bank</th>
                    <th className="px-4 py-3 text-right">Shortage</th>
                    <th className="px-4 py-3">Audit Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {AUDIT_DATA.map((row) => {
                    const hasError = row.discrepancy > 0;
                    return (
                      <tr key={row.id} className={hasError ? "bg-red-50/50 dark:bg-red-950/10" : "hover:bg-muted/30"}>
                        <td className="px-4 py-3 font-medium">{row.id}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={
                            row.platform === 'Swiggy' ? 'text-orange-600 border-orange-300' : 
                            row.platform === 'Zomato' ? 'text-red-600 border-red-300' : 'text-blue-600 border-blue-300'
                          }>
                            {row.platform}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">₹{row.gross.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{row.expectedPayout.toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right font-bold ${hasError ? 'text-red-600 dark:text-red-400' : 'text-green-600'}`}>
                          ₹{row.actualPayout.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {hasError ? (
                            <Badge variant="destructive" className="bg-red-500">
                              -₹{row.discrepancy.toFixed(2)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-xs ${hasError ? 'text-red-700 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                          {row.reason || "Matched"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
