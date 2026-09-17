import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", studentId: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/auth/register", { method: "POST", body: form });
      login(data.user, data.token);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl">Join as a student</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {[
          ["name", "Full name", "text"],
          ["email", "Email", "email"],
          ["studentId", "Student ID", "text"],
          ["password", "Password (8+ characters)", "password"],
        ].map(([key, label, type]) => (
          <div key={key}>
            <label className="text-sm font-semibold">{label}</label>
            <input
              className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2"
              type={type}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              required
            />
          </div>
        ))}
        {error && <p className="text-sm text-clay">{error}</p>}
        <button disabled={busy} className="w-full rounded-full bg-ink px-4 py-2.5 font-semibold text-paper">
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already registered? <Link className="font-semibold text-moss" to="/login">Sign in</Link>
      </p>
    </div>
  );
}
