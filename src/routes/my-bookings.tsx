import { createFileRoute, Link } from "@tanstack/react-router";
import { Protected, EmptyState, PageHeader, StatusPill } from "@/components/era/AppShell";
import { formatDate, formatTime, getActivity, getCustomerBookings, getTicketForBooking, type User } from "@/lib/era/store";
import { useEra } from "@/lib/era/use-era";

export const Route = createFileRoute("/my-bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — ERA" },
      { name: "description", content: "Your ERA bookings and digital tickets." },
      { property: "og:title", content: "My Bookings — ERA" },
      { property: "og:description", content: "Your ERA bookings and digital tickets." },
    ],
  }),
  component: () => <Protected role="customer">{(u) => <MyBookings user={u} />}</Protected>,
});

function MyBookings({ user }: { user: User }) {
  useEra();
  const bookings = getCustomerBookings(user.userId);
  return (
    <>
      <PageHeader eyebrow="Your journeys" title="My Bookings" />
      {bookings.length === 0 ? (
        <EmptyState title="No bookings yet" text="Your reserved experiences will appear here."><Link to="/activities" className="btn btn-primary">Explore Activities</Link></EmptyState>
      ) : (
        <ul className="panel divide-y">
          {bookings.map((b) => {
            const a = getActivity(b.activityId);
            const t = getTicketForBooking(b.bookingId);
            if (!a) return null;
            return (
              <li key={b.bookingId} className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl text-primary">{a.name}</h2>
                    <StatusPill status={b.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDate(a.date)} · {formatTime(a.time)} · {a.location}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to="/booking/$id/confirmation" params={{ id: b.bookingId }} className="btn btn-outline !px-4 !py-2">View Details</Link>
                  {t && <Link to="/tickets/$ticketId" params={{ ticketId: t.ticketId }} className="btn btn-primary !px-4 !py-2">View Ticket</Link>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
