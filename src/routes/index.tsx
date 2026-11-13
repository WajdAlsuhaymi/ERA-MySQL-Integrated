import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useEra, homeFor } from "@/lib/era/use-era";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ERA — Culture · Activities · Experiences" },
      { name: "description", content: "Discover and book unique cultural experiences that bring heritage to life." },
      { property: "og:title", content: "ERA — Culture · Activities · Experiences" },
      { property: "og:description", content: "Discover and book unique cultural experiences that bring heritage to life." },
    ],
  }),
  component: Index,
});

function Index() {
  const { ready, user } = useEra();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready) navigate({ to: user ? homeFor(user.role) : "/login", replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.role]);
  return <div className="min-h-screen" />;
}
