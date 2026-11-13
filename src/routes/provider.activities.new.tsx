import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Protected, PageHeader } from "@/components/era/AppShell";
import { ActivityForm, emptyActivity } from "@/components/era/ActivityForm";
import { createActivity, type User } from "@/lib/era/store";

export const Route = createFileRoute("/provider/activities/new")({
  head: () => ({
    meta: [
      { title: "Add Activity — ERA Provider" },
      { name: "description", content: "Create a new ERA heritage experience." },
      { property: "og:title", content: "Add Activity — ERA Provider" },
      { property: "og:description", content: "Create a new ERA heritage experience." },
    ],
  }),
  component: () => <Protected role="provider">{(u) => <AddActivity user={u} />}</Protected>,
});

function AddActivity({ user }: { user: User }) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="New experience" title="Add Activity" />
      <ActivityForm
        initial={emptyActivity}
        submitLabel="Save Activity"
        onSubmit={async (v) => {
          const r = await createActivity(user.userId, v);
          if (!r.ok) return r.errors;
          navigate({ to: "/provider" });
          return null;
        }}
      />
    </div>
  );
}
