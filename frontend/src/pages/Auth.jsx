import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("aarav@uni.edu");
  const [password, setPassword] = useState("Student123!");
  const [error, setError] = useState("");

  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const next = await login(email, password);
      navigate(next.role === "admin" ? "/admin" : "/app");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in as a student or professor.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Password" value={password} onChange={setPassword} type="password" />
        {error && <p className="text-sm text-clay">{error}</p>}
        <button className="w-full rounded-xl bg-moss py-2.5 font-medium text-white">Sign in</button>
      </form>
      <p className="mt-4 text-sm text-ink/70">
        New student? <Link className="text-moss underline" to="/register">Create an account</Link>
      </p>
      <DemoAccounts />
    </AuthFrame>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", studentId: "", password: "" });
  const [error, setError] = useState("");

  if (user) return <Navigate to="/app" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthFrame title="Join your cohort" subtitle="Students register here. Professors are provisioned by the studio.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Student ID" value={form.studentId} onChange={(v) => setForm({ ...form, studentId: v })} />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
        />
        {error && <p className="text-sm text-clay">{error}</p>}
        <button className="w-full rounded-xl bg-moss py-2.5 font-medium text-white">Create student account</button>
      </form>
      <p className="mt-4 text-sm text-ink/70">
        Already registered? <Link className="text-moss underline" to="/login">Sign in</Link>
      </p>
    </AuthFrame>
  );
}

function AuthFrame({ title, subtitle, children }) {
  return (
    <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-4 py-10 md:grid-cols-2">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-clay">Joineazy Task 1</p>
        <h1 className="mt-3 font-display text-5xl leading-tight">Groups that actually ship the work.</h1>
        <p className="mt-4 max-w-md text-ink/70">
          Students form teams, open the professor’s OneDrive folder, then confirm the upload. Professors watch
          completion without chasing screenshots.
        </p>
      </div>
      <div className="card p-6">
        <h2 className="font-display text-2xl">{title}</h2>
        <p className="mb-6 text-sm text-ink/60">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-ink/70">{label}</span>
      <input
        className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 outline-none ring-moss/30 focus:ring"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </label>
  );
}

function DemoAccounts() {
  return (
    <div className="mt-6 rounded-xl bg-paper p-3 text-xs text-ink/70">
      <p className="font-medium text-ink">Demo accounts</p>
      <p>Student: aarav@uni.edu / Student123!</p>
      <p>Professor: professor@joineazy.edu / Admin123!</p>
    </div>
  );
}
