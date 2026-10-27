"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverErr, setServerErr] = useState("");

  const schema = z.object({
    name:     mode === "register" ? z.string().trim().min(2, "Enter your name").max(80) : z.string(),
    email:    z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(6, "At least 6 characters").max(100),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerErr("");
    const r = schema.safeParse(f);
    if (!r.success) {
      const o: Record<string, string> = {};
      r.error.issues.forEach((i) => (o[String(i.path[0])] = i.message));
      setErr(o);
      return;
    }
    setLoading(true);

    if (mode === "register") {
      // 1. Create account in MongoDB
      const res = await fetch("/api/v1/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: f.name.trim(), email: f.email.trim(), password: f.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerErr(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }
      // 2. Sign in automatically after registration
      const result = await signIn("credentials", {
        email:    f.email.trim().toLowerCase(),
        password: f.password,
        redirect: false,
      });
      setLoading(false);
      if (result?.error) {
        setServerErr("Account created but sign-in failed. Please sign in manually.");
        router.push("/login");
        return;
      }
      toast.success(`Welcome, ${f.name.trim()}! Your account is ready.`);
      router.push("/account");
      router.refresh();
    } else {
      // Login flow
      const result = await signIn("credentials", {
        email:    f.email.trim().toLowerCase(),
        password: f.password,
        redirect: false,
      });
      setLoading(false);
      if (result?.error) {
        setServerErr("Invalid email or password.");
        return;
      }
      toast.success("Welcome back!");
      router.push("/account");
      router.refresh();
    }
  };

  const field = (
    k: keyof typeof f,
    label: string,
    type: string,
    ac?: string,
    extra?: React.ReactNode,
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={k} className="block text-sm font-medium">{label}</label>
      <div className="relative">
        <Input
          id={k}
          type={type}
          autoComplete={ac}
          value={f[k]}
          onChange={(e) => { setF({ ...f, [k]: e.target.value }); setErr((p) => ({ ...p, [k]: "" })); }}
          aria-invalid={!!err[k]}
          aria-describedby={err[k] ? `${k}-err` : undefined}
          className="h-12 bg-background pr-10"
        />
        {extra}
      </div>
      {err[k] && (
        <p id={`${k}-err`} className="text-xs text-destructive" role="alert">{err[k]}</p>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-md">
      <form onSubmit={submit} noValidate className="space-y-5 rounded-3xl border border-border bg-card p-8 shadow-soft">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-medium">
            {mode === "login" ? "Welcome back" : "Join the table"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to track orders and save your details."
              : "Create an account to start ordering."}
          </p>
        </div>

        {serverErr && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverErr}
          </div>
        )}

        {mode === "register" && field("name", "Full name", "text", "name")}
        {field("email", "Email address", "email", "email")}
        {field(
          "password",
          "Password",
          showPwd ? "text" : "password",
          mode === "login" ? "current-password" : "new-password",
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>,
        )}

        <Button type="submit" variant="hero" className="h-12 w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              {mode === "login" ? "Signing in…" : "Creating account…"}
            </span>
          ) : (
            mode === "login" ? "Sign in" : "Create account"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>New here?{" "}<Link href="/register" className="font-semibold text-terracotta hover:underline">Create an account</Link></>
          ) : (
            <>Already have an account?{" "}<Link href="/login" className="font-semibold text-terracotta hover:underline">Sign in</Link></>
          )}
        </p>
      </form>
    </div>
  );
}
