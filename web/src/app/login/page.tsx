"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Mode = "login" | "register" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAppStore();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Forgot-password flow state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const resetMessages = () => {
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let message = "Authentication failed";
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {}
        throw new Error(message);
      }

      if (mode === "login") {
        const data = await res.json();
        setSession(data.token, data.role, data.userId, data.user);
        router.replace(data.mustChangePassword ? "/change-password" : "/dashboard");
      } else {
        setMode("login");
        setPassword("");
        setInfo("Registration successful! Please log in.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setLoading(true);
    resetMessages();
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        throw new Error("Could not send the OTP. Please try again.");
      }
      setOtpSent(true);
      setInfo("An OTP has been sent to your email. (Developer OTP: 123456)");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    resetMessages();
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      if (!res.ok) {
        let message = "Could not reset the password.";
        try {
          message = (await res.json()).error || message;
        } catch {}
        throw new Error(message);
      }
      setMode("login");
      setOtpSent(false);
      setOtp("");
      setNewPassword("");
      setPassword("");
      setInfo("Password updated. Please log in with your new password.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    resetMessages();
  };

  const title =
    mode === "login"
      ? "Login to your account"
      : mode === "register"
        ? "Register new account"
        : "Reset your password";

  const description =
    mode === "login"
      ? "Enter your email below to login"
      : mode === "register"
        ? "Enter your email below to register"
        : otpSent
          ? "Enter the OTP sent to your email and choose a new password."
          : "Enter your account email to receive an OTP.";

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-muted/20 backdrop-blur-sm">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "forgot" ? (
            <div className="flex flex-col gap-6">
              {error && (
                <div className="p-3 text-sm rounded-md border-2 border-border font-bold shadow-[2px_2px_0px_0px_var(--border)] bg-red-400 text-black">
                  {error}
                </div>
              )}
              {info && (
                <div className="p-3 text-sm rounded-md border-2 border-border font-bold shadow-[2px_2px_0px_0px_var(--border)] bg-green-300 text-black">
                  {info}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent}
                  required
                />
              </div>
              {otpSent && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="otp">OTP</Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reset-password">New password</Label>
                    <Input
                      id="reset-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {error && (
                  <div
                    className={`p-3 text-sm rounded-md border-2 border-border font-bold shadow-[2px_2px_0px_0px_var(--border)] ${error.includes("successful") ? "bg-green-300 text-black" : "bg-red-400 text-black"}`}
                  >
                    {error}
                  </div>
                )}
                {info && (
                  <div className="p-3 text-sm rounded-md border-2 border-border font-bold shadow-[2px_2px_0px_0px_var(--border)] bg-green-300 text-black">
                    {info}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2 border-t-2 border-border pt-4 bg-transparent">
          {mode === "forgot" ? (
            <>
              {otpSent ? (
                <Button className="w-full" disabled={loading} onClick={handleResetPassword}>
                  {loading ? "Processing..." : "Reset password"}
                </Button>
              ) : (
                <Button className="w-full" disabled={loading} onClick={handleRequestOtp}>
                  {loading ? "Processing..." : "Send OTP"}
                </Button>
              )}
              <button
                type="button"
                onClick={() => {
                  switchMode("login");
                  setOtpSent(false);
                }}
                className="mt-2 text-sm font-bold underline underline-offset-4"
              >
                Back to login
              </button>
            </>
          ) : (
            <>
              <Button type="submit" className="w-full" disabled={loading} onClick={handleSubmit}>
                {loading ? "Processing..." : mode === "login" ? "Login" : "Register"}
              </Button>
              <div className="mt-4 text-center text-sm font-bold">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => switchMode(mode === "login" ? "register" : "login")}
                  className="underline underline-offset-4"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
