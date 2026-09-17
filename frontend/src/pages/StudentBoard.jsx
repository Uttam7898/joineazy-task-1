import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { ProgressBar } from "../Layout";

export function StudentBoard() {
  const [assignments, setAssignments] = useState([]);
  const [group, setGroup] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/assignments"), api("/groups/mine")])
      .then(([a, g]) => {
        setAssignments(a.assignments);
        setGroup(g.group);
      })
      .catch((err) => setError(err.message));
  }, []);

  const avg =
    assignments.length === 0
      ? 0
      : Math.round(assignments.reduce((sum, a) => sum + (a.progress?.percent || 0), 0) / assignments.length);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5 md:col-span-2">
          <p className="text-sm text-ink/60">Your group</p>
          <h1 className="font-display text-3xl">{group ? group.name : "No group yet"}</h1>
          <p className="mt-2 text-ink/70">
            {group
              ? `${group.members.length} member${group.members.length === 1 ? "" : "s"} · confirmations count toward group progress.`
              : "Create a group so you can confirm OneDrive uploads together."}
          </p>
          <Link to="/app/group" className="mt-4 inline-block text-sm text-moss underline">
            Manage group
          </Link>
        </div>
        <div className="card p-5">
          <p className="text-sm text-ink/60">Average group completion</p>
          <p className="mt-2 font-display text-4xl">{avg}%</p>
          <ProgressBar percent={avg} label="Across visible assignments" />
        </div>
      </section>
      {error && <p className="text-clay">{error}</p>}
      <section className="grid gap-4 md:grid-cols-2">
        {assignments.map((a) => (
          <Link key={a.id} to={`/app/assignments/${a.id}`} className="card p-5 hover:border-moss/40">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl">{a.title}</h2>
              {a.progress?.percent === 100 ? (
                <span className="rounded-full bg-moss/15 px-2 py-0.5 text-xs text-moss">Complete</span>
              ) : (
                <span className="rounded-full bg-clay/10 px-2 py-0.5 text-xs text-clay">In progress</span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-ink/70">{a.description}</p>
            <p className="mt-3 text-xs text-ink/50">Due {new Date(a.dueDate).toLocaleString()}</p>
            <div className="mt-3">
              <ProgressBar
                percent={a.progress?.percent || 0}
                label={`${a.progress?.confirmed || 0}/${a.progress?.total || 0} confirmed`}
              />
            </div>
          </Link>
        ))}
        {assignments.length === 0 && <p className="text-ink/60">No assignments posted yet.</p>}
      </section>
    </div>
  );
}
