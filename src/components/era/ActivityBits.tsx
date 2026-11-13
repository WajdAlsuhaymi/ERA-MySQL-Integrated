import { Link } from "@tanstack/react-router";
import { formatDate, formatTime, remaining, type Activity } from "@/lib/era/store";
import { cn } from "@/lib/utils";

export function ActivityImage({ a, className }: { a: Activity; className?: string }) {
  if (a.image) return <img src={a.image} alt={a.imageAlt ?? a.name} loading="lazy" className={cn("h-full w-full object-cover", className)} />;
  return (
    <div className={cn("passport-page flex h-full w-full flex-col items-center justify-center p-6 text-center", className)} role="img" aria-label={a.name}>
      <p className="eyebrow">{a.type}</p>
      <p className="mt-2 font-display text-2xl text-primary">{a.destination}</p>
    </div>
  );
}

export function ActivityCard({ a }: { a: Activity }) {
  const left = remaining(a);
  return (
    <article className="panel group flex flex-col overflow-hidden transition-shadow hover:shadow-[0_20px_40px_-30px_var(--plum)]">
      <div className="aspect-square overflow-hidden bg-muted">
        <ActivityImage a={a} className="transition-transform duration-700 group-hover:scale-[1.02]" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="eyebrow">{a.type} · {a.destination}</p>
        <h2 className="mt-2 text-2xl leading-snug text-primary">{a.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{a.location}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed">{a.description}</p>
        <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm">
          <span>{formatDate(a.date)} · {formatTime(a.time)}</span>
          <span className={left === 0 ? "text-destructive" : "text-muted-foreground"}>{left === 0 ? "Fully Booked" : `${left} places left`}</span>
        </div>
        <Link to="/activities/$activityId" params={{ activityId: a.activityId }} className="btn btn-outline mt-5 w-full">View Details</Link>
      </div>
    </article>
  );
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b py-3 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
