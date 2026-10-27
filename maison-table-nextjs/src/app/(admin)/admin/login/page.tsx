"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChefHat, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("admin@maisontable.example");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Enter your email and password"); return; }
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      // Role-based redirect — fetch session to check role
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;
      if (role === "rider") {
        router.push("/rider");
      } else if (role === "staff") {
        router.push("/admin/kitchen");
      } else {
        router.push("/admin/dashboard");
      }
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sidebar px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-sidebar-primary">
          <ChefHat className="size-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sidebar-foreground">{BRAND.name}</p>
          <p className="text-xs text-sidebar-foreground/50">Restaurant Operations</p>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold" />
          <p className="text-sidebar-foreground/70">
            <b className="text-sidebar-foreground">Secure login.</b> Use your staff credentials.
            First-time setup: run <code className="rounded bg-muted px-1">npm run seed</code>.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-sidebar-border bg-card p-8 shadow-soft">
          <div>
            <h1 className="text-xl font-semibold">Staff sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Admin · Kitchen Staff · Rider — all sign in here</p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="h-11" autoComplete="email" autoFocus />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <div className="relative">
              <Input id="password" type={showPwd ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)} className="h-11 pr-10"
                autoComplete="current-password" />
              <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Signing in…
              </span>
            ) : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
