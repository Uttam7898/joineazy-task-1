import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function StudentGroup() {
  const { token, user } = useAuth();
  const [group, setGroup] = useState(null);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    return api("/groups/mine", { token }).then((d) => setGroup(d.group));
  }

  useEffect(() => {
    load();
  }, [token]);

  async function createGroup(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/groups", { method: "POST", token, body: { name } });
      setGroup(data.group);
      setName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function addMember(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const looksLikeEmail = identifier.includes("@");
      const body = looksLikeEmail ? { email: identifier } : { studentId: identifier };
      const data = await api(`/groups/${group.id}/members`, { method: "POST", token, body });
      setGroup(data.group);
      setIdentifier("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId) {
    const data = await api(`/groups/${group.id}/members/${userId}`, { method: "DELETE", token });
    setGroup(data.group);
  }

  const isCreator = group?.createdBy === user.id;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl">My group</h1>
      <p className="mt-2 text-ink/70">Each student can belong to one group. Add teammates by email or student ID.</p>

      {!group && (
        <form onSubmit={createGroup} className="mt-8 rounded-3xl border border-ink/10 bg-white/70 p-6">
          <label className="text-sm font-semibold">Group name</label>
          <input
            className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {error && <p className="mt-2 text-sm text-clay">{error}</p>}
          <button disabled={busy} className="mt-4 rounded-full bg-ink px-4 py-2 text-paper">
            Create group
          </button>
        </form>
      )}

      {group && (
        <div className="mt-8 space-y-6">
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-6">
            <h2 className="font-display text-2xl">{group.name}</h2>
            <ul className="mt-4 divide-y divide-ink/10">
              {group.members.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-ink/60">
                      {m.email} · {m.studentId}
                      {m.id === group.createdBy ? " · creator" : ""}
                    </p>
                  </div>
                  {isCreator && m.id !== user.id && (
                    <button className="text-sm text-clay" onClick={() => removeMember(m.id)}>
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {isCreator && (
            <form onSubmit={addMember} className="rounded-3xl border border-ink/10 bg-white/70 p-6">
              <label className="text-sm font-semibold">Add member by email or student ID</label>
              <input
                className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="diya@uni.edu or STU002"
                required
              />
              {error && <p className="mt-2 text-sm text-clay">{error}</p>}
              <button disabled={busy} className="mt-4 rounded-full bg-moss px-4 py-2 text-white">
                Add member
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
