import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Field } from "./AppShell";
import type { ActivityInput } from "@/lib/era/store";

export const emptyActivity: ActivityInput = { name: "", type: "" as never, description: "", destination: "", location: "", date: "", time: "", availableCapacity: "" };

export function ActivityForm({ initial, submitLabel, onSubmit, hint }: { initial: ActivityInput; submitLabel: string; hint?: string; onSubmit: (v: ActivityInput) => Promise<Record<string, string> | null> | Record<string, string> | null }) {
  const [f, setF] = useState<ActivityInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const errs = await onSubmit(f);
      if (errs) setErrors(errs);
    } catch { setErrors({form:"Cannot save activity right now."}); }
    finally { setBusy(false); }
  };
  const bind = (k: keyof ActivityInput) => ({
    id: k, className: "field", value: String(f[k]), "aria-invalid": !!errors[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }),
  });
  return (
    <form onSubmit={submit} noValidate className="panel space-y-5 p-8">
      {errors.form && <p className="notice notice-error" role="alert">{errors.form}</p>}
      <Field label="Activity Name" id="name" error={errors.name}><input {...bind("name")} /></Field>
      <Field label="Activity Type" id="type" error={errors.type}>
        <select {...bind("type")}>
          <option value="">Select a type</option>
          <option>Sport</option><option>Wellness</option><option>Entertainment</option>
        </select>
      </Field>
      <Field label="Description" id="description" error={errors.description}><textarea rows={4} {...bind("description")} /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Destination" id="destination" error={errors.destination}><input placeholder="City, Country" {...bind("destination")} /></Field>
        <Field label="Location" id="location" error={errors.location}><input {...bind("location")} /></Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Date" id="date" error={errors.date}><input type="date" {...bind("date")} /></Field>
        <Field label="Time" id="time" error={errors.time}><input type="time" {...bind("time")} /></Field>
        <Field label="Available Capacity" id="availableCapacity" error={errors.availableCapacity}><input type="number" min={submitLabel === "Save Activity" ? 1 : 0} step={1} {...bind("availableCapacity")} /></Field>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link to="/provider" className="btn btn-outline">Cancel</Link>
        <button type="submit" className="btn btn-primary flex-1" disabled={busy}>{submitLabel}</button>
      </div>
    </form>
  );
}
