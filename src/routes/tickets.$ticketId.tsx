import { createFileRoute, Link } from "@tanstack/react-router";
import { Protected, EmptyState, StatusPill } from "@/components/era/AppShell";
import { Logo } from "@/components/era/Logo";
import { formatDate, formatTime, getActivity, getBooking, getTicket, type User } from "@/lib/era/store";
import { useEra } from "@/lib/era/use-era";

export const Route = createFileRoute("/tickets/$ticketId")({
  head: () => ({
    meta: [
      { title: "Digital Ticket — ERA" },
      { name: "description", content: "Your ERA heritage ticket." },
      { property: "og:title", content: "Digital Ticket — ERA" },
      { property: "og:description", content: "Your ERA heritage ticket." },
    ],
  }),
  component: () => <Protected role="customer">{(u) => <Ticket user={u} />}</Protected>,
});

function Ticket({ user }: { user: User }) {
  useEra();
  const { ticketId } = Route.useParams();
  const t = getTicket(ticketId);
  const b = t && getBooking(t.bookingId);
  const a = b && getActivity(b.activityId);
  if (!t || !b || !a || b.customerId !== user.userId)
    return <EmptyState title="Ticket not found" text="This ticket doesn't exist or belongs to another account."><Link to="/my-bookings" className="btn btn-outline">My Bookings</Link></EmptyState>;

  const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div><p className="eyebrow">{label}</p><p className="mt-1 font-display text-xl text-foreground">{value}</p></div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/my-bookings" className="eyebrow mb-8 inline-block hover:text-primary">← My Bookings</Link>
      <div className="ticket grid overflow-hidden md:grid-cols-[1fr_220px]">
        <div className="p-10">
          <div className="flex items-center justify-between gap-4">
            <p className="eyebrow">Heritage Admission</p>
            <StatusPill status={b.status} />
          </div>
          <h1 className="mt-4 text-4xl leading-tight text-primary">{a.name}</h1>
          <div className="rule my-8" />
          <div className="grid gap-6 sm:grid-cols-2">
            <Item label="Guest" value={user.fullName} />
            <Item label="Location" value={a.location} />
            <Item label="Date" value={formatDate(a.date)} />
            <Item label="Time" value={formatTime(a.time)} />
          </div>
        </div>
        <div className="ticket-perf relative flex flex-col items-center justify-center gap-6 bg-secondary p-8 text-center max-md:border-l-0 max-md:border-t-2 max-md:border-dashed">
          <span className="ticket-notch -top-[14px] -left-[14px] max-md:hidden" />
          <span className="ticket-notch -bottom-[14px] -left-[14px] max-md:hidden" />
          <Logo className="h-28 mix-blend-multiply" />
          <div>
            <p className="eyebrow">Digital Ticket</p>
            <p className="mt-1 font-mono text-sm text-primary">{t.ticketId}</p>
            <p className="eyebrow mt-4">Booking</p>
            <p className="mt-1 font-mono text-xs">{b.bookingId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
