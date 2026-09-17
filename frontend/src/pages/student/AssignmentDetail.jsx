import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Badge, ProgressBar } from "../../components/ProgressBar.jsx";

export default function AssignmentDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/assignments/${id}`, { token }).then((d) => setAssignment(d.assignment));
  }, [id, token]);

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const data = await api(`/assignments/${id}/confirm`, {
        method: "POST",
        token,
        body: { step: 2, confirmed: true },
      });
      setAssignment(data.assignment);
      setStep(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!assignment) return <p>Loading…</p>;
  const already = assignment.myConfirmation?.confirmed;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-widest text-moss">Assignment</p>
        <h1 className="font-display text-4xl">{assignment.title}</h1>
        <p className="mt-2 text-ink/70">Due {new Date(assignment.dueDate).toLocaleString()}</p>
      </div>
      <p className="text-lg">{assignment.description}</p>
      <a
        className="inline-flex rounded-full bg-moss px-4 py-2 font-semibold text-white"
        href={assignment.onedriveLink}
        target="_blank"
        rel="noreferrer"
      >
        Open OneDrive submission folder
      </a>

      <div className="rounded-3xl border border-ink/10 bg-white/70 p-6">
        <ProgressBar percent={assignment.progress?.percent || 0} label="Group confirmation progress" />
        <ul className="mt-4 space-y-2">
          {assignment.progress?.members?.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <span>{m.name}</span>
              <Badge tone={m.confirmed ? "moss" : "ink"}>{m.confirmed ? "Confirmed" : "Pending"}</Badge>
            </li>
          ))}
        </ul>
      </div>

      {!already && (
        <div className="rounded-3xl border border-clay/30 bg-white p-6">
          <h2 className="font-display text-2xl">Two-step submission confirmation</h2>
          {step === 0 && (
            <button className="mt-4 rounded-full bg-ink px-4 py-2 text-paper" onClick={() => setStep(1)}>
              Yes, I have submitted
            </button>
          )}
          {step === 1 && (
            <div className="mt-4 space-y-3">
              <p>This records that you uploaded the work to OneDrive. Continue only if that is true.</p>
              <div className="flex gap-3">
                <button disabled={busy} className="rounded-full bg-clay px-4 py-2 text-white" onClick={confirm}>
                  Confirm submission
                </button>
                <button className="rounded-full border border-ink/20 px-4 py-2" onClick={() => setStep(0)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-clay">{error}</p>}
        </div>
      )}
      {already && <p className="font-semibold text-moss">You have already confirmed this submission.</p>}
    </div>
  );
}
