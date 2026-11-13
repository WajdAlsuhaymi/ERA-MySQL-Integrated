import { createFileRoute } from "@tanstack/react-router";
import { Protected, PageHeader } from "@/components/era/AppShell";
import { Logo } from "@/components/era/Logo";
import { ensurePassport, getActivity, getPassportStamps, type User } from "@/lib/era/store";
import { useEra } from "@/lib/era/use-era";

export const Route = createFileRoute("/passport")({
  head: () => ({
    meta: [
      { title: "My Passport — ERA" },
      { name: "description", content: "Your digital heritage passport and collected stamps." },
      { property: "og:title", content: "My Passport — ERA" },
      { property: "og:description", content: "Your digital heritage passport and collected stamps." },
    ],
  }),
  component: () => <Protected role="customer">{(u) => <Passport user={u} />}</Protected>,
});

const TILTS = ["-6deg", "4deg", "-2deg", "7deg", "-4deg", "2deg"];

function Passport({ user }: { user: User }) {
  useEra();
  const passport = ensurePassport(user.userId);
  const stamps = getPassportStamps(passport.passportId);
  return (
    <>
      <PageHeader eyebrow="Digital Activity Passport" title="My Passport" />
      <div className="passport mx-auto max-w-5xl">
        <div className="grid overflow-hidden rounded-lg md:grid-cols-[2fr_3fr]">
          <div className="passport-page passport-spine flex flex-col items-center justify-center gap-6 p-10 text-center">
            <Logo className="h-36 mix-blend-multiply" />
            <div className="rule w-full" />
            <div>
              <p className="eyebrow">Holder</p>
              <p className="mt-1 font-display text-3xl text-primary">{user.fullName}</p>
            </div>
            <div>
              <p className="eyebrow">Passport No.</p>
              <p className="mt-1 font-mono text-xs">{passport.passportId.toUpperCase()}</p>
            </div>
            <p className="text-sm text-muted-foreground">{stamps.length} {stamps.length === 1 ? "stamp" : "stamps"} collected</p>
          </div>
          <div className="passport-page border-t p-8 md:border-l md:border-t-0 md:p-10">
            <p className="eyebrow mb-6 text-center">Stamps</p>
            {stamps.length === 0 ? (
              <div className="flex h-full min-h-60 flex-col items-center justify-center text-center">
                <div className="stamp w-32 opacity-30" style={{ "--tilt": "-6deg" } as React.CSSProperties}><span className="font-display text-2xl">ERA</span></div>
                <p className="mt-8 font-display text-2xl text-primary">Your pages await</p>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">Stamps appear here once your provider confirms you completed an activity.</p>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                {stamps.map((s, i) => {
                  const a = getActivity(s.activityId);
                  return (
                    <li key={s.stampId} className="stamp fade-up" style={{ "--tilt": TILTS[i % TILTS.length] } as React.CSSProperties}>
                      <span className="text-[0.55rem] uppercase tracking-[0.2em]">{a?.destination.split(",")[0]}</span>
                      <span className="mt-1 font-display text-sm leading-tight">{a?.name}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
