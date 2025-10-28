"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/app/utils/firebase"; // your initialized auth

// Optional: make the domain configurable
const LOGIN_DOMAIN =
  process.env.NEXT_PUBLIC_LOGIN_DOMAIN?.trim() || "emailingme.com";

// Local helper: credentials + password -> Firebase sign-in
async function loginWithCredentials(credentials: string, password: string) {
  const email = `${credentials}@${LOGIN_DOMAIN}`.toLowerCase().trim();

  const res = await signInWithEmailAndPassword(auth, email, password);
  const token = await res.user.getIdToken();
  // Store token if you still rely on it elsewhere (guards, API calls)
  localStorage.setItem("token", token);
  return res.user;
}

export default function Login() {
  const [credentials, setCredentials] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const firebaseAuth = getAuth();

  // Redirect whenever Firebase auth state becomes logged-in
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) router.push("/admin");
    });
    return () => unsub();
  }, [firebaseAuth, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithCredentials(credentials, password);
      // No manual router.push here; onAuthStateChanged handles the redirect.
    } catch (err: any) {
      const code = err?.code || "";
      const msg =
        code === "auth/invalid-email"
          ? "Invalid credentials."
          : code === "auth/user-disabled"
          ? "Account disabled."
          : code === "auth/user-not-found"
          ? "User not found."
          : code === "auth/wrong-password"
          ? "Incorrect password."
          : err?.message || "Unable to sign in. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative flex min-h-[92vh] w-full items-center justify-center overflow-hidden px-6 py-12 sm:px-10">
      {/* Background (matches your portfolio style) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
        <motion.div
          className="absolute -top-24 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, hsl(var(--primary)/0.22) 0%, transparent 70%)",
          }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 right-10 h-72 w-72 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, hsl(var(--muted-foreground)/0.22) 0%, transparent 70%)",
          }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-md rounded-2xl border bg-card/60 p-6 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/50 sm:p-8"
        aria-label="Sign in form"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Credentials (username) */}
          <div>
            <label
              htmlFor="credentials"
              className="mb-1.5 block text-sm font-medium"
            >
              Username
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="credentials"
                type="text"
                autoComplete="username"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                className="w-full rounded-xl border bg-background/70 px-9 py-2 outline-none ring-offset-background transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder={`yourname (will sign in as yourname@${LOGIN_DOMAIN})`}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border bg-background/70 px-9 py-2 outline-none ring-offset-background transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? (
              "Signing in…"
            ) : (
              <span className="inline-flex items-center hover:cursor-pointer">
                Sign in{" "}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </Button>
        </form>
      </motion.div>
    </section>
  );
}
