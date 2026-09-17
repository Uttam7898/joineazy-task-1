import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function Protected({ role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-ink/60">Loading studio…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;
  }
  return <Outlet />;
}

export function Shell() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const links = isAdmin
    ? [
        ["/admin", "Overview"],
        ["/admin/assignments", "Assignments"],
        ["/admin/tracking", "Tracking"],
      ]
    : [
        ["/app", "Board"],
        ["/app/group", "My group"],
        ["/app/assignments", "Assignments"],
      ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-display text-xl">Joineazy Studio</p>
            <p className="text-sm text-ink/60">Student groups · assignment confirmations</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/admin" || to === "/app"}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm ${
                    isActive ? "bg-moss text-white" : "text-ink/70 hover:bg-ink/5"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink/70">
              {user.name}
              <span className="ml-2 rounded-full bg-clay/10 px-2 py-0.5 text-xs uppercase tracking-wide text-clay">
                {user.role}
              </span>
            </span>
            <button type="button" onClick={logout} className="rounded-full border border-ink/15 px-3 py-1">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function ProgressBar({ percent, label }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ink/60">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
