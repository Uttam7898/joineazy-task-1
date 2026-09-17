import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ProgressBar } from "../../components/ProgressBar.jsx";

export default function AdminHome() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/analytics/overview", { token }).then(setData);
  }, [token]);

  if (!data) return <p>Loading analytics…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Professor dashboard</h1>
          <p className="mt-2 text-ink/70">Completion across groups, students, and assignments.</p>
        </div>
        <Link className="rounded-full bg-ink px-4 py-2 text-paper" to="/admin/assignments/new">
          New assignment
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Students", data.totals.students],
          ["Groups", data.totals.groups],
          ["Assignments", data.totals.assignments],
          ["Confirmations", data.totals.confirmations],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-ink/10 bg-white/70 p-5">
            <p className="text-sm text-ink/60">{label}</p>
            <p className="mt-1 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-ink/10 bg-white/70 p-6">
        <h2 className="font-display text-2xl">Submission completion by assignment</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byAssignment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" hide />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="percent" fill="#2f5d50" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-3">
          {data.byAssignment.map((a) => (
            <ProgressBar key={a.id} percent={a.percent} label={a.title} />
          ))}
        </div>
      </div>
    </div>
  );
}
