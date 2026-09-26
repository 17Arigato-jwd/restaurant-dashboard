/* eslint-disable */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, AlertOctagon, Key, Trash2, Ban, Search, UserMinus } from "lucide-react";

// Mock Data
const AUDIT_LOGS = [
  { id: "LOG-091", time: "20:45:12", user: "Cashier_Rahul", action: "ITEM_VOID", target: "Table T-04", value: "₹240 (Dal Makhani)", authorizedBy: "Manager_Amit" },
  { id: "LOG-092", time: "20:30:00", user: "Manager_Amit", action: "STOCKOUT_TOGGLE", target: "Tandoori Roti", value: "Marked Sold Out", authorizedBy: "Self" },
  { id: "LOG-093", time: "19:15:22", user: "Cashier_Priya", action: "BILL_VOID", target: "Table T-02", value: "₹1,450", authorizedBy: "Manager_Amit" },
  { id: "LOG-094", time: "18:40:10", user: "Cashier_Rahul", action: "ITEM_VOID", target: "Table T-08", value: "₹180 (Mojito)", authorizedBy: "Manager_Amit" },
  { id: "LOG-095", time: "18:25:05", user: "Cashier_Rahul", action: "BILL_VOID", target: "Table T-07", value: "₹890", authorizedBy: "Manager_Amit" },
  { id: "LOG-096", time: "17:10:45", user: "Cashier_Rahul", action: "DISCOUNT_APPLY", target: "Table T-01", value: "20% (₹400)", authorizedBy: "Manager_Amit" },
  { id: "LOG-097", time: "16:05:30", user: "Cashier_Priya", action: "WHATSAPP_BILL_SENT", target: "919999999999", value: "₹1,240", authorizedBy: "N/A" },
];

const STAFF_METRICS = [
  { user: "Cashier_Priya", avgVoidsPerDay: 1.2, totalVoidValue: 1450, riskScore: "LOW" },
  { user: "Cashier_Rahul", avgVoidsPerDay: 8.5, totalVoidValue: 5600, riskScore: "CRITICAL" },
];

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = AUDIT_LOGS.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Audit & Security</h1>
        <p className="text-muted-foreground mt-1">Monitor sensitive actions, manager overrides, and potential theft vectors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KPI Widgets */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Voids (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Trash2 className="w-8 h-8 text-red-500 mr-3 opacity-20" />
              <div>
                <div className="text-3xl font-bold">4</div>
                <p className="text-sm text-red-600 font-medium">Value: ₹2,760</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Manager PIN Overrides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Key className="w-8 h-8 text-blue-500 mr-3 opacity-20" />
              <div>
                <div className="text-3xl font-bold">5</div>
                <p className="text-sm text-blue-600 font-medium">Authorized by Manager_Amit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-red-800 dark:text-red-400 flex items-center">
              <AlertOctagon className="w-4 h-4 mr-2" /> Suspicious Activity Flag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-red-900 dark:text-red-300">
              <b className="text-lg">Cashier_Rahul</b> exhibits a void rate 
              <b> 2.5x higher</b> than the restaurant average over the last 7 days.
            </p>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Audit Log Table */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Timestamped Action Trail</CardTitle>
              <CardDescription>Immutable log of all sensitive POS operations.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search logs..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Target / Value</th>
                    <th className="px-4 py-3 font-medium text-right">Auth</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-xs">
                  {filteredLogs.map(log => {
                    const isRedFlag = log.action.includes("VOID") || log.action.includes("DISCOUNT");
                    return (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">{log.time}</td>
                        <td className="px-4 py-3 font-semibold font-sans">{log.user}</td>
                        <td className="px-4 py-3">
                          <Badge variant={isRedFlag ? "destructive" : "secondary"} className={isRedFlag ? "bg-red-500" : ""}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-sans font-medium">{log.target}</div>
                          <div className="text-muted-foreground">{log.value}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-sans font-bold ${log.authorizedBy !== 'N/A' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'text-muted-foreground'}`}>
                            {log.authorizedBy}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Cashier Risk Profiles */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-lg flex items-center">
                <UserMinus className="w-5 h-5 mr-2 text-muted-foreground" /> Staff Risk Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="divide-y">
                {STAFF_METRICS.map((staff, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{staff.user}</span>
                      <Badge variant="outline" className={staff.riskScore === 'CRITICAL' ? 'text-red-700 bg-red-100 border-red-300 animate-pulse' : 'text-green-700 bg-green-100 border-green-300'}>
                        {staff.riskScore} RISK
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted p-2 rounded">
                        <div className="text-xs text-muted-foreground">Avg Voids/Day</div>
                        <div className="font-bold">{staff.avgVoidsPerDay}</div>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <div className="text-xs text-muted-foreground">Value Lost</div>
                        <div className="font-bold">₹{staff.totalVoidValue}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
