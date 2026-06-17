"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || data.status === "failed") {
        throw new Error(data.message || "Invalid username or password");
      }

      // Success
      login(data.data.token, data.data.user);
      router.push("/editor");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-on-surface">
      <div className="w-full max-w-md bg-surface-container-low p-8 md:p-12 rounded-2xl shadow-lg border border-outline-variant/20">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center rotate-3 soft-shadow">
            <span className="material-symbols-outlined text-on-primary-container text-4xl -rotate-3">
              ink_pen
            </span>
          </div>
        </div>
        
        <h1 className="font-headline text-3xl font-bold text-center mb-2">Creator Studio</h1>
        <p className="text-on-surface-variant text-center mb-8 text-sm">
          Sign in to manage your stories and insights.
        </p>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-lg mb-6 text-sm font-semibold flex items-start gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-on-surface-variant ml-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g. julian"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-on-surface-variant ml-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-primary text-on-primary py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-md transition-all duration-200 flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-xl">autorenew</span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-on-surface-variant/70">
          <p>Kemitbelajar &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
