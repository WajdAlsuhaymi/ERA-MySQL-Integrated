import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./Logo";

const hero = "/واحة الغروب وقصبة الصحراء.png";

const INTRO_KEY = "era_intro_seen";

/** Split auth layout. With `intro`, the heritage image first fills the screen then slides to the right half (once per session). */
export function AuthSplit({ children, intro = false }: { children: ReactNode; intro?: boolean }) {
  const [phase, setPhase] = useState<"pending" | "full" | "revealed">("pending");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(INTRO_KEY) === "1";
    if (!intro || seen || reduced) {
      setPhase("revealed");
      sessionStorage.setItem(INTRO_KEY, "1");
      return;
    }
    setPhase("full");
    setAnimate(true);
    const t = window.setTimeout(() => {
      setPhase("revealed");
      sessionStorage.setItem(INTRO_KEY, "1");
    }, 1000);
    return () => window.clearTimeout(t);
  }, [intro]);

  const revealed = phase === "revealed";

  return (
    <div
      className={`relative flex min-h-screen flex-col-reverse lg:block ${revealed ? "intro-revealed" : ""} ${phase === "pending" ? "opacity-0" : ""}`}
      style={animate ? undefined : ({ "--no": 1 } as React.CSSProperties)}
    >
      <section className={`intro-form relative z-10 flex w-full items-center justify-center bg-background px-6 py-12 lg:min-h-screen lg:w-1/2 ${animate ? "" : "!transition-none"}`}>
        <div className="w-full max-w-sm">{children}</div>
      </section>

      <aside className={`intro-image z-20 h-[46vh] overflow-hidden lg:h-auto ${animate ? "" : "!transition-none"}`} aria-label="ERA heritage">
        <img src={hero} alt="Sunset over a desert oasis and ancient mud-brick kasbah, viewed from a heritage terrace" className="absolute inset-0 h-full w-full object-cover" />
        <div className="intro-shade absolute inset-0" />
        <div className="relative flex h-full flex-col items-center justify-between px-6 py-8 text-center lg:py-14">
         <div className="px-4 py-3">
            <Logo className="h-20 lg:h-28" />
          </div>
          <div className="intro-copy max-w-xl pb-2">
            <h1 className="text-3xl leading-tight md:text-4xl xl:text-5xl">Where Heritage Becomes an Experience</h1>
            <p className="mx-auto mt-4 max-w-md text-sm md:text-base">Discover and book unique cultural experiences that bring heritage to life.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
