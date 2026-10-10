/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { useAppStore, Table, TableState } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Users, Coffee, Check, Receipt, X, Send } from "lucide-react";
import { ManagerPinModal } from "@/components/ManagerPinModal";
import { authHeaders } from "@/lib/api";
import { toast } from "@/components/ui/toast";

const STATE_COLORS: Record<TableState, string> = {
  available: "bg-muted hover:bg-muted/80 text-muted-foreground",
  seated: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800",
  ordered: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  billed: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-800",
};

export default function TablesPage() {
  const { tables, updateTableState, settleTable, placeOrder, currentUser } = useAppStore();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [waStatus, setWaStatus] = useState<"idle" | "loading" | "success">("idle");
  const [mounted, setMounted] = useState(false);

  // Quick-add form for new KOT line items (persisted through the API).
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [phone, setPhone] = useState("919999999999");

  // Derive the drawer's table from the live store so 3s polling keeps it fresh.
  const selectedTable: Table | null = tables.find(t => t.id === selectedTableId) ?? null;

  useEffect(() => {
    setMounted(true);
    setCurrentTime(Date.now());
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedTime = (timestamp?: number) => {
    if (!timestamp || !mounted) return "";
    const mins = Math.floor((currentTime - timestamp) / 60000);
    return `${mins}m`;
  };

  const calculateTotal = (table: Table) => {
    const subtotal = table.orders.reduce((acc, order) => acc + (order.price * order.qty), 0);
    const tax = subtotal * 0.05; // 5% GST
    return subtotal + tax;
  };

  const handleTableClick = (table: Table) => {
    setSelectedTableId(table.id);
    setWaStatus("idle");
  };

  const handleSettleClick = () => {
    setIsPinModalOpen(true);
  };

  const handleSettleConfirm = async () => {
    if (selectedTableId) {
      await settleTable(selectedTableId);
    }
    setSelectedTableId(null);
    setIsPinModalOpen(false);
  };

  const handleAddItem = async () => {
    if (!selectedTable) return;
    const name = newItemName.trim();
    if (!name) {
      toast.add({ type: "error", title: "Item required", description: "Enter an item name before adding." });
      return;
    }
    const ok = await placeOrder(selectedTable.id, {
      name,
      price: Number(newItemPrice) || 0,
      qty: 1,
    });
    if (ok) {
      toast.add({ type: "success", title: "Item added", description: `${name} added to ${selectedTable.name}.` });
      setNewItemName("");
      setNewItemPrice("");
    } else {
      toast.add({ type: "error", title: "Error", description: "Failed to add item to the order." });
    }
  };

  const handleSendWaBill = async () => {
    if (!selectedTable) return;
    if (!currentUser?.restaurantId) {
      toast.add({ type: "error", title: "Error", description: "No restaurant linked to this session." });
      return;
    }
    setWaStatus("loading");
    try {
      const res = await fetch("/api/whatsapp/send-bill", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          restaurant_id: currentUser.restaurantId,
          table_id: selectedTable.id,
          phone,
          bill_total: calculateTotal(selectedTable).toFixed(2),
          invoice_no: `INV-${Date.now().toString().slice(-6)}`,
        }),
      });
      if (!res.ok) throw new Error("send failed");
      setWaStatus("success");
      toast.add({ type: "success", title: "Bill sent", description: `Digital bill sent to ${phone}.` });
    } catch (e) {
      setWaStatus("idle");
      toast.add({ type: "error", title: "Error", description: "Failed to send the WhatsApp bill." });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Floor Plan Main Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Floor Plan & Billing</h1>
            <p className="text-muted-foreground mt-1">Manage table states, orders, and digital receipts.</p>
          </div>
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="bg-muted">Available</Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/40">Seated</Badge>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40">Ordered</Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/40">Billed</Badge>
          </div>
        </div>

        {tables.length === 0 ? (
          <div className="border-2 border-dashed rounded-base p-10 text-center text-muted-foreground">
            No tables found for this outlet. Push tables through the live API webhook to see them here.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tables.map(table => (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all hover:scale-[1.02] border-2 ${STATE_COLORS[table.state]} ${selectedTableId === table.id ? 'ring-2 ring-primary ring-offset-2' : 'border-transparent'}`}
                onClick={() => handleTableClick(table)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[140px] text-center">
                  <h3 className="text-2xl font-bold">{table.name}</h3>
                  <div className="flex items-center mt-2 text-sm opacity-80">
                    <Users className="w-4 h-4 mr-1" /> {table.capacity} Pax
                  </div>
                  {table.seatedAt && (
                    <div className="flex items-center mt-3 text-sm font-medium">
                      <Clock className="w-4 h-4 mr-1" /> {getElapsedTime(table.seatedAt)}
                    </div>
                  )}
                  {table.orders.length > 0 && (
                    <div className="mt-2 text-sm font-bold">
                      ₹{calculateTotal(table).toFixed(0)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Table Details Drawer */}
      <div className={`w-96 border-l bg-card shadow-xl transition-transform duration-300 flex flex-col ${selectedTable ? 'translate-x-0' : 'translate-x-full absolute right-0'}`}>
        {selectedTable && (
          <>
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{selectedTable.name}</h2>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-1" /> {selectedTable.capacity} Pax
                  {selectedTable.waiter && <span className="ml-3 border-l pl-3">Waiter: {selectedTable.waiter}</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTableId(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* State Controls */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedTable.state === 'available' ? 'default' : 'outline'}
                  onClick={() => updateTableState(selectedTable.id, 'available')}
                >
                  Clear Table
                </Button>
                <Button
                  variant={selectedTable.state === 'seated' ? 'default' : 'outline'}
                  onClick={() => updateTableState(selectedTable.id, 'seated')}
                >
                  Mark Seated
                </Button>
              </div>

              {/* Order List */}
              {selectedTable.state !== 'available' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold flex items-center">
                      <Coffee className="w-4 h-4 mr-2" /> KOT Orders
                    </h3>
                  </div>

                  {selectedTable.orders.length === 0 ? (
                    <div className="text-center p-6 border rounded-lg border-dashed text-muted-foreground text-sm">
                      No items ordered yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTable.orders.map(order => (
                        <div key={order.id} className="flex justify-between text-sm">
                          <div className="flex gap-2">
                            <span className="font-medium">{order.qty}x</span>
                            <span>{order.name}</span>
                          </div>
                          <span>₹{order.price * order.qty}</span>
                        </div>
                      ))}
                      <div className="pt-4 border-t mt-4 space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span>₹{(calculateTotal(selectedTable) / 1.05).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>CGST + SGST (5%)</span>
                          <span>₹{(calculateTotal(selectedTable) - (calculateTotal(selectedTable) / 1.05)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2">
                          <span>Total</span>
                          <span>₹{calculateTotal(selectedTable).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add item (persisted to the backend) */}
                  <div className="border-2 border-dashed rounded-base p-3 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add KOT Item</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Item name"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="₹"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        className="w-20"
                      />
                    </div>
                    <Button className="w-full" size="sm" onClick={handleAddItem}>
                      + Add Item
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {selectedTable.state !== 'available' && (
              <div className="p-6 border-t bg-muted/30 space-y-3">
                {selectedTable.orders.length > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Customer phone"
                        className="flex-1"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={handleSendWaBill}
                      disabled={waStatus === 'loading' || waStatus === 'success'}
                    >
                      <span className="flex items-center">
                        {waStatus === 'success' ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Send className="w-4 h-4 mr-2" />}
                        {waStatus === 'success' ? 'Bill Sent via WhatsApp' : 'Send Digital Bill (WhatsApp)'}
                      </span>
                      {waStatus !== 'success' && <Badge variant="secondary">API</Badge>}
                    </Button>
                  </>
                )}

                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  onClick={() => updateTableState(selectedTable.id, 'billed').then(handleSettleClick)}
                  disabled={selectedTable.orders.length === 0}
                >
                  <Receipt className="w-5 h-5 mr-2" />
                  Settle Bill
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ManagerPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleSettleConfirm}
        actionName="Settle Bill & Reset Table"
      />
    </div>
  );
}
