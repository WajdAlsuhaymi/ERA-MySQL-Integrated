import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AuthSplit } from "@/components/era/AuthSplit";
import { Field } from "@/components/era/AppShell";
import { signup, type Role } from "@/lib/era/store";
import { homeFor, useEra } from "@/lib/era/use-era";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — ERA" },
      { name: "description", content: "Create an ERA account as a customer or service provider." },
      { property: "og:title", content: "Sign Up — ERA" },
      { property: "og:description", content: "Join ERA — Culture · Activities · Experiences." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  useEra();
  const navigate = useNavigate();
  const [f, setF] = useState({ fullName: "", username: "", email: "", password: "", confirm: "", role: "" as Role | "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await signup(f);
    if (!r.ok) {
      setErrors(r.errors);
      setBusy(false);
      return;
    }
    navigate({ to: homeFor(r.data.role), replace: true });
  };

  const input = (k: "fullName" | "username" | "email" | "password" | "confirm", label: string, type = "text", ac?: string) => (
    <Field label={label} id={k} error={errors[k]}>
      <input id={k} type={type} autoComplete={ac} className="field" value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${k}-error` : undefined} required />
    </Field>
  );

  return (
    <AuthSplit>
      <p className="eyebrow mb-3">Join ERA</p>
      <h2 className="text-4xl text-primary">Sign Up</h2>
      <form onSubmit={submit} noValidate className="mt-8 space-y-4">
        {errors.form && <p className="notice notice-error" role="alert">{errors.form}</p>}
        <fieldset>
          <legend className="field-label">Account Type</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["customer", "provider"] as Role[]).map((r) => (
              <label key={r} className={`cursor-pointer rounded border px-3 py-3 text-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${f.role === r ? "border-primary bg-accent text-accent-foreground" : "bg-card hover:border-lavender"}`}>
                <input type="radio" name="role" value={r} checked={f.role === r} onChange={() => setF({ ...f, role: r })} className="sr-only" />
                {r === "customer" ? "Customer" : "Service Provider"}
              </label>
            ))}
          </div>
          {errors.role && <p className="field-error" role="alert">{errors.role}</p>}
        </fieldset>
        {input("fullName", "Full Name", "text", "name")}
        {input("username", "Username", "text", "username")}
        {input("email", "Email", "email", "email")}
        <div className="grid gap-4 sm:grid-cols-2">
          {input("password", "Password", "password", "new-password")}
          {input("confirm", "Confirm Password", "password", "new-password")}
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create Account"}</button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account? <Link to="/login" search={{ redirect: undefined }} className="link-quiet">Log In</Link>
      </p>
      <p className="mt-4 text-xs text-muted-foreground">ERA account data is stored in the MySQL database, not browser localStorage.</p>
    </AuthSplit>
  );
}
