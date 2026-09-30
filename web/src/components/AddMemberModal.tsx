"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "./ui/toast";

export function AddMemberModal({ isOpen, onClose, onAdded }: { isOpen: boolean, onClose: () => void, onAdded: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("r3"); // Default to Cashier or something
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, roleId })
      });
      if (res.ok) {
        toast.add({ type: "success", title: "Member Added", description: "Team member has been created." });
        onAdded();
        onClose();
        setName("");
        setEmail("");
      } else {
        throw new Error(await res.text());
      }
    } catch (e: any) {
      toast.add({ type: "error", title: "Failed", description: e.message || "Failed to add member." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member" description="Create a new account for a team member to login.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@restaurant.com" />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <select 
            value={roleId}
            onChange={e => setRoleId(e.target.value)}
            className="flex h-10 w-full rounded-md border-2 border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="r1">Owner</option>
            <option value="r2">Store Manager</option>
            <option value="r3">Cashier</option>
            <option value="r4">Janitor</option>
          </select>
        </div>
        <div className="flex justify-end pt-4">
          <Button type="button" variant="outline" className="mr-2" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Member"}</Button>
        </div>
      </form>
    </Modal>
  );
}
