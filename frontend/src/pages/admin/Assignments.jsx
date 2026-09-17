import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Badge } from "../../components/ProgressBar.jsx";

export default function AdminAssignments() {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    api("/assignments", { token }).then((d) => setAssignments(d.assignments));
  }, [token]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Assignments</h1>
        <Link className="rounded-full bg-ink px-4 py-2 text-paper" to="/admin/assignments/new">
          Create
        </Link>
      </div>
      <div className="mt-8 space-y-4">
        {assignments.map((a) => (
          <div key={a.id} className="rounded-3xl border border-ink/10 bg-white/70 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{a.title}</h2>
                <p className="text-sm text-ink/60">Due {new Date(a.dueDate).toLocaleString()}</p>
              </div>
              <Badge>{a.targetAll ? "All groups" : `${a.targetGroups.length} group(s)`}</Badge>
            </div>
            <p className="mt-3">{a.description}</p>
            <a className="mt-2 inline-block text-sm font-semibold text-moss" href={a.onedriveLink} target="_blank" rel="noreferrer">
              OneDrive link
            </a>
            <div className="mt-4">
              <Link className="font-semibold" to={`/admin/assignments/${a.id}/edit`}>
                Edit →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
