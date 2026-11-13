import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Protected, PageHeader, EmptyState } from "@/components/era/AppShell";
import { ActivityForm } from "@/components/era/ActivityForm";
import { bookedCount, getActivity, updateActivity, type User } from "@/lib/era/store";
import { useEra } from "@/lib/era/use-era";

export const Route = createFileRoute("/provider/activities/$activityId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Activity — ERA Provider" },
      { name: "description", content: "Edit your ERA heritage experience." },
      { property: "og:title", content: "Edit Activity — ERA Provider" },
      { property: "og:description", content: "Edit your ERA heritage experience." },
    ],
  }),
  component: () => <Protected role="provider">{(u) => <EditActivity user={u} />}</Protected>,
});

function EditActivity({ user }: { user: User }) {
  useEra();
  const { activityId } = Route.useParams();
  const navigate = useNavigate();
  const a = getActivity(activityId);
  if (!a || a.isDeleted || a.providerId !== user.userId)
    return <EmptyState title="Activity not available" text="You can only edit your own active activities."><Link to="/provider" className="btn btn-outline">Manage Activities</Link></EmptyState>;
  const booked = bookedCount(a.activityId);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Edit experience" title="Edit Activity" />
      <ActivityForm
        initial={{ name: a.name, type: a.type, description: a.description, destination: a.destination, location: a.location, date: a.date, time: a.time, availableCapacity: a.availableCapacity }}
        submitLabel="Save Changes"
        hint={booked ? `${booked} ${booked === 1 ? "seat has" : "seats have"} already been booked. Enter REMAINING available seats (zero or more).` : "Enter the number of remaining available seats."}
        onSubmit={async (v) => {
          const r = await updateActivity(user.userId, a.activityId, v);
          if (!r.ok) return r.errors;
          navigate({ to: "/provider" });
          return null;
        }}
      />
    </div>
  );
}
