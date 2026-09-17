import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Badge, ProgressBar } from "../../components/ProgressBar.jsx";

export default function StudentHome() {
  const { token, user } = useAuth();
  const [group, setGroup] = useState(null);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    api("/groups/mine", { token }).then((d) => setGroup(d.group));
    api("/assignments", { token }).then((d) => setAssignments(d.assignments));
  }, [token]);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm uppercase tracking-widest text-moss">Welcome back</p>
        <h1 className="font-display text-4xl">{user.name}</h1>
        <p className="mt-2 text-ink/70">
          {group ? `You are in ${group.name}.` : "Create or wait to be added to a group to confirm submissions."}
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-ink/10 bg-white/70 p-6">
          <h2 className="font-display text-2xl">Your group</h2>
          {group ? (
            <>
              <p className="mt-2 text-lg">{group.name}</p>
              <p className="text-sm text-ink/60">{group.members.length} members</p>
              <Link className="mt-4 inline-block font-semibold text-moss" to="/app/group">
                Manage members →
              </Link>
            </>
          ) : (
            <Link className="mt-4 inline-block rounded-full bg-ink px-4 py-2 text-paper" to="/app/group">
              Start a group
            </Link>
          )}
        </div>
        <div className="rounded-3xl border border-ink/10 bg-white/70 p-6">
          <h2 className="font-display text-2xl">Open work</h2>
          <p className="mt-2 text-3xl font-semibold">{assignments.length}</p>
          <p className="text-sm text-ink/60">assignments visible to you</p>
        </div>
      </div>
      <section className="space-y-4">
        <h2 className="font-display text-2xl">Progress</h2>
        {assignments.map((a) => (
          <Link
            key={a.id}
            to={`/app/assignments/${a.id}`}
            className="block rounded-2xl border border-ink/10 bg-white/70 p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-semibold">{a.title}</p>
              <Badge tone={a.progress?.percent === 100 ? "moss" : "clay"}>
                {a.progress?.percent === 100 ? "Complete" : "In progress"}
              </Badge>
            </div>
            <ProgressBar percent={a.progress?.percent || 0} label="Group confirmations" />
          </Link>
        ))}
      </section>
    </div>
  );
}
