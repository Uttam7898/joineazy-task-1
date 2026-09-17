import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AssignmentForm() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    onedriveLink: "",
    targetAll: true,
    groupIds: [],
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/groups", { token }).then((d) => setGroups(d.groups));
  }, [token]);

  useEffect(() => {
    if (!editing) return;
    api(`/assignments/${id}`, { token }).then((d) => {
      const a = d.assignment;
      setForm({
        title: a.title,
        description: a.description || "",
        dueDate: a.dueDate
          ? new Date(new Date(a.dueDate).getTime() - new Date(a.dueDate).getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)
          : "",
        onedriveLink: a.onedriveLink,
        targetAll: a.targetAll,
        groupIds: a.targetGroups.map((g) => g.id),
      });
    });
  }, [editing, id, token]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleGroup(gid) {
    setForm((f) => ({
      ...f,
      groupIds: f.groupIds.includes(gid) ? f.groupIds.filter((x) => x !== gid) : [...f.groupIds, gid],
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = {
        ...form,
        dueDate: new Date(form.dueDate).toISOString(),
      };
      if (editing) {
        await api(`/assignments/${id}`, { method: "PUT", token, body });
      } else {
        await api("/assignments", { method: "POST", token, body });
      }
      navigate("/admin/assignments");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <h1 className="font-display text-4xl">{editing ? "Edit assignment" : "New assignment"}</h1>
      <label className="block text-sm font-semibold">Title</label>
      <input className="w-full rounded-xl border px-3 py-2" value={form.title} onChange={(e) => set("title", e.target.value)} required />
      <label className="block text-sm font-semibold">Description</label>
      <textarea className="w-full rounded-xl border px-3 py-2" rows="4" value={form.description} onChange={(e) => set("description", e.target.value)} />
      <label className="block text-sm font-semibold">Due date</label>
      <input className="w-full rounded-xl border px-3 py-2" type="datetime-local" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} required />
      <label className="block text-sm font-semibold">OneDrive submission link</label>
      <input className="w-full rounded-xl border px-3 py-2" value={form.onedriveLink} onChange={(e) => set("onedriveLink", e.target.value)} required />
      <fieldset className="rounded-2xl border border-ink/10 p-4">
        <legend className="px-1 text-sm font-semibold">Assign to</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.targetAll} onChange={(e) => set("targetAll", e.target.checked)} />
          All groups
        </label>
        {!form.targetAll && (
          <div className="mt-3 space-y-2">
            {groups.map((g) => (
              <label key={g.id} className="flex items-center gap-2">
                <input type="checkbox" checked={form.groupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} />
                {g.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>
      {error && <p className="text-sm text-clay">{error}</p>}
      <button disabled={busy} className="rounded-full bg-ink px-4 py-2 text-paper">
        {busy ? "Saving…" : "Save assignment"}
      </button>
    </form>
  );
}
