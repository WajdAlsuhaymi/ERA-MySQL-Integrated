import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Protected, EmptyState, PageHeader } from "@/components/era/AppShell";
import { DetailRow } from "@/components/era/ActivityBits";
import { createBooking, formatDate, formatTime, getActivity, remaining, type User } from "@/lib/era/store";
import { useEra } from "@/lib/era/use-era";

export const Route = createFileRoute("/booking/$id/review")({
  head: () => ({
    meta: [
      { title: "Review Booking — ERA" },
      { name: "description", content: "Review your ERA booking before confirming." },
      { property: "og:title", content: "Review Booking — ERA" },
      { property: "og:description", content: "Review your ERA booking before confirming." },
    ],
  }),
  component: () => <Protected role="customer">{(u) => <Review user={u} />}</Protected>,
});

function Review({ user }: { user: User }) {
  useEra();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const a = getActivity(id);
  if (!a || a.isDeleted)
    return <EmptyState title="Activity unavailable" text="This activity can no longer be booked."><Link to="/activities" className="btn btn-outline">Explore Activities</Link></EmptyState>;
  const full = remaining(a) === 0;

  const confirm = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    const r = await createBooking(user.userId, a.activityId);
    if (!r.ok) {
      setError(r.error);
      setBusy(false);
      lock.current = false;
      return;
    }
    navigate({ to: "/booking/$id/confirmation", params: { id: r.data.booking.bookingId }, replace: true });
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader eyebrow="Step 2 of 3" title="Booking Details" />
      <div className="panel p-8">
        <dl>
          <DetailRow label="Activity" value={a.name} />
          <DetailRow label="Location" value={a.location} />
          <DetailRow label="Date" value={formatDate(a.date)} />
          <DetailRow label="Time" value={formatTime(a.time)} />
          <DetailRow label="Customer" value={user.fullName} />
          <DetailRow label="Participants" value="1" />
        </dl>
        {error && <p className="notice notice-error mt-6" role="alert">{error}</p>}
        {full && !error && <p className="notice notice-error mt-6" role="alert">This activity is fully booked.</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/activities/$activityId" params={{ activityId: a.activityId }} className="btn btn-outline">Back</Link>
          <button type="button" className="btn btn-primary flex-1" onClick={confirm} disabled={busy || full}>{busy ? "Confirming…" : "Confirm Booking"}</button>
        </div>
      </div>
    </div>
  );
}
