import { createFileRoute, Link } from "@tanstack/react-router";
import { Protected, EmptyState } from "@/components/era/AppShell";
import { ActivityImage, DetailRow } from "@/components/era/ActivityBits";
import { formatDate, formatTime, getActivity, remaining } from "@/lib/era/store";
import { useEra } from "@/lib/era/use-era";

export const Route = createFileRoute("/activities/$activityId")({
  head: () => ({
    meta: [
      { title: "Activity Details — ERA" },
      { name: "description", content: "Details for a curated ERA heritage experience." },
      { property: "og:title", content: "Activity Details — ERA" },
      { property: "og:description", content: "Details for a curated ERA heritage experience." },
    ],
  }),
  component: () => <Protected role="customer">{() => <Details />}</Protected>,
});

function Details() {
  useEra();
  const { activityId } = Route.useParams();
  const a = getActivity(activityId);
  if (!a || a.isDeleted)
    return <EmptyState title="Activity unavailable" text="This activity no longer exists or has been removed."><Link to="/activities" className="btn btn-outline">Explore Activities</Link></EmptyState>;
  const left = remaining(a);
  return (
    <>
      <Link to="/activities" className="eyebrow mb-8 inline-block hover:text-primary">← All activities</Link>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="panel aspect-square overflow-hidden"><ActivityImage a={a} /></div>
        <div className="flex flex-col justify-center">
          <p className="eyebrow">{a.type} · {a.destination}</p>
          <h1 className="mt-3 text-4xl leading-tight text-primary md:text-5xl">{a.name}</h1>
          <p className="mt-6 leading-relaxed">{a.description}</p>
          <dl className="mt-8">
            <DetailRow label="Destination" value={a.destination} />
            <DetailRow label="Location" value={a.location} />
            <DetailRow label="Date" value={formatDate(a.date)} />
            <DetailRow label="Time" value={formatTime(a.time)} />
            <DetailRow label="Places remaining" value={left === 0 ? "Fully Booked" : left} />
          </dl>
          {left === 0 ? (
            <button type="button" className="btn btn-primary mt-8" disabled>Fully Booked</button>
          ) : (
            <Link to="/booking/$id/review" params={{ id: a.activityId }} className="btn btn-primary mt-8">Book Now</Link>
          )}
        </div>
      </div>
    </>
  );
}
