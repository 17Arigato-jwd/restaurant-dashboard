"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { authHeaders } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * `mode="self"` changes your own password (current password required).
 * `mode="manage"` resets the password of a lower-level team member.
 */
export function ChangePasswordCard({
  userId,
  mode = "self",
}: {
  userId: string;
  mode?: "self" | "manage";
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPassword.length < 4) {
      toast.add({ type: "error", title: "Invalid password", description: "Password must be at least 4 characters." });
      return;
    }
    if (mode === "self" && newPassword !== confirmPassword) {
      toast.add({ type: "error", title: "Passwords differ", description: "The new passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = { newPassword };
      if (mode === "self") body.currentPassword = currentPassword;

      const res = await fetch(`/api/team/${userId}/password`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let message = "Could not update the password.";
        try {
          message = (await res.json()).error || message;
        } catch {}
        throw new Error(message);
      }

      toast.add({
        type: "success",
        title: "Password updated",
        description: mode === "self" ? "Your password has been changed." : "The team member's password has been reset.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast.add({
        type: "error",
        title: "Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="animate-in fade-in duration-300 slide-in-from-right-4 bg-secondary-background">
      <CardHeader>
        <CardTitle>{mode === "self" ? "Change Password" : "Reset Password"}</CardTitle>
        <CardDescription>
          {mode === "self"
            ? "Update the password used to sign in to your account."
            : "Set a new password for this team member. They will not need to confirm the old one."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "self" && (
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          {mode === "self" && (
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t-2 border-border bg-muted/20 px-6 py-4">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : mode === "self" ? "Change Password" : "Reset Password"}
        </Button>
      </CardFooter>
    </Card>
  );
}
