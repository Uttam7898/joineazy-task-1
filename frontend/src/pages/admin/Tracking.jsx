import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Badge, ProgressBar } from "../../components/ProgressBar.jsx";

export default function AdminTracking() {
  const { token } = useAuth();
  const [overview, setOverview] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api("/analytics/overview", { token }).then(setOverview);
    api("/assignments", { token }).then((d) => setAssignments(d.assignments));
  }, [token]);

  async function loadAssignment(id) {
    const data = await api(`/assignments/${id}`, { token });
    setSelected(data.assignment);
  }

  if (!overview) return <p>Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">Group & student tracking</h1>
      <section className="rounded-3xl border border-ink/10 bg-white/70 p-6">
        <h2 className="font-display text-2xl">Group performance</h2>
        <div className="mt-4 space-y-4">
          {overview.groupPerformance.map((g) => (
            <ProgressBar
              key={g.id}
              percent={g.assigned ? Math.round((g.complete / g.assigned) * 100) : 0}
              label={`${g.name} · ${g.complete}/${g.assigned} assignments fully confirmed`}
            />
          ))}
        </div>
      </section>
      <section className="rounded-3xl border border-ink/10 bg-white/70 p-6">
        <h2 className="font-display text-2xl">Students</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10">
                <th className="py-2">Name</th>
                <th>Student ID</th>
                <th>Group</th>
                <th>Confirmations</th>
              </tr>
            </thead>
            <tbody>
              {overview.students.map((s) => (
                <tr key={s.id} className="border-b border-ink/5">
                  <td className="py-2">{s.name}</td>
                  <td>{s.studentId}</td>
                  <td>{s.groupName || "Ungrouped"}</td>
                  <td>{s.confirmations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="rounded-3xl border border-ink/10 bg-white/70 p-6">
        <h2 className="font-display text-2xl">Assignment-level confirmations</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {assignments.map((a) => (
            <button
              key={a.id}
              className="rounded-full border border-ink/15 px-3 py-1 text-sm"
              onClick={() => loadAssignment(a.id)}
            >
              {a.title}
            </button>
          ))}
        </div>
        {selected && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">{selected.title}</h3>
            {selected.groupProgress?.map((g) => (
              <div key={g.groupId} className="rounded-2xl bg-paper p-4">
                <ProgressBar percent={g.percent} label={g.name} />
                <ul className="mt-3 space-y-1 text-sm">
                  {g.members.map((m) => (
                    <li key={m.id} className="flex justify-between">
                      <span>
                        {m.name} ({m.studentId})
                      </span>
                      <Badge tone={m.confirmed ? "moss" : "ink"}>
                        {m.confirmed ? "Submitted" : "Not confirmed"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
