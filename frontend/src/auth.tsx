import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  roleLabel: string;
  permissions: string[];
};

type DevCredential = { email: string; password: string; role: string; label: string };
type AuthContextValue = { user: AuthUser | null; loading: boolean; backendOnline: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; devCredentials: DevCredential[] };
const AuthContext = createContext<AuthContextValue | null>(null);
const DEFAULT_DEV_CREDENTIALS: DevCredential[] = [
  { email: 'admin@rkm.com.br', password: 'Rkm@123456', role: 'admin', label: 'Admin / SGI' },
  { email: 'operador@rkm.com.br', password: 'Rkm@123456', role: 'operator', label: 'Operador / Técnico' },
  { email: 'supervisor@rkm.com.br', password: 'Rkm@123456', role: 'supervisor', label: 'Supervisor' },
  { email: 'qualidade@rkm.com.br', password: 'Rkm@123456', role: 'quality', label: 'Qualidade' },
  { email: 'pcp@rkm.com.br', password: 'Rkm@123456', role: 'pcp', label: 'PCP' },
];

const csrf = () => document.cookie.split('; ').find((value) => value.startsWith('rkm_csrf='))?.split('=')[1] || '';
const api = (path: string, options: RequestInit = {}) => fetch(`/api${path}`, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [devCredentials, setDevCredentials] = useState<DevCredential[]>(import.meta.env.DEV ? DEFAULT_DEV_CREDENTIALS : []);

  const refresh = async () => {
    const response = await api('/auth/refresh', { method: 'POST', headers: { 'X-CSRF-Token': csrf() } });
    if (!response.ok) throw new Error('session_expired');
    setUser(await response.json());
  };

  useEffect(() => {
    Promise.all([
      api('/auth/me').then(async (response) => {
        if (response.ok) setUser(await response.json());
        else await refresh().catch(() => undefined);
      }),
      api('/auth/dev-credentials').then(async (response) => { if (response.ok) setDevCredentials(await response.json()); }).catch(() => undefined),
    ]).finally(() => setLoading(false));
    const timer = window.setInterval(() => { if (user) refresh().catch(() => setUser(null)); }, 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [user]);

  useEffect(() => {
    const checkBackend = () => api('/health').then((response) => setBackendOnline(response.ok)).catch(() => setBackendOnline(false));
    checkBackend();
    const timer = window.setInterval(checkBackend, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    backendOnline,
    devCredentials,
    login: async (email, password) => {
      const response = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'invalid_credentials');
      setUser(await response.json());
    },
    logout: async () => {
      await api('/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrf() } });
      setUser(null);
    },
  }), [backendOnline, devCredentials, loading, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-rkmbg flex items-center justify-center text-slate-300">Validando sessão...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function LoginPage() {
  const { user, loading, backendOnline, login, devCredentials } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (loading) return <div className="min-h-screen bg-rkmbg" />;
  if (user) { navigate('/', { replace: true }); return null; }
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await login(email, password); navigate('/', { replace: true }); }
    catch { setError('E-mail ou senha inválidos.'); }
    finally { setSubmitting(false); }
  };
  return <main className="min-h-screen bg-rkmbg text-slate-200 flex flex-col p-4">
    <div className="flex-1 w-full flex items-center justify-center py-8">
      <form onSubmit={submit} className="w-full max-w-md rkm-card p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-rkmborder bg-rkmbg/60 px-3 py-2 mb-6 text-sm"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${backendOnline ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,.65)]'}`} /><span>{backendOnline ? 'Backend online' : 'Backend offline'}</span></div><span className="text-xs text-slate-500">:8787</span></div>
        <div className="mb-8"><div className="text-blue-400 text-sm font-semibold tracking-wide">RKM SGI</div><h1 className="text-2xl font-bold mt-2">Entrar no sistema</h1><p className="text-sm text-slate-400 mt-2">Acesse sua visão conforme o cargo atribuído.</p></div>
        <label className="block text-sm font-medium mb-2">E-mail<input className="rkm-input mt-2 disabled:cursor-not-allowed disabled:opacity-50" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@rkm.com.br" required disabled={!backendOnline} /></label>
        <label className="block text-sm font-medium mt-4 mb-2">Senha<input className="rkm-input mt-2 disabled:cursor-not-allowed disabled:opacity-50" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required disabled={!backendOnline} /></label>
        {error && <div className="alert-critical rounded-lg p-3 text-sm text-rose-200 mt-4">{error}</div>}
        {!backendOnline && <div className="text-xs text-rose-300 mt-4">Ligue o backend para liberar o login.</div>}
        <button className="btn btn-primary w-full justify-center mt-6 disabled:cursor-not-allowed disabled:opacity-50" disabled={!backendOnline || submitting}>{submitting ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
    {devCredentials.length > 0 && <section className="w-full max-w-6xl mx-auto pb-2"><div className="flex items-center justify-between gap-3 mb-3"><div><h2 className="font-semibold">Acessos de desenvolvimento</h2><p className="text-xs text-slate-400 mt-1">Cards visíveis somente no ambiente de desenvolvimento.</p></div><span className="tag tag-amber">DUMMY</span></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">{devCredentials.map((credential) => <button key={credential.email} type="button" className="rkm-card-2 text-left p-4 hover:border-blue-500 transition-colors" onClick={() => { setEmail(credential.email); setPassword(credential.password); }}><div className="font-medium">{credential.label}</div><div className="text-xs text-slate-400 mt-3 break-all">{credential.email}</div><div className="text-xs text-blue-300 mt-1">Senha: {credential.password}</div></button>)}</div></section>}
  </main>;
}
