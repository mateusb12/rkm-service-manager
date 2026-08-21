import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Tooltip } from './Tooltip';
import { formatCommitDate } from './utils/formatCommitDate';

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
  { email: 'admin@rkm.com.br', password: 'Rkm@123456', role: 'admin', label: 'Admin' },
  { email: 'operador@rkm.com.br', password: 'Rkm@123456', role: 'operator', label: 'Operador / Técnico' },
  { email: 'supervisor@rkm.com.br', password: 'Rkm@123456', role: 'supervisor', label: 'Supervisor' },
  { email: 'qualidade@rkm.com.br', password: 'Rkm@123456', role: 'quality', label: 'Qualidade' },
  { email: 'pcp@rkm.com.br', password: 'Rkm@123456', role: 'pcp', label: 'PCP' },
];
const BUILD_COMMIT = import.meta.env.VITE_COMMIT_SHA || 'local';
const BUILD_COMMIT_DATE = import.meta.env.VITE_COMMIT_DATE || 'unknown';
const BUILD_COMMIT_TITLE = import.meta.env.VITE_COMMIT_TITLE || 'unknown';

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
  const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem('rkm-login-theme') === 'dark'; } catch { return false; } });
  if (loading) return <div className="min-h-screen bg-rkmbg" />;
  if (user) { navigate('/', { replace: true }); return null; }
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await login(email, password); navigate('/', { replace: true }); }
    catch { setError('E-mail ou senha inválidos.'); }
    finally { setSubmitting(false); }
  };
  return <main className={`zenit-login min-h-screen text-slate-700 flex ${darkMode ? 'zenit-dark' : ''}`}>
    <section className="zenit-login-main">
      <div className="zenit-login-topbar"><span className="zenit-topbar-brand"><span className="zenit-brand-mark">R</span><span>RKM</span></span><span className="zenit-topbar-divider" /><span className="zenit-topbar-product">RKM Service Manager</span><button type="button" className="zenit-theme-toggle" aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'} onClick={() => setDarkMode((value) => { const next = !value; try { localStorage.setItem('rkm-login-theme', next ? 'dark' : 'light'); } catch {} return next; })}>{darkMode ? '☀' : '☾'}</button></div>
      <div className="flex-1 w-full flex items-center justify-center py-8">
      <form onSubmit={submit} className="w-full max-w-md zenit-surface zenit-login-card">
        <div className="zenit-card-status"><span className="zenit-status"><i className={backendOnline ? 'online' : 'offline'} />{backendOnline ? 'Sistema online' : 'Sistema offline'}</span><code>:8787</code></div>
        <div className="mb-8"><div className="zenit-kicker">RKM SERVICE MANAGER</div><h1 className="text-2xl font-bold mt-2 text-slate-900">Acesse sua conta</h1><p className="text-sm text-slate-500 mt-2">Que bom ver você de volta. Vamos continuar no seu ritmo.</p></div>
        <label className="block text-sm font-medium mb-2">E-mail<input className="rkm-input zenit-field mt-2 disabled:cursor-not-allowed disabled:opacity-50" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@rkm.com.br" required disabled={!backendOnline} /></label>
        <label className="block text-sm font-medium mt-4 mb-2">Senha<input className="rkm-input zenit-field mt-2 disabled:cursor-not-allowed disabled:opacity-50" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required disabled={!backendOnline} /></label>
        {error && <div className="alert-critical rounded-lg p-3 text-sm text-rose-200 mt-4">{error}</div>}
        {!backendOnline && <div className="text-xs text-rose-300 mt-4">Ligue o backend para liberar o login.</div>}
        <button className="btn zenit-button-primary zenit-submit w-full justify-center mt-6 disabled:cursor-not-allowed disabled:opacity-50" disabled={!backendOnline || submitting}>{submitting ? 'Entrando...' : 'Entrar'}</button>
        <div className="zenit-build-info"><Tooltip content={`${BUILD_COMMIT}\n${formatCommitDate(BUILD_COMMIT_DATE)}\n${BUILD_COMMIT_TITLE}`}><span>Commit do deploy: <code>{BUILD_COMMIT}</code></span></Tooltip></div>
      </form>
    </div>
    {devCredentials.length > 0 && <section className="zenit-dev-access w-full max-w-6xl mx-auto pb-2"><div className="flex items-center justify-between gap-3 mb-3"><div><h2 className="font-semibold text-slate-800">Acessos de desenvolvimento</h2><p className="text-xs text-slate-500 mt-1">Cards visíveis somente no ambiente de desenvolvimento.</p></div><span className="tag tag-amber">DUMMY</span></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">{devCredentials.map((credential) => <button key={credential.email} type="button" className="zenit-surface zenit-dev-card text-left p-4" onClick={() => { setEmail(credential.email); setPassword(credential.password); }}><div className="font-medium text-slate-800">{credential.label}</div><div className="text-xs text-slate-500 mt-3 break-all">{credential.email}</div><div className="text-xs text-blue-600 mt-1">Senha: {credential.password}</div></button>)}</div></section>}
    </section>
  </main>;
}
