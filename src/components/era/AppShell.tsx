import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { useEra, homeFor } from "@/lib/era/use-era";
import { logout, type Role, type User } from "@/lib/era/store";

const NAV: Record<Role, { to: string; label: string }[]> = {
  customer: [
    { to: "/activities", label: "Explore Activities" },
    { to: "/my-bookings", label: "My Bookings" },
    { to: "/passport", label: "My Passport" },
  ],
  provider: [
    { to: "/provider", label: "Manage Activities" },
    { to: "/provider/bookings", label: "Bookings" },
  ],
};

function TopNavbar({ user }: { user: User }) {
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    setMenu(false);
    setMobile(false);
  }, [pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);
  const doLogout = async () => {
    await logout();
    navigate({ to: "/login", search: { redirect: undefined } });
  };
  const items = NAV[user.role];
  const linkCls = "text-[0.78rem] uppercase tracking-[0.16em] py-2 border-b border-transparent text-muted-foreground hover:text-primary transition-colors";
  const active = { className: "!text-primary !border-lavender" };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <Link to={homeFor(user.role)} aria-label="ERA home" className="shrink-0">
          <Logo className="h-16 mix-blend-multiply" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-9 md:flex">
          {items.map((i) => (
            <Link key={i.to} to={i.to} className={linkCls} activeProps={active} activeOptions={{ exact: i.to === "/provider" }}>
              {i.label}
            </Link>
          ))}
          <div className="relative" ref={ref}>
            <button type="button" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:border-lavender">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent font-display text-base text-accent-foreground">{user.fullName.charAt(0).toUpperCase()}</span>
              <span className="max-w-32 truncate">{user.fullName.split(" ")[0]}</span>
            </button>
            {menu && (
              <div role="menu" className="panel fade-up absolute right-0 mt-2 w-52 overflow-hidden py-1 shadow-sm">
                <Link role="menuitem" to="/profile" className="block px-4 py-2.5 text-sm hover:bg-muted">Profile Settings</Link>
                <button role="menuitem" type="button" onClick={doLogout} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-muted">Log Out</button>
              </div>
            )}
          </div>
        </nav>
        <button type="button" className="md:hidden rounded border px-3 py-2 text-xs uppercase tracking-[0.16em]" aria-expanded={mobile} aria-controls="mobile-nav" onClick={() => setMobile((m) => !m)}>
          {mobile ? "Close" : "Menu"}
        </button>
      </div>
      {mobile && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t px-5 pb-4 md:hidden">
          {[...items, { to: "/profile", label: "Profile Settings" }].map((i) => (
            <Link key={i.to} to={i.to} className="block border-b py-3 text-sm" activeProps={{ className: "text-primary" }} activeOptions={{ exact: i.to === "/provider" }}>
              {i.label}
            </Link>
          ))}
          <button type="button" onClick={doLogout} className="block py-3 text-sm">Log Out</button>
        </nav>
      )}
    </header>
  );
}

/** Route guard + layout for authenticated areas. */
export function Protected({ role, children }: { role?: Role; children: (user: User) => ReactNode }) {
  const { ready, user, error } = useEra();
  const pathname = useLocation({ select: (l) => l.pathname });
  const navigate = useNavigate();
  const blocked = ready && (!user || (role && user.role !== role));
  const target = !user ? "/login" : homeFor(user.role);
  useEffect(() => {
    if (!blocked || pathname.startsWith("/login")) return;
    if (target === "/login") navigate({ to: "/login", search: { redirect: pathname }, replace: true });
    else navigate({ to: target, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked, target]);
  if (ready && error) return <div className="mx-auto max-w-2xl p-12" role="alert">Cannot load ERA database: {error}. Check the MySQL server and .env file, then refresh.</div>;
  if (!ready || blocked || !user) return <div className="min-h-screen" aria-busy="true" />;
  return (
    <div className="min-h-screen">
      <TopNavbar user={user} />
      <main className="mx-auto max-w-6xl px-5 py-12 md:py-16 fade-up">{children(user)}</main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-4xl text-primary md:text-5xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="panel px-6 py-16 text-center">
      <p className="font-display text-2xl text-primary">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{text}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill ${status === "Completed" ? "status-completed" : "status-confirmed"}`}>{status}</span>;
}

export function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}
