"use client";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type UserType = "user" | "local";

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  type: UserType;
  nombreLocal?: string;
  comuna?: string;
}

interface StoredUser extends AuthUser {
  password: string;
  telefono?: string;
  tipoCocina?: string;
  createdAt: string;
}

export interface RegisterUserData {
  type: "user";
  nombre: string;
  email: string;
  password: string;
  comuna: string;
}

export interface RegisterLocalData {
  type: "local";
  nombreLocal: string;
  nombreEncargado: string;
  email: string;
  telefono: string;
  comuna: string;
  tipoCocina: string;
  password: string;
}

export type RegisterData = RegisterUserData | RegisterLocalData;

interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => void;
}

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login:    async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
});

// ─── Storage helpers ────────────────────────────────────────────────────────

const USERS_KEY   = "dc_users";
const SESSION_KEY = "dc_session";

// ─── Demo accounts (always available on every device) ────────────────────────

const DEMO_USERS: StoredUser[] = [
  {
    id: "demo-user-1", email: "demo@deseocomer.com", password: "demo1234",
    type: "user", nombre: "Jaime Demo", comuna: "Providencia",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "demo-local-1", email: "local@deseocomer.com", password: "local1234",
    type: "local", nombre: "Carlos Encargado", nombreLocal: "Pizza Napoli",
    comuna: "Providencia", telefono: "+56912345678", tipoCocina: "Pizza",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as StoredUser[];
    // Merge demo users (avoid duplicates by email)
    const emails = new Set(saved.map(u => u.email.toLowerCase()));
    const missing = DEMO_USERS.filter(d => !emails.has(d.email.toLowerCase()));
    if (missing.length > 0) {
      const merged = [...missing, ...saved];
      localStorage.setItem(USERS_KEY, JSON.stringify(merged));
      return merged;
    }
    return saved;
  } catch { return [...DEMO_USERS]; }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const sid =
        localStorage.getItem(SESSION_KEY) ??
        sessionStorage.getItem(SESSION_KEY);
      if (sid) {
        const found = getStoredUsers().find(u => u.id === sid);
        if (found) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _p, createdAt: _c, ...authUser } = found;
          setUser(authUser);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (
    email: string,
    password: string,
    remember = false,
  ): Promise<AuthResult> => {
    await new Promise(r => setTimeout(r, 650)); // simulate network delay

    const users = getStoredUsers();
    const found = users.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!found)                      return { success: false, error: "No existe una cuenta con ese email." };
    if (found.password !== password) return { success: false, error: "Contraseña incorrecta." };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, createdAt: _c, ...authUser } = found;
    setUser(authUser);

    if (remember) localStorage.setItem(SESSION_KEY, found.id);
    else          sessionStorage.setItem(SESSION_KEY, found.id);

    return { success: true };
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<AuthResult> => {
    await new Promise(r => setTimeout(r, 700));

    const users = getStoredUsers();
    const email = data.email.toLowerCase().trim();

    if (users.find(u => u.email.toLowerCase() === email)) {
      return { success: false, error: "Ya existe una cuenta con ese email." };
    }

    const newUser: StoredUser = {
      id:        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      password:  data.password,
      type:      data.type,
      nombre:    data.type === "user" ? data.nombre : data.nombreEncargado,
      createdAt: new Date().toISOString(),
      comuna:    data.comuna,
      ...(data.type === "local" && {
        nombreLocal: data.nombreLocal,
        telefono:    data.telefono,
        tipoCocina:  data.tipoCocina,
      }),
    };

    saveUsers([...users, newUser]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, createdAt: _c, ...authUser } = newUser;
    setUser(authUser);
    sessionStorage.setItem(SESSION_KEY, newUser.id);

    return { success: true, userId: newUser.id };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
