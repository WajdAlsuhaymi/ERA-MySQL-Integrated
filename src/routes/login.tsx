import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AuthSplit } from "@/components/era/AuthSplit";
import { Field } from "@/components/era/AppShell";
import { login } from "@/lib/era/store";
import { homeFor, safeRedirect, useEra } from "@/lib/era/use-era";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({
    meta: [
      { title: "Log In — ERA" },
      { name: "description", content: "Log in to ERA to discover and book cultural experiences at heritage destinations." },
      { property: "og:title", content: "Log In — ERA" },
      { property: "og:description", content: "Where Heritage Becomes an Experience." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  useEra();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!identifier.trim()) errs.identifier = "Please enter your email or username.";
    if (!password) errs.password = "Please enter your password.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const r = await login(identifier, password);
    if (!r.ok) {
      setErrors({ form: r.error });
      setBusy(false);
      return;
    }
    const target = safeRedirect(redirect);
    const home = homeFor(r.data.role);
    const allowed = target && (r.data.role === "provider" ? target.startsWith("/provider") || target === "/profile" : !target.startsWith("/provider"));
    navigate({ to: allowed ? target! : home, replace: true });
  };

  return (
    <AuthSplit intro>
      <p className="eyebrow mb-3">Welcome back</p>
      <h2 className="text-4xl text-primary">Log In</h2>
      <p className="mt-2 text-sm text-muted-foreground">Continue your journey through living heritage.</p>
      <form onSubmit={submit} noValidate className="mt-9 space-y-5">
        {errors.form && <p className="notice notice-error" role="alert">{errors.form}</p>}
        <Field label="Email or Username" id="identifier" error={errors.identifier}>
          <input id="identifier" className="field" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} aria-invalid={!!errors.identifier} aria-describedby={errors.identifier ? "identifier-error" : undefined} required />
        </Field>
        <Field label="Password" id="password" error={errors.password}>
          <input id="password" type="password" className="field" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} required />
        </Field>
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? "Logging in…" : "Log In"}</button>
      </form>
      <p className="mt-8 text-sm text-muted-foreground">
        New to ERA? <Link to="/signup" className="link-quiet">Sign Up</Link>
      </p>
      <div className="mt-10 border-t pt-5 text-xs leading-relaxed text-muted-foreground">
        <p className="eyebrow mb-2">Demo accounts</p>
        <p>Customer: customer@era.demo · demo1234</p>
        <p>Provider: provider@era.demo · demo1234</p>
      </div>
    </AuthSplit>
  );
}
