"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { currentUser, token, logout, setMustChangePassword } = useAppStore();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/team/${currentUser?.id}/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        let message = "Could not update password.";
        try {
          message = (await res.json()).error || message;
        } catch {}
        throw new Error(message);
      }

      setMustChangePassword(false);
      toast.add({
        type: "success",
        title: "Password updated",
        description: "Your temporary password has been replaced.",
      });
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            You are signed in with a temporary password. Choose a new password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {error && (
                <div className="p-3 text-sm rounded-md border-2 border-border font-bold bg-red-400 text-black shadow-[2px_2px_0px_0px_var(--border)]">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2 border-t-2 border-border pt-4 bg-transparent">
          <Button type="submit" className="w-full" disabled={loading} onClick={handleSubmit}>
            {loading ? "Saving..." : "Update password"}
          </Button>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-bold underline underline-offset-4"
          >
            Sign out
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
