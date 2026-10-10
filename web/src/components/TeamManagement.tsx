"use client"

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage, AvatarBadge } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Clock, Trash2, UserPlus, FileEdit } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogMedia } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { useAppStore } from "@/store/useAppStore";
import { authHeaders } from "@/lib/api";
import { canManageLevel, roleLevelOf } from "@/lib/permissions";
import { useRouter } from "next/navigation";

import { AddMemberModal } from "./AddMemberModal";

interface RoleInfo {
  id: string;
  name: string;
  level: number;
  canEditLevelsAbove?: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  roleId: string;
  avatarUrl?: string;
  status?: string;
  role?: RoleInfo;
  dishSpecialty?: string;
  weeklySchedule?: string;
  leaveStatus?: string;
}

export function TeamManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const { currentUser } = useAppStore();
  const currentLevel = roleLevelOf(currentUser);

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    const res = await fetch('/api/team', { headers: authHeaders() });
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const fetchRoles = async () => {
    const res = await fetch('/api/roles', { headers: authHeaders() });
    if (res.ok) {
      setRoles(await res.json());
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/team', { headers: authHeaders() }),
        fetch('/api/roles', { headers: authHeaders() }),
      ]);
      if (!active) return;
      if (usersRes.ok) setUsers(await usersRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleDeleteUser = async (id: string) => {
    const res = await fetch(`/api/team/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (res.ok) {
      toast.add({ type: "success", title: "Removed", description: "User has been removed from the team." });
      fetchUsers();
    } else {
      let message = "Action failed.";
      try {
        message = (await res.json()).error || message;
      } catch {}
      toast.add({ type: "error", title: "Action Failed", description: message });
    }
  };

  const handleUpdateAvatar = async (id: string, file: File) => {
    // In a real app, upload file to S3 and get URL. Here we mock it.
    const mockUrl = URL.createObjectURL(file);
    const res = await fetch(`/api/team/${id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ avatarUrl: mockUrl })
    });

    if (res.ok) {
      toast.add({ type: "success", title: "Avatar Updated", description: "Team member avatar updated successfully." });
      fetchUsers();
    } else {
      let message = "Action failed.";
      try {
        message = (await res.json()).error || message;
      } catch {}
      toast.add({ type: "error", title: "Action Failed", description: message });
    }
  };

  const getRoleIcon = (level: number) => {
    if (level === 1) return <Crown className="size-2.5 text-black" />;
    if (level === 2) return <Shield className="size-2.5 text-white" />;
    return <Clock className="size-2.5 text-white" />;
  };

  const getRoleBadgeColor = (level: number) => {
    if (level === 1) return "bg-yellow-400";
    if (level === 2) return "bg-blue-600";
    return "bg-gray-400";
  };

  return (
    <div className="space-y-4">
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={fetchUsers}
        roles={roles}
        currentLevel={currentLevel}
      />
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </div>

      {users.map((user) => {
        const isSelf = user.id === currentUser?.id;
        const canEdit = isSelf || canManageLevel(currentLevel, user.role?.level ?? null);
        const isExpanded = expandedUserId === user.id;

        return (
          <div key={user.id} className={`p-4 border-2 border-border rounded-base flex flex-col justify-between bg-background ${user.status === 'pending' ? 'opacity-60' : ''}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between cursor-pointer group" onClick={() => router.push(`/team-member/${user.id}`)}>
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <Avatar className="size-10 shrink-0">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  ) : (
                    <AvatarFallback className="bg-main text-main-foreground font-bold">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                  {user.role && (
                    <AvatarBadge className={getRoleBadgeColor(user.role.level)}>
                      {getRoleIcon(user.role.level)}
                    </AvatarBadge>
                  )}
                </Avatar>
                <div>
                  <h4 className="font-bold text-sm group-hover:underline">{user.name} {isSelf && "(You)"}</h4>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  {!isSelf && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canEdit}
                      title={canEdit ? "Edit profile" : "You cannot edit an account with an equal or higher role"}
                      onClick={() => router.push(`/account/team/${user.id}`)}
                    >
                      <FileEdit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                <Badge variant={user.role?.level === 1 ? "default" : "outline"} className={user.role?.level === 1 ? "bg-main text-main-foreground" : ""}>
                  {user.role?.name || 'Unknown Role'}
                </Badge>

                {!isSelf && (
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="ghost" size="icon" disabled={!canEdit} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40" />} >
                      <Trash2 className="w-4 h-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogMedia className="bg-black text-white">
                          <Trash2 className="w-6 h-6" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Delete user?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this user from the team. They will no longer have access to the dashboard.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  );
}
