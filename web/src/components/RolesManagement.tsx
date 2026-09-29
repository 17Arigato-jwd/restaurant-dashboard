"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useAppStore } from "@/store/useAppStore";

export function RolesManagement() {
  const [roles, setRoles] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const { role: currentUserRole } = useAppStore();
  const currentRoleId = currentUserRole || 'r1';

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const res = await fetch('/api/roles');
    if (res.ok) {
      setRoles(await res.json());
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName) return;

    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role-Id': currentRoleId
      },
      body: JSON.stringify({ name: newRoleName, level: 5 }) // Custom roles default to low privilege
    });

    if (res.ok) {
      toast.add({ type: "success", title: "Role Created", description: `${newRoleName} role has been created.` });
      setNewRoleName("");
      fetchRoles();
    } else {
      const error = await res.json();
      toast.add({ type: "error", title: "Action Failed", description: error.error });
    }
  };

  const handleDeleteRole = async (id: string) => {
    const res = await fetch(`/api/roles/${id}`, {
      method: 'DELETE',
      headers: {
        'X-User-Role-Id': currentRoleId
      }
    });

    if (res.ok) {
      toast.add({ type: "success", title: "Role Deleted", description: "Role has been permanently removed." });
      fetchRoles();
    } else {
      const error = await res.json();
      toast.add({ type: "error", title: "Action Failed", description: error.error });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end space-x-4 mb-6 p-4 border-2 border-border bg-secondary-background rounded-base">
        <div className="flex-1 space-y-2">
          <Label>New Role Name</Label>
          <Input 
            placeholder="e.g. Delivery Driver" 
            value={newRoleName} 
            onChange={e => setNewRoleName(e.target.value)} 
          />
        </div>
        <Button onClick={handleCreateRole}><Plus className="w-4 h-4 mr-2" /> Create Role</Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-heading font-bold">Existing Roles</h3>
        {roles.map(role => (
          <div key={role.id} className="flex items-center justify-between p-4 border-2 border-border bg-background rounded-base">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm">{role.name}</h4>
                <Badge variant={role.level <= 2 ? "default" : "outline"} className={role.level <= 2 ? "bg-main text-main-foreground" : ""}>
                  Level {role.level}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {role.level <= 2 ? "Core System Role (Cannot be deleted)" : "Custom Role"}
              </p>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" 
              onClick={() => handleDeleteRole(role.id)}
              disabled={role.level <= 2}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
