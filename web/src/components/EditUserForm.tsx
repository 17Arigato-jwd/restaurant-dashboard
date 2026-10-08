"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { ImageUploader } from "@/components/ImageUploader";
import { Save, Trash2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";import { authHeaders } from "@/lib/api";
import { ChangePasswordCard } from "@/components/ChangePasswordCard";

export function EditUserForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { currentUser, refreshCurrentUser } = useAppStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/team/${userId}`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setEmail(data.email || "");
          setAvatarUrl(data.avatarUrl || "");
        } else {
          toast.add({ type: "error", title: "Error", description: "Failed to load user data." });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/team/${userId}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name, email, avatarUrl })
      });
      if (res.ok) {
        toast.add({ type: "success", title: "Success", description: "User details updated." });
        if (currentUser?.id === userId) {
          await refreshCurrentUser();
        }
      } else {
        throw new Error("Failed to update");
      }
    } catch (e) {
      toast.add({ type: "error", title: "Error", description: "Could not save user details." });
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const [firstName, ...lastNameParts] = name.split(" ");
  const lastName = lastNameParts.join(" ");

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/account?tab=team')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Team
      </Button>
      <Card className="animate-in fade-in duration-300 slide-in-from-right-4 bg-secondary-background">
        <CardHeader>
          <CardTitle>Edit Team Member</CardTitle>
          <CardDescription>Update personal information and contact details for this account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
            <Avatar className="size-20 shadow-shadow shrink-0 overflow-hidden">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} className="object-cover" />
              ) : null}
              <AvatarFallback className="text-2xl font-heading bg-main text-main-foreground">{name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="w-full max-w-sm flex items-end gap-2">
              <div className="flex-1">
                <Label className="mb-2 block text-sm font-bold">Profile Picture</Label>
                <ImageUploader 
                  defaultTitle="Upload new avatar"
                  className="w-full"
                  onUpload={async (file) => {
                    const url = URL.createObjectURL(file);
                    setAvatarUrl(url);
                  }}
                />
              </div>
              {avatarUrl && (
                <Button variant="destructive" size="icon" onClick={() => setAvatarUrl("")} title="Remove Profile Picture">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={firstName} onChange={(e) => setName(e.target.value + " " + lastName)} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={lastName} onChange={(e) => setName(firstName + " " + e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            <p className="text-xs text-muted-foreground mt-1">This email can be used to login separately into this account.</p>
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="border-t-2 border-border bg-muted/20 px-6 py-4">
          <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
        </CardFooter>
      </Card>
      <ChangePasswordCard userId={userId} mode="manage" />
    </div>
  );
}
