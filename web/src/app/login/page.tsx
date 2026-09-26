"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAppStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    
    try {
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Authentication failed");
      }

      if (isLogin) {
        const data = await res.json();
        setSession(data.token, data.role);
        router.push("/dashboard");
      } else {
        // After register, automatically switch to login
        setIsLogin(true);
        setError("Registration successful! Please log in.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-muted/20 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-6 bg-background p-10 rounded-xl shadow-lg border w-full max-w-md">
        <div className="text-center w-full">
          <h1 className="text-2xl font-bold">Easy Restaurant SPA</h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? "Sign in to your account" : "Register new owner account"}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {error && (
            <div className={`p-3 text-sm rounded-md ${error.includes('successful') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="owner@restaurant.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Register Account")}
          </Button>
        </form>

        <div className="text-center text-sm">
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(""); }} 
            className="text-primary hover:underline"
          >
            {isLogin ? "Need an account? Register here." : "Already have an account? Sign in."}
          </button>
        </div>
      </div>
    </div>
  );
}
