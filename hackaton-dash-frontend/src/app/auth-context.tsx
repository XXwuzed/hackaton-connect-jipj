import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import {
  changePassword as changePasswordRequest,
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  type SessionUser,
} from '../lib/api-client';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login(email: string, password: string): Promise<SessionUser>;
  logout(): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Mantiene solo el perfil público; los JWT quedan en cookies HTTP-only. */
export function AuthProvider({ children }: PropsWithChildren): JSX.Element {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((current) => {
        if (mounted) setUser(current);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const current = await loginRequest(email, password);
    setUser(current);
    return current;
  }, []);
  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setUser(await changePasswordRequest(currentPassword, newPassword));
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Expone la sesión actual solo dentro del proveedor. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider no configurado');
  return context;
}
