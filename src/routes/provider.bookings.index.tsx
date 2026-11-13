import { createFileRoute, Link } from "@tanstack/react-router";
import { Protected, PageHeader, EmptyState, StatusPill } from "@/components/era/AppShell";
import { formatDate, getActivity, getProviderBookings, getUser, type User } from "@/lib/era/store";
import { useEra } from "@/lib/era/use-era";

export const Route = createFileRoute("/provider/bookings/")({
  head: () => ({
    meta: [
      { title: "Bookings — ERA Provider" },
      { name: "description", content: "Bookings for your ERA activities." },
      { property: "og:title", content: "Bookings — ERA Provider" },
      { property: "og:description", content: "Bookings for your ERA activities." },
    ],
  }),
  component: () => <Protected role="provider">{(u) => <Bookings user={u} />}</Protected>,
});

function Bookings({ user }: { user: User }) {
  useEra();
  const list = getProviderBookings(user.userId);
  return (
    <>
      <PageHeader eyebrow="Service Provider" title="Bookings" />
      {list.length === 0 ? (
        <EmptyState title="No bookings yet" text="Bookings for your activities will appear here." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b">
                {["Booking ID", "Customer", "Activity", "Date", "Status", ""].map((h) => <th key={h} className="eyebrow px-6 py-4 font-normal">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((b) => {
                const a = getActivity(b.activityId);
                return (
                  <tr key={b.bookingId}>
                    <td className="px-6 py-4 font-mono text-xs">{b.bookingId}</td>
                    <td className="px-6 py-4">{getUser(b.customerId)?.fullName ?? "Customer"}</td>
                    <td className="px-6 py-4">{a?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{a && formatDate(a.date)}</td>
                    <td className="px-6 py-4"><StatusPill status={b.status} /></td>
                    <td className="px-6 py-4 text-right"><Link to="/provider/bookings/$bookingId" params={{ bookingId: b.bookingId }} className="link-quiet whitespace-nowrap">View Details</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
