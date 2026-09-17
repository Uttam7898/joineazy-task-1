import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("je_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("je_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api("/auth/me", { token })
      .then((data) => {
        setUser(data.user);
        localStorage.setItem("je_user", JSON.stringify(data.user));
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("je_token");
        localStorage.removeItem("je_user");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login(nextUser, nextToken) {
        setUser(nextUser);
        setToken(nextToken);
        localStorage.setItem("je_token", nextToken);
        localStorage.setItem("je_user", JSON.stringify(nextUser));
      },
      logout() {
        setUser(null);
        setToken(null);
        localStorage.removeItem("je_token");
        localStorage.removeItem("je_user");
      },
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
