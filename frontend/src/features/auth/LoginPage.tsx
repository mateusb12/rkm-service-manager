import {
    useState,
    type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { Tooltip } from '../../Tooltip';
import { formatCommitDate } from '../../utils/formatCommitDate';

import {
    BUILD_COMMIT,
    BUILD_COMMIT_DATE,
    BUILD_COMMIT_TITLE,
    LOGIN_THEME_STORAGE_KEY,
} from './constants';

import { useAuth } from './AuthProvider';

export function LoginPage() {
  const { user, loading, backendOnline, login, devCredentials } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem(LOGIN_THEME_STORAGE_KEY) === 'dark'; } catch { return false; } });
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
      <div className="zenit-login-topbar"><span className="zenit-topbar-brand"><span className="zenit-brand-mark">R</span><span>RKM</span></span><span className="zenit-topbar-divider" /><span className="zenit-topbar-product">RKM Service Manager</span><button type="button" className="zenit-theme-toggle" aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'} onClick={() => setDarkMode((value) => { const next = !value; try { localStorage.setItem(LOGIN_THEME_STORAGE_KEY, next ? 'dark' : 'light'); } catch {} return next; })}>{darkMode ? '☀' : '☾'}</button></div>
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
    {devCredentials.length > 0 && <section className="zenit-dev-access w-full max-w-6xl mx-auto pb-2"><div className="flex items-center justify-between gap-3 mb-3"><div><h2 className="font-semibold text-slate-800">Perfis de acesso</h2><p className="text-xs text-slate-500 mt-1">Selecione um perfil para preencher as credenciais de acesso.</p></div><span className="tag tag-amber">RKM</span></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">{devCredentials.map((credential) => <button key={credential.email} type="button" className="zenit-surface zenit-dev-card text-left p-4" onClick={() => { setEmail(credential.email); setPassword(credential.password); }}><div className="font-medium text-slate-800">{credential.label}</div><div className="text-xs text-slate-500 mt-3 break-all">{credential.email}</div><div className="text-xs text-blue-600 mt-1">Senha: {credential.password}</div></button>)}</div></section>}
    </section>
  </main>;
}
