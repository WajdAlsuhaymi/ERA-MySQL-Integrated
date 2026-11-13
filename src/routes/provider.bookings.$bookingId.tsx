import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Protected, PageHeader, EmptyState, StatusPill } from "@/components/era/AppShell";
import { DetailRow } from "@/components/era/ActivityBits";
import { confirmCompletion, formatDate, formatTime, getActivity, getBooking, getUser, type User } from "@/lib/era/store";
import { useEra } from "@/lib/era/use-era";

export const Route = createFileRoute("/provider/bookings/$bookingId")({
  head: () => ({
    meta: [
      { title: "Booking Details — ERA Provider" },
      { name: "description", content: "Review a booking and confirm completion." },
      { property: "og:title", content: "Booking Details — ERA Provider" },
      { property: "og:description", content: "Review a booking and confirm completion." },
    ],
  }),
  component: () => <Protected role="provider">{(u) => <BookingDetails user={u} />}</Protected>,
});

function BookingDetails({ user }: { user: User }) {
  useEra();
  const { bookingId } = Route.useParams();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const b = getBooking(bookingId);
  const a = b && getActivity(b.activityId);
  if (!b || !a || a.providerId !== user.userId)
    return <EmptyState title="Booking not found" text="You can only view bookings for your own activities."><Link to="/provider/bookings" className="btn btn-outline">Bookings</Link></EmptyState>;
  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    const r = await confirmCompletion(user.userId, b.bookingId);
    setMsg(r.ok ? { ok: true, text: "Completion confirmed. A stamp has been added to the customer's passport." } : { ok: false, text: r.error });
    setBusy(false);
  };
  return (
    <div className="mx-auto max-w-xl">
      <Link to="/provider/bookings" className="eyebrow mb-8 inline-block hover:text-primary">← Bookings</Link>
      <PageHeader eyebrow="Booking" title="Booking Details" />
      <div className="panel p-8">
        {msg && <p className={`notice mb-6 ${msg.ok ? "notice-success" : "notice-error"}`} role="status">{msg.text}</p>}
        <dl>
          <DetailRow label="Booking ID" value={<span className="font-mono text-xs">{b.bookingId}</span>} />
          <DetailRow label="Customer" value={getUser(b.customerId)?.fullName ?? "Customer"} />
          <DetailRow label="Activity" value={a.name} />
          <DetailRow label="Location" value={a.location} />
          <DetailRow label="Date" value={formatDate(a.date)} />
          <DetailRow label="Time" value={formatTime(a.time)} />
          <DetailRow label="Status" value={<StatusPill status={b.status} />} />
        </dl>
        {b.status === "Confirmed" ? (
          <button type="button" className="btn btn-primary mt-8 w-full" onClick={confirm} disabled={busy}>Confirm Completion</button>
        ) : (
          <p className="mt-8 text-center text-sm text-muted-foreground">This booking is completed.</p>
        )}
      </div>
    </div>
  );
}
