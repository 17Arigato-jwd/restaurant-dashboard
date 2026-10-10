"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { authHeaders } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { roleLevelOf } from "@/lib/permissions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
}

export default function InventoryExpiryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAppStore();
  const isManager = (roleLevelOf(currentUser) ?? 99) <= 2;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Produce");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("kg");
  const [expiryDate, setExpiryDate] = useState("");

  const categories = ["Produce", "Meat", "Dairy", "Pantry", "Beverage", "General"];
  const units = ["kg", "g", "L", "ml", "pcs", "boxes"];

  // A few realistic starting items so a brand-new outlet can see the tracker and
  // the Stock & Waste page working without typing each one by hand.
  const SAMPLE_STOCK = [
    { name: "Tomatoes", category: "Produce", quantity: 12, unit: "kg", days: 4 },
    { name: "Fresh Paneer", category: "Dairy", quantity: 6, unit: "kg", days: 6 },
    { name: "Amul Butter", category: "Dairy", quantity: 4, unit: "kg", days: 20 },
    { name: "Fresh Cream", category: "Dairy", quantity: 5, unit: "L", days: 9 },
    { name: "Chicken Tikka", category: "Meat", quantity: 8, unit: "kg", days: 2 },
    { name: "Basmati Rice", category: "Pantry", quantity: 25, unit: "kg", days: 60 },
  ];

  const handleLoadSamples = async () => {
    const results = await Promise.all(
      SAMPLE_STOCK.map((item) => {
        const expiry = new Date(Date.now() + item.days * 86_400_000).toISOString().slice(0, 10);
        return fetch('/api/inventory-items', {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            expiryDate: expiry,
          }),
        });
      }),
    );
    const added = results.filter((r) => r.ok).length;
    if (added === SAMPLE_STOCK.length) {
      toast.add({ type: "success", title: "Sample stock added", description: `${added} items added to inventory.` });
    } else if (added > 0) {
      toast.add({ type: "error", title: "Partially added", description: `${added} of ${SAMPLE_STOCK.length} items added.` });
    } else {
      toast.add({ type: "error", title: "Error", description: "Could not add sample stock. Is the backend running?" });
    }
    fetchItems();
  };

  const fetchItems = async () => {
    try {
      setError(null);
      const res = await fetch('/api/inventory-items', { headers: authHeaders() });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Unexpected response from the inventory API');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddItem = async () => {
    if (!name || !expiryDate) {
      toast.add({ type: "error", title: "Error", description: "Name and expiry date are required" });
      return;
    }

    const res = await fetch('/api/inventory-items', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name,
        category,
        quantity: parseFloat(quantity) || 0,
        unit,
        expiryDate
      })
    });

    if (res.ok) {
      toast.add({ type: "success", title: "Added", description: "Inventory item added successfully" });
      setName("");
      setQuantity("1");
      setExpiryDate("");
      fetchItems();
    } else {
      toast.add({ type: "error", title: "Error", description: "Failed to add inventory item" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    const res = await fetch(`/api/inventory-items/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    if (res.ok) {
      toast.add({ type: "success", title: "Deleted", description: "Item removed" });
      fetchItems();
    }
  };

  const getExpiryStatus = (dateStr: string) => {
    const days = differenceInDays(new Date(dateStr), new Date());
    if (days < 0) return { label: "Expired", color: "bg-red-500 text-white border-red-700" };
    if (days <= 3) return { label: `Expires in ${days} days`, color: "bg-orange-400 text-black border-orange-600" };
    if (days <= 7) return { label: `Expires in ${days} days`, color: "bg-yellow-300 text-black border-yellow-500" };
    return { label: `Expires in ${days} days`, color: "bg-green-300 text-black border-green-500" };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-heading">Inventory Expiry Tracker</h1>
      </div>

      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle>Add Inventory Item</CardTitle>
            <CardDescription>Log new stock to monitor its expiry date.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold">Item Name</label>
                <Input placeholder="e.g. Tomatoes" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Category</label>
                <Select value={category} onValueChange={(value) => setCategory(value ?? "")}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Quantity</label>
                <div className="flex gap-2">
                  <Input type="number" min="0.1" step="0.1" value={quantity} onChange={e => setQuantity(e.target.value)} />
                  <Select value={unit} onValueChange={(value) => setUnit(value ?? "")}>
                    <SelectTrigger className="bg-white w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Expiry Date</label>
                <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
              </div>
              <Button onClick={handleAddItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-center justify-between gap-4 border-2 border-red-500 bg-red-50 rounded-base p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">
              Could not load inventory ({error}). Make sure the backend is running: <code>cd backend &amp;&amp; cargo run</code>
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchItems}>Retry</Button>
        </div>
      )}

      <div className="bg-white border-2 border-black rounded-base shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-main border-b-2 border-black">
                <th className="p-4 font-bold border-r-2 border-black">Item Name</th>
                <th className="p-4 font-bold border-r-2 border-black">Category</th>
                <th className="p-4 font-bold border-r-2 border-black">Quantity</th>
                <th className="p-4 font-bold border-r-2 border-black">Expiry Date</th>
                <th className="p-4 font-bold border-r-2 border-black">Status</th>
                {isManager && <th className="p-4 font-bold w-16">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground italic">Loading inventory…</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                    {error ? (
                      "Inventory could not be loaded."
                    ) : (
                      <div className="flex flex-col items-center gap-3 not-italic">
                        <span>No inventory items found. Add some stock to track expiry.</span>
                        {isManager && (
                          <Button variant="outline" size="sm" onClick={handleLoadSamples}>
                            <Plus className="w-4 h-4 mr-2" /> Load sample stock
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ) : items.map((item, index) => {
                const status = getExpiryStatus(item.expiryDate);
                const isExpired = differenceInDays(new Date(item.expiryDate), new Date()) < 0;
                return (
                  <tr key={item.id} className={`border-b-2 border-black last:border-b-0 hover:bg-muted/50 ${isExpired ? 'bg-red-50' : ''}`}>
                    <td className="p-4 font-semibold border-r-2 border-black">{item.name}</td>
                    <td className="p-4 border-r-2 border-black">{item.category}</td>
                    <td className="p-4 border-r-2 border-black">{item.quantity} {item.unit}</td>
                    <td className="p-4 border-r-2 border-black font-mono">
                      {format(new Date(item.expiryDate), "MMM dd, yyyy")}
                    </td>
                    <td className="p-4 border-r-2 border-black">
                      <div className={`inline-flex items-center px-2 py-1 rounded-base border-2 font-bold text-xs ${status.color}`}>
                        {isExpired && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {status.label}
                      </div>
                    </td>
                    {isManager && (
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

