import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Protected, PageHeader, Field } from "@/components/era/AppShell";
import { logout, updateProfile, type User } from "@/lib/era/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile Settings — ERA" },
      { name: "description", content: "Manage your ERA profile details." },
      { property: "og:title", content: "Profile Settings — ERA" },
      { property: "og:description", content: "Manage your ERA profile details." },
    ],
  }),
  component: () => <Protected>{(u) => <Profile user={u} />}</Protected>,
});

function Profile({ user }: { user: User }) {
  const navigate = useNavigate();
  const [f, setF] = useState({ fullName: user.fullName, username: user.username, email: user.email });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const r = await updateProfile(user.userId, f);
    if (!r.ok) return setErrors(r.errors);
    setErrors({});
    setSaved(true);
  };
  const keys = [["fullName", "Full Name"], ["username", "Username"], ["email", "Email"]] as const;
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader eyebrow={user.role === "provider" ? "Service Provider" : "Customer"} title="Profile Settings" />
      <form onSubmit={submit} noValidate className="panel space-y-5 p-8">
        {saved && <p className="notice notice-success" role="status">Your changes have been saved.</p>}
        {keys.map(([k, label]) => (
          <Field key={k} label={label} id={k} error={errors[k]}>
            <input id={k} type={k === "email" ? "email" : "text"} className="field" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={!!errors[k]} />
          </Field>
        ))}
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className="btn btn-primary flex-1">Save Changes</button>
          <button type="button" className="btn btn-outline" onClick={async () => { await logout(); navigate({ to: "/login", search: { redirect: undefined } }); }}>Log Out</button>
        </div>
      </form>
    </div>
  );
}
