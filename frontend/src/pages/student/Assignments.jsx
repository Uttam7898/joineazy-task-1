import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Badge, ProgressBar } from "../../components/ProgressBar.jsx";

export default function StudentAssignments() {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    api("/assignments", { token }).then((d) => setAssignments(d.assignments));
  }, [token]);

  return (
    <div>
      <h1 className="font-display text-4xl">Assignments</h1>
      <p className="mt-2 text-ink/70">Open the OneDrive folder, upload your work, then confirm as a group.</p>
      <div className="mt-8 grid gap-4">
        {assignments.map((a) => (
          <Link
            key={a.id}
            to={`/app/assignments/${a.id}`}
            className="rounded-3xl border border-ink/10 bg-white/70 p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{a.title}</h2>
                <p className="text-sm text-ink/60">Due {new Date(a.dueDate).toLocaleString()}</p>
              </div>
              <Badge tone={a.myConfirmation?.confirmed ? "moss" : "ink"}>
                {a.myConfirmation?.confirmed ? "You confirmed" : "Needs your confirmation"}
              </Badge>
            </div>
            <p className="mt-3 text-ink/80">{a.description}</p>
            <div className="mt-4">
              <ProgressBar percent={a.progress?.percent || 0} label="Group progress" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
