import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Protected, PageHeader, EmptyState } from "@/components/era/AppShell";
import { formatDate, formatTime, getProviderActivities, remaining, softDeleteActivity, type Activity, type User } from "@/lib/era/store";
import { useEra } from "@/lib/era/use-era";

export const Route = createFileRoute("/provider/")({
  head: () => ({
    meta: [
      { title: "Manage Activities — ERA Provider" },
      { name: "description", content: "Manage your ERA heritage experiences." },
      { property: "og:title", content: "Manage Activities — ERA Provider" },
      { property: "og:description", content: "Manage your ERA heritage experiences." },
    ],
  }),
  component: () => <Protected role="provider">{(u) => <Dashboard user={u} />}</Protected>,
});

function Dashboard({ user }: { user: User }) {
  useEra();
  const list = getProviderActivities(user.userId);
  const [toDelete, setToDelete] = useState<Activity | null>(null);
  const [msg, setMsg] = useState("");
  const add = <Link to="/provider/activities/new" className="btn btn-primary">Add New Activity</Link>;
  return (
    <>
      <PageHeader eyebrow="Service Provider" title="Manage Activities">{list.length > 0 && add}</PageHeader>
      {msg && <p className={`notice ${msg.startsWith("Cannot") ? "notice-error" : "notice-success"} mb-6`} role="status">{msg}</p>}
      {list.length === 0 ? (
        <EmptyState title="No activities yet" text="Create your first heritage experience for customers to discover.">{add}</EmptyState>
      ) : (
        <ul className="panel divide-y">
          {list.map((a) => (
            <li key={a.activityId} className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="eyebrow">{a.type}</p>
                <h2 className="mt-1 text-2xl text-primary">{a.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(a.date)} · {formatTime(a.time)} · {remaining(a)} places remaining</p>
              </div>
              <div className="flex gap-2">
                <Link to="/provider/activities/$activityId/edit" params={{ activityId: a.activityId }} className="btn btn-outline !px-4 !py-2">Edit</Link>
                <button type="button" className="btn btn-outline !px-4 !py-2" onClick={() => setToDelete(a)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-5" role="dialog" aria-modal="true" aria-labelledby="del-title" onKeyDown={(e) => e.key === "Escape" && setToDelete(null)}>
          <div className="panel fade-up w-full max-w-md p-8">
            <h2 id="del-title" className="text-3xl text-primary">Delete activity?</h2>
            <p className="mt-3 text-sm text-muted-foreground">“{toDelete.name}” will be removed from Explore and can no longer be booked. Existing bookings, tickets and stamps are kept.</p>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" autoFocus className="btn btn-outline" onClick={() => setToDelete(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={async () => { const r = await softDeleteActivity(user.userId, toDelete.activityId); setMsg(r.ok ? "Activity deleted." : `Cannot delete activity: ${r.error}`); setToDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
