import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Protected, PageHeader, EmptyState } from "@/components/era/AppShell";
import { ActivityCard } from "@/components/era/ActivityBits";
import { getActiveActivities } from "@/lib/era/store";
import { useEra } from "@/lib/era/use-era";

export const Route = createFileRoute("/activities/")({
  head: () => ({
    meta: [
      { title: "Explore Activities — ERA" },
      { name: "description", content: "Browse curated cultural experiences at heritage destinations." },
      { property: "og:title", content: "Explore Activities — ERA" },
      { property: "og:description", content: "Browse curated cultural experiences at heritage destinations." },
    ],
  }),
  component: () => <Protected role="customer">{() => <Explore />}</Protected>,
});

function Explore() {
  const { v } = useEra();
  const all = useMemo(() => getActiveActivities(), [v]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [dest, setDest] = useState("All");
  const destinations = useMemo(() => [...new Set(all.map((a) => a.destination))].sort(), [all]);
  const term = q.trim().toLowerCase();
  const list = all.filter(
    (a) =>
      (type === "All" || a.type === type) &&
      (dest === "All" || a.destination === dest) &&
      (!term || [a.name, a.location, a.destination].some((s) => s.toLowerCase().includes(term))),
  );
  const reset = () => { setQ(""); setType("All"); setDest("All"); };

  return (
    <>
      <PageHeader eyebrow="Heritage, lived" title="Explore Activities" />
      <div className="mb-10 grid gap-4 md:grid-cols-[1fr_200px_240px]">
        <div>
          <label htmlFor="search" className="field-label">Search</label>
          <input id="search" type="search" className="field" placeholder="Name, location or destination" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label htmlFor="type" className="field-label">Activity Type</label>
          <select id="type" className="field" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="All">All Types</option>
            <option>Sport</option>
            <option>Wellness</option>
            <option>Entertainment</option>
          </select>
        </div>
        <div>
          <label htmlFor="dest" className="field-label">Destination</label>
          <select id="dest" className="field" value={dest} onChange={(e) => setDest(e.target.value)}>
            <option value="All">All Destinations</option>
            {destinations.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-6 flex justify-end">
        <button type="button" className="btn btn-outline flex items-center gap-2" onClick={reset} title="Reset Filters" aria-label="Reset Filters">
          <span aria-hidden="true">↻</span> Reset
        </button>
      </div>
      {list.length === 0 ? (
        <EmptyState title="No activities found" text="Try a different search or clear the filters." />
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => <ActivityCard key={a.activityId} a={a} />)}
        </div>
      )}
    </>
  );
}
