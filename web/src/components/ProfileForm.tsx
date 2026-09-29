"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { ImageUploader } from "@/components/ImageUploader";
import { Save } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function ProfileForm() {
  const { currentUser, refreshCurrentUser } = useAppStore();
  const [name, setName] = useState(currentUser?.name || "Restaurant Admin");
  const [email, setEmail] = useState(currentUser?.email || "admin@restaurant.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setAvatarUrl(currentUser.avatarUrl || "");
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/team/u1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, avatarUrl })
      });
      if (res.ok) {
        toast.add({ type: "success", title: "Success", description: "Profile details updated globally." });
        await refreshCurrentUser();
      } else {
        throw new Error("Failed to update");
      }
    } catch (e) {
      toast.add({ type: "error", title: "Error", description: "Could not save profile details." });
    }
  };

  const [firstName, ...lastNameParts] = name.split(" ");
  const lastName = lastNameParts.join(" ");

  return (
    <Card className="animate-in fade-in duration-300 slide-in-from-right-4 bg-secondary-background">
      <CardHeader>
        <CardTitle>Profile Details</CardTitle>
        <CardDescription>Update your personal information and contact details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
          <Avatar className="size-20 shadow-shadow shrink-0 overflow-hidden">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} className="object-cover" />
            ) : null}
            <AvatarFallback className="text-2xl font-heading bg-main text-main-foreground">{name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="w-full max-w-sm">
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
        </div>
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </CardContent>
      <CardFooter className="border-t-2 border-border bg-muted/20 px-6 py-4">
        <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Profile</Button>
      </CardFooter>
    </Card>
  );
}
