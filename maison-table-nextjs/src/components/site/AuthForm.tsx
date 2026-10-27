"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sessionStore } from "@/lib/store";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    name: mode === "register" ? z.string().trim().min(2, "Enter your name").max(80) : z.string(),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(6, "At least 6 characters").max(100),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) {
      const o: Record<string, string> = {};
      r.error.issues.forEach((i) => (o[String(i.path[0])] = i.message));
      setErr(o);
      return;
    }
    setLoading(true);
    // Simulate a short async delay for realism
    setTimeout(() => {
      const name = f.name.trim() || f.email.split("@")[0]!;
      sessionStore.set((s) => ({ ...s, customer: { name, email: f.email.trim() } }));
      toast.success(mode === "login" ? `Welcome back, ${name}!` : `Account created. Welcome, ${name}!`);
      router.push("/account");
    }, 600);
  };

  const field = (
    k: keyof typeof f,
    label: string,
    type: string,
    ac?: string,
    extra?: React.ReactNode,
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={k} className="block text-sm font-medium">
        {label}
      </label>
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
        <p id={`${k}-err`} className="text-xs text-destructive" role="alert">
          {err[k]}
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-md">
      {/* Demo notice */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
        <ShieldAlert className="size-4 shrink-0 mt-0.5 text-gold" />
        <p className="text-muted-foreground">
          <b className="text-foreground">Demo mode:</b> No real account is created. Your details are stored only in this browser. Passwords are never saved.
        </p>
      </div>

      <form
        onSubmit={submit}
        noValidate
        className="space-y-5 rounded-3xl border border-border bg-card p-8 shadow-soft"
      >
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-medium">
            {mode === "login" ? "Welcome back" : "Join the table"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to track orders and save your details."
              : "Create a demo account to start ordering."}
          </p>
        </div>

        {mode === "register" &&
          field("name", "Full name", "text", "name")}

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

        <Button
          type="submit"
          variant="hero"
          className="h-12 w-full"
          disabled={loading}
        >
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
            <>
              New here?{" "}
              <Link href="/register" className="font-semibold text-terracotta hover:underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-terracotta hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
