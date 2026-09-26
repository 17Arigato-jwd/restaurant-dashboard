/* eslint-disable */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function WhatsAppIntegrationPage() {
  const { token } = useAppStore();
  
  const [formData, setFormData] = useState({
    tableId: "T-14",
    phone: "919999999999",
    billTotal: "1240",
    invoiceNo: "INV-08231",
  });
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [messageId, setMessageId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const res = await fetch("http://127.0.0.1:8000/api/whatsapp/send-bill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to send WhatsApp message");

      const data = await res.json();
      if (data.ok) {
        setStatus("success");
        setMessageId(data.messageId);
      } else {
        throw new Error("Meta API rejected the template");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp API Integration</h1>
        <p className="text-muted-foreground mt-2">
          Phase 4: Digital Bill Transmission Blueprint Sandbox. Use this tab to test sending the 
          <code> digital_bill_receipt</code> utility template via Meta Graph API.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Bill Dispatch</CardTitle>
            <CardDescription>Simulates a cashier clicking "Send Bill" in the Table Drawer.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendBill} className="space-y-4">
              <div className="space-y-2">
                <Label>Table ID</Label>
                <Input 
                  value={formData.tableId}
                  onChange={(e) => setFormData({...formData, tableId: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Phone (E.164 format)</Label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bill Total (₹)</Label>
                  <Input 
                    value={formData.billTotal}
                    onChange={(e) => setFormData({...formData, billTotal: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Input 
                    value={formData.invoiceNo}
                    onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})}
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={status === "loading"}>
                <Send className="w-4 h-4 mr-2" />
                {status === "loading" ? "Sending via Meta..." : "Send WhatsApp Bill"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                System Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">1</div>
                <p><strong>SPA Frontend:</strong> Captures dummy table order payload.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">2</div>
                <p><strong>Backend API (Rust):</strong> Receives payload at <code>/api/whatsapp/send-bill</code>.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">3</div>
                <p><strong>Meta Cloud API:</strong> Validates Utility Template (digital_bill_receipt).</p>
              </div>
            </CardContent>
          </Card>

          {status === "success" && (
            <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-400">Message Sent Successfully</h4>
                <p className="text-sm text-green-800 dark:text-green-500 mt-1">
                  Meta WAMID: <code>{messageId}</code>
                </p>
                <p className="text-xs text-green-700/80 dark:text-green-500/80 mt-2">
                  Waiting for webhook delivery status sync... (Phase 6)
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-400">Dispatch Failed</h4>
                <p className="text-sm text-red-800 dark:text-red-500 mt-1">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
