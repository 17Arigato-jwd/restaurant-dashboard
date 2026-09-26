"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, RefreshCcw, DownloadCloud, FileCode2 } from "lucide-react";

const COMPARISON_DATA = [
  { feature: "Target Market", easy: "Indies, Cloud Kitchens, Casual Dining", petpooja: "Everything (Small to Chains)", restroworks: "Enterprise, Large Chains", gofrugal: "Retail & QSR" },
  { feature: "Offline Reliability", easy: "Native Desktop App / IndexedDB", petpooja: "Strong Desktop App", restroworks: "Browser dependent (Cloud-first)", gofrugal: "Legacy Desktop / Cloud" },
  { feature: "Tally Prime Integration", easy: "1-Click Direct API XML", petpooja: "Supported (via add-on)", restroworks: "Custom API Integration", gofrugal: "Native Integration" },
  { feature: "WhatsApp Digital Bills", easy: "Built-in (Zero extra markup)", petpooja: "Paid Plugin", restroworks: "Third-party Integration", gofrugal: "Paid Module" },
  { feature: "ONDC Auto-Routing", easy: "Native Support (5% Commission)", petpooja: "Supported via third-party", restroworks: "Supported", gofrugal: "Limited" },
  { feature: "Menu Engineering (BCG)", easy: "Included", petpooja: "Basic Reports", restroworks: "Advanced (Enterprise only)", gofrugal: "Basic" },
];

export default function IntegrationsPage() {
  const { setOfflineSales } = useAppStore();
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success">("idle");
  const [generatedXml, setGeneratedXml] = useState<string | null>(null);

  const MOCK_TALLY_XML = `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create">
            <DATE>20231025</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <PARTYLEDGERNAME>Cash Sales</PARTYLEDGERNAME>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Sales A/c</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>152400.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Output CGST @ 2.5%</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>3810.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Output SGST @ 2.5%</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>3810.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>HDFC Bank A/c (UPI)</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-160020.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
  `.trim();

  const handleTallySync = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("success");
      setGeneratedXml(MOCK_TALLY_XML);
      setOfflineSales(0);
    }, 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tally & Integrations</h1>
        <p className="text-muted-foreground mt-1">Export your daily sales ledger and compare the Easy Restaurant SPA against competitors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tally Sync Engine */}
        <Card className="lg:col-span-1 border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-500 flex items-center">
              <DownloadCloud className="w-5 h-5 mr-2" /> 1-Click Tally Prime Sync
            </CardTitle>
            <CardDescription>
              Compiles today's finalized orders into a structured XML payload containing separated ledgers for UPI, Cash, Cards, and GST.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-background rounded-lg border flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-4xl font-bold">142</span>
              <span className="text-sm font-medium text-muted-foreground">Offline Vouchers Pending Sync</span>
            </div>
            
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12" 
              onClick={handleTallySync}
              disabled={syncStatus !== "idle"}
            >
              {syncStatus === "idle" && <><RefreshCcw className="w-4 h-4 mr-2" /> Sync to Tally Prime</>}
              {syncStatus === "syncing" && <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Transmitting XML...</>}
              {syncStatus === "success" && <><Check className="w-4 h-4 mr-2" /> Sync Complete (142 Vouchers)</>}
            </Button>
          </CardContent>
        </Card>

        {/* XML Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><FileCode2 className="w-5 h-5 mr-2 text-muted-foreground" /> XML Payload Preview</CardTitle>
            <CardDescription>Generated accounting format sent to Tally's local API endpoint.</CardDescription>
          </CardHeader>
          <CardContent>
            {syncStatus === 'idle' ? (
              <div className="h-[250px] flex items-center justify-center border rounded-lg bg-muted/30 border-dashed text-muted-foreground">
                Click Sync to generate the XML payload.
              </div>
            ) : (
              <div className="h-[250px] overflow-y-auto bg-black text-green-400 p-4 rounded-lg font-mono text-xs leading-relaxed">
                <pre>{generatedXml || "Generating XML nodes..."}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* POS Comparison Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Indian POS Software Comparison Matrix</CardTitle>
          <CardDescription>How this system stacks up against the legacy giants.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border">
              <thead className="bg-muted/50 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 border-r">Feature / Capability</th>
                  <th className="px-4 py-3 border-r bg-primary/10 font-bold text-primary">Easy Restaurant SPA</th>
                  <th className="px-4 py-3 border-r">Petpooja</th>
                  <th className="px-4 py-3 border-r">Restroworks (POSist)</th>
                  <th className="px-4 py-3">GoFrugal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {COMPARISON_DATA.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium border-r">{row.feature}</td>
                    <td className="px-4 py-3 font-bold text-primary border-r bg-primary/5">{row.easy}</td>
                    <td className="px-4 py-3 border-r">{row.petpooja}</td>
                    <td className="px-4 py-3 border-r">{row.restroworks}</td>
                    <td className="px-4 py-3">{row.gofrugal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
