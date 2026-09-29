"use client"

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage, AvatarBadge } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Clock, Trash2, UserPlus, FileEdit } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogMedia } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { ImageUploader } from "@/components/ImageUploader";
import { useAppStore } from "@/store/useAppStore";

export function TeamManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const { role: currentUserRole } = useAppStore(); // Assuming this is set on login

  // For simulation, let's assume the current logged in user has role 'r1' (Owner)
  const currentRoleId = currentUserRole || 'r1';

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/team');
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const fetchRoles = async () => {
    const res = await fetch('/api/roles');
    if (res.ok) {
      setRoles(await res.json());
    }
  };

  const handleDeleteUser = async (id: string) => {
    const res = await fetch(`/api/team/${id}`, {
      method: 'DELETE',
      headers: {
        'X-User-Role-Id': currentRoleId
      }
    });

    if (res.ok) {
      toast.add({ type: "success", title: "Removed", description: "User has been removed from the team." });
      fetchUsers();
    } else {
      const error = await res.json();
      toast.add({ type: "error", title: "Action Failed", description: error.error });
    }
  };

  const handleUpdateAvatar = async (id: string, file: File) => {
    // In a real app, upload file to S3 and get URL. Here we mock it.
    const mockUrl = URL.createObjectURL(file);
    const res = await fetch(`/api/team/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role-Id': currentRoleId
      },
      body: JSON.stringify({ avatarUrl: mockUrl })
    });

    if (res.ok) {
      toast.add({ type: "success", title: "Avatar Updated", description: "Team member avatar updated successfully." });
      fetchUsers();
    } else {
      const error = await res.json();
      toast.add({ type: "error", title: "Action Failed", description: error.error });
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
      <div className="flex justify-end mb-4">
        <Button onClick={() => toast.add({ type: "success", title: "Invite Sent", description: "Invitation sent successfully." })}>
          <UserPlus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </div>

      {users.map((user) => (
        <div key={user.id} className={`p-4 border-2 border-border rounded-base flex flex-col md:flex-row md:items-center justify-between bg-background ${user.status === 'pending' ? 'opacity-60' : ''}`}>
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
              <h4 className="font-bold text-sm">{user.name} {user.roleId === currentRoleId && "(You)"}</h4>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-32">
              {/* Allow higher roles to edit avatars of others */}
              {user.roleId !== currentRoleId && (
                <ImageUploader 
                  defaultTitle="Edit Avatar" 
                  className="w-full text-xs" 
                  onUpload={async (file) => await handleUpdateAvatar(user.id, file)}
                />
              )}
            </div>
            
            <Badge variant={user.role?.level === 1 ? "default" : "outline"} className={user.role?.level === 1 ? "bg-main text-main-foreground" : ""}>
              {user.role?.name || 'Unknown Role'}
            </Badge>

            {user.roleId !== currentRoleId && (
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" />} >
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
      ))}
    </div>
  );
}
