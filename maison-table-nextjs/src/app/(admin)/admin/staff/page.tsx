"use client";
import { useState, useEffect, useCallback } from "react";
import { UserCog, Plus, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StaffMember = { _id: string; name: string; email: string; phone?: string; role: string; active: boolean; createdAt: string };

export default function StaffPage() {
  const [staff,    setStaff]    = useState<StaffMember[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ name:"", email:"", password:"", phone:"", role:"staff" });
  const [showPwd,  setShowPwd]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/staff", { credentials:"include" });
      if (res.ok) setStaff(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError("Name, email and password required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/v1/admin/staff", {
      method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    toast.success(`${form.name} account created`);
    setForm({ name:"", email:"", password:"", phone:"", role:"staff" });
    setShowForm(false);
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    const res = await fetch(`/api/v1/admin/staff/${id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"}, credentials:"include",
      body: JSON.stringify({ active: !active }),
    });
    if (res.ok) { toast.success("Updated"); load(); }
    else toast.error("Failed to update");
  };

  const ROLE_LABEL: Record<string, string> = { staff:"Kitchen Staff", admin:"Admin", superadmin:"Super Admin" };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <UserCog className="size-6 text-blue-600"/>
          <h1 className="text-2xl font-semibold">Staff</h1>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{staff.length}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="grid size-9 place-items-center rounded-lg border border-border hover:bg-muted">
            <RefreshCw className={cn("size-4", loading && "animate-spin")}/>
          </button>
          <Button variant="hero" className="gap-2" onClick={() => setShowForm(v => !v)}>
            <Plus className="size-4"/> Add staff
          </Button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={create} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">New staff account</h2>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Full name *</label>
              <Input value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="h-10" placeholder="e.g. Ahmed Ali"/>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Email *</label>
              <Input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} className="h-10"/>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Password *</label>
              <div className="relative">
                <Input type={showPwd?"text":"password"} value={form.password} onChange={e => setForm({...form,password:e.target.value})} className="h-10 pr-9"/>
                <button type="button" onClick={() => setShowPwd(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPwd ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Role</label>
              <select value={form.role} onChange={e => setForm({...form,role:e.target.value})}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="staff">Kitchen Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="hero" disabled={saving}>{saving?"Creating…":"Create account"}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {["Name","Email","Role","Status","Created",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.length === 0 && !loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No staff yet.</td></tr>
            )}
            {staff.map(s => (
              <tr key={s._id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
                    {ROLE_LABEL[s.role] ?? s.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    s.active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground")}>
                    {s.active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => toggle(s._id, s.active)}>
                    {s.active ? "Disable" : "Enable"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
