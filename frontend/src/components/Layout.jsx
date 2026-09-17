import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const links = isAdmin
    ? [
        ["/admin", "Overview"],
        ["/admin/assignments", "Assignments"],
        ["/admin/tracking", "Tracking"],
      ]
    : [
        ["/app", "Home"],
        ["/app/group", "My group"],
        ["/app/assignments", "Assignments"],
      ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="font-display text-xl">Joineazy Studio</p>
            <p className="text-sm text-ink/60">Student groups & assignment tracking</p>
          </div>
          <nav className="hidden gap-4 sm:flex">
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/app" || to === "/admin"}
                className={({ isActive }) =>
                  `text-sm font-semibold ${isActive ? "text-moss" : "text-ink/70 hover:text-ink"}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <p className="font-semibold">{user?.name}</p>
              <p className="capitalize text-ink/60">{user?.role}</p>
            </div>
            <button
              className="rounded-full border border-ink/20 px-3 py-1.5 text-sm"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-4 pb-3 sm:hidden">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/app" || to === "/admin"}
              className={({ isActive }) =>
                `whitespace-nowrap text-sm font-semibold ${isActive ? "text-moss" : "text-ink/70"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
