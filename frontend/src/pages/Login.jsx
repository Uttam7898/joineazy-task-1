import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("aarav@uni.edu");
  const [password, setPassword] = useState("Student123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/auth/login", { method: "POST", body: { email, password } });
      login(data.user, data.token);
      navigate(data.user.role === "admin" ? "/admin" : "/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moss">Joineazy intern task</p>
        <h1 className="mt-3 font-display text-5xl leading-tight">Form groups. Confirm the work. See the board move.</h1>
        <p className="mt-4 max-w-md text-lg text-ink/70">
          Students build their own teams and lock in OneDrive submissions. Professors post assignments and watch group progress in one place.
        </p>
      </div>
      <form onSubmit={onSubmit} className="rounded-3xl border border-ink/10 bg-white/70 p-8 shadow-sm">
        <h2 className="font-display text-2xl">Sign in</h2>
        <label className="mt-6 block text-sm font-semibold">Email</label>
        <input
          className="mt-1 w-full rounded-xl border border-ink/15 bg-paper px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <label className="mt-4 block text-sm font-semibold">Password</label>
        <input
          className="mt-1 w-full rounded-xl border border-ink/15 bg-paper px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />
        {error && <p className="mt-3 text-sm text-clay">{error}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-full bg-ink px-4 py-2.5 font-semibold text-paper">
          {busy ? "Signing in…" : "Enter studio"}
        </button>
        <p className="mt-4 text-sm text-ink/70">
          New student? <Link className="font-semibold text-moss" to="/register">Create an account</Link>
        </p>
        <div className="mt-6 space-y-1 rounded-2xl bg-paper p-4 text-sm">
          <p className="font-semibold">Demo accounts</p>
          <p>Professor: professor@joineazy.edu / Admin123!</p>
          <p>Student: aarav@uni.edu / Student123!</p>
        </div>
      </form>
    </div>
  );
}
