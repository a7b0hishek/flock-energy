import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { fetchMeter, fetchMeters, fetchTransformers, login, logout } from './api';
import type { Meter, Transformer } from './types';
import { MeterInventoryPage } from './meters';
import { TransformerAssetPage, TransformerInventoryPage } from './transformers';

const TOKEN_KEY = 'flock-energy-app-token';
const THEME_KEY = 'flock-energy-theme';

const statusClasses: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  inactive: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  pending: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
};

type IconName = 'dashboard' | 'meter' | 'transformer' | 'download' | 'sun' | 'moon' | 'logout' | 'back' | 'search' | 'capacity';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    meter: <><path d="M4 17a8 8 0 1 1 16 0" /><path d="m12 13 3-3" /><path d="M6 20h12" /></>,
    transformer: <><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    moon: <path d="M20.7 15.3A8.5 8.5 0 0 1 8.7 3.3 8.5 8.5 0 1 0 20.7 15.3Z" />,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-5" /></>,
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    capacity: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 4-6" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none"><path d="M14 2 24 8v12l-10 6L4 20V8z" /><path d="m9 14 3 3 7-7" /></svg></span>;
}

function statusLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[status] ?? 'bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/30'}`}>{statusLabel(status)}</span>;
}

function SummaryCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return <div className="panel interactive-panel p-5"><p className="text-sm text-slate-400">{title}</p><p className="mt-3 text-3xl font-semibold text-white">{value}</p><p className="mt-2 text-xs text-slate-400">{hint}</p></div>;
}

function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(username, password);
      onLogin(result.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center px-4 py-10"><div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-slate-950/40 lg:grid-cols-[1fr_0.85fr]">
    <section className="hidden flex-col justify-between bg-cyan-950/40 p-10 lg:flex"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Flock Energy</p><h1 className="mt-8 max-w-sm text-4xl font-semibold leading-tight text-white">Operational clarity for every meter.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">Urja Meter Ops brings your network inventory, hierarchy, and installation status into one focused workspace.</p></div><p className="text-xs text-slate-500">Application dashboard · Local development mode</p></section>
    <section className="p-6 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">Urja Meter Ops</p><h2 className="mt-3 text-2xl font-semibold text-white">Welcome back</h2><p className="mt-2 text-sm text-slate-400">Sign in to access the operations dashboard.</p><form className="mt-8 space-y-5" onSubmit={submit}><label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Email or username</span><input required value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="control w-full" /></label><label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Password</span><div className="relative"><input required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="control w-full pr-20" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-3 text-xs font-medium text-cyan-300 hover:text-cyan-200">{showPassword ? 'Hide' : 'Show'}</button></div></label>{error ? <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div> : null}<button disabled={loading} type="submit" className="primary-button w-full">{loading ? 'Signing in…' : 'Sign in'}</button></form><p className="mt-6 text-xs leading-5 text-slate-500">This is application-level authentication for the local dashboard. It does not authenticate against the legacy Urja portal.</p></section>
  </div></main>;
}

function DashboardPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchMeters(), fetchTransformers({ page: 1, limit: 100 })]).then(([meterResponse, transformerResponse]) => {
      setMeters(meterResponse.items);
      setTransformers(transformerResponse.items);
    }).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load dashboard data.')).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const makes = new Set(meters.map((meter) => meter.make));
    const totalCapacity = transformers.reduce((total, transformer) => total + transformer.capacityKva, 0);
    return { total: meters.length, active: meters.filter((meter) => meter.installStatus === 'active').length, inactive: meters.filter((meter) => meter.installStatus === 'inactive').length, pending: meters.filter((meter) => meter.installStatus === 'pending').length, makes: makes.size, transformers: transformers.length, totalCapacity, averageCapacity: transformers.length ? Math.round(totalCapacity / transformers.length) : 0, feeders: new Set(transformers.map((transformer) => transformer.feeder)).size };
  }, [meters, transformers]);

  return <div className="space-y-6"><PageIntro eyebrow="Overview" title="Network performance" action={<Link to="/meters" className="secondary-button">View all meters</Link>} />{error ? <ErrorState message={error} /> : null}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SummaryCard title="Total meters" value={String(stats.total)} hint="Current API inventory" /><SummaryCard title="Installed" value={String(stats.active)} hint="Active installation status" /><SummaryCard title="Decommissioned" value={String(stats.inactive)} hint="Inactive installation status" /><SummaryCard title="Distinct makes" value={String(stats.makes)} hint="Observed in current data" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SummaryCard title="Transformers" value={String(stats.transformers)} hint="Fixture-backed inventory" /><SummaryCard title="Total capacity" value={`${stats.totalCapacity.toLocaleString()} kVA`} hint="Current transformer inventory" /><SummaryCard title="Average capacity" value={`${stats.averageCapacity} kVA`} hint="Calculated from records" /><SummaryCard title="Feeders" value={String(stats.feeders)} hint="Distinct transformer feeders" /></div><div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]"><div className="panel p-5"><div className="flex items-center justify-between"><h2 className="section-title">Meter health mix</h2><span className="eyebrow">Current data</span></div>{loading ? <LoadingState /> : <div className="mt-6 space-y-4">{[['Active', stats.active, 'bg-emerald-400'], ['Inactive', stats.inactive, 'bg-rose-400'], ['Pending', stats.pending, 'bg-amber-400']].map(([label, value, color]) => <div key={String(label)}><div className="mb-2 flex justify-between text-sm text-slate-300"><span>{label}</span><span>{value}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${color}`} style={{ width: `${stats.total ? Math.max(Number(value) / stats.total * 100, 4) : 0}%` }} /></div></div>)}</div>}</div><div className="panel p-5"><h2 className="section-title">Transformer coverage</h2><div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/50 p-4"><p className="text-sm text-slate-300">Network assets</p><p className="mt-2 text-2xl font-semibold text-white">{stats.transformers} transformers</p><p className="mt-2 text-xs leading-5 text-slate-400">Capacity and feeder information from the local transformer fixture.</p><Link to="/transformers" className="mt-4 inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">Open inventory <span aria-hidden="true">→</span></Link></div></div></div><div className="panel p-5"><div className="mb-5 flex items-center justify-between"><h2 className="section-title">Recent meters</h2><Link to="/meters" className="text-sm text-cyan-300 hover:text-cyan-200">Browse all</Link></div>{loading ? <LoadingState /> : meters.length ? <MeterTable meters={meters.slice(0, 6)} compact /> : <EmptyState message="No meter records are available." />}</div></div>;
}

function MeterTable({ meters, compact = false }: { meters: Meter[]; compact?: boolean }) { return <table className="min-w-full text-left text-sm"><thead className="bg-slate-950/60 text-slate-400"><tr><th className="px-5 py-4 font-medium">Meter</th><th className="px-5 py-4 font-medium">Make</th><th className="px-5 py-4 font-medium">Phase</th><th className="px-5 py-4 font-medium">Status</th><th className="px-5 py-4 font-medium">DT code</th>{!compact ? <th className="px-5 py-4 font-medium">Install type</th> : null}</tr></thead><tbody>{meters.map((meter) => <tr key={meter.meterId} className="border-t border-slate-800 text-slate-200"><td className="px-5 py-4"><Link to={`/meters/${meter.meterId}`} className="font-semibold text-cyan-300 hover:text-cyan-200">{meter.meterId}</Link></td><td className="px-5 py-4">{meter.make}</td><td className="px-5 py-4 capitalize">{meter.phaseType}</td><td className="px-5 py-4"><StatusBadge status={meter.installStatus} /></td><td className="px-5 py-4">{meter.dtCode}</td>{!compact ? <td className="px-5 py-4">{meter.installType}</td> : null}</tr>)}</tbody></table>; }

function MeterDetailPage() { const { meterId } = useParams(); const [meter, setMeter] = useState<Meter | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); useEffect(() => { if (!meterId) return; fetchMeter(meterId).then(setMeter).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load meter details.')).finally(() => setLoading(false)); }, [meterId]); if (loading) return <LoadingState />; if (error || !meter) return <ErrorState message={error ?? 'Meter not found.'} />; return <div className="space-y-6"><PageIntro eyebrow="Meter detail" title={meter.meterId} action={<Link to="/meters" className="secondary-button">Back to meters</Link>} /><div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><div className="panel p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">Installation summary</p><h2 className="mt-1 text-xl font-semibold text-white">{meter.make}</h2></div><StatusBadge status={meter.installStatus} /></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{[['Serial number', meter.serialNo], ['Phase', meter.phaseType], ['Install type', meter.installType], ['Build', meter.build], ['DT code', meter.dtCode]].map(([label, value]) => <InfoTile key={label} label={label} value={value} />)}</div></div><div className="panel p-5"><h2 className="section-title">Geolocation</h2><div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4"><p className="eyebrow">Coordinates</p><p className="mt-2 text-2xl font-semibold text-white">{meter.geo.lat.toFixed(4)}°, {meter.geo.lng.toFixed(4)}°</p></div></div></div><div className="panel p-5"><h2 className="section-title">Hierarchy</h2><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Object.entries(meter.hierarchy).map(([key, value]) => <div key={key} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><p className="eyebrow">{key}</p><p className="mt-3 text-lg font-semibold text-white">{value.name}</p><p className="mt-1 text-sm text-cyan-300">{value.code}</p></div>)}</div></div></div>; }

function AppShell({ onLogout, theme, onThemeToggle }: { onLogout: () => void; theme: 'light' | 'dark'; onThemeToggle: () => void }) { return <div className="min-h-screen"><div className="mx-auto max-w-7xl px-4 py-6 lg:px-8"><header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 px-5 py-4 shadow-2xl shadow-slate-950/20 sm:flex-row sm:items-center sm:justify-between"><div className="brand-lockup"><BrandMark /><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">Flock Energy</p><h1 className="mt-1 text-xl font-semibold text-white">Urja Meter Ops</h1></div></div><div className="flex flex-wrap items-center gap-3"><nav className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-1">{[{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' as IconName }, { to: '/meters', label: 'Meters', icon: 'meter' as IconName }, { to: '/transformers', label: 'Transformers', icon: 'transformer' as IconName }].map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-300 hover:text-white'}`}><Icon name={link.icon} size={15} /><span>{link.label}</span></NavLink>)}</nav><button type="button" onClick={onThemeToggle} className="icon-button" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button><button type="button" onClick={onLogout} className="icon-button" aria-label="Log out" title="Log out"><Icon name="logout" /></button></div></header><main className="pb-10"><Outlet /></main></div></div>; }

function PageIntro({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) { return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-cyan-400">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1></div>{action}</div>; }
function InfoTile({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><p className="eyebrow">{label}</p><p className="mt-2 text-base font-medium text-slate-100">{value}</p></div>; }
function LoadingState() { return <div className="p-12 text-center text-sm text-slate-400">Loading data…</div>; }
function EmptyState({ message }: { message: string }) { return <div className="p-12 text-center text-sm text-slate-400">{message}</div>; }
function ErrorState({ message }: { message: string }) { return <div role="alert" className="panel border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{message}</div>; }
function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => { const saved = localStorage.getItem(THEME_KEY); return saved === 'light' || saved === 'dark' ? saved : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; });
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); document.body.classList.toggle('theme-light', theme === 'light'); localStorage.setItem(THEME_KEY, theme); }, [theme]);
  useEffect(() => { const handleSessionExpired = () => setToken(null); window.addEventListener('flock-energy-session-expired', handleSessionExpired); return () => window.removeEventListener('flock-energy-session-expired', handleSessionExpired); }, []);
  function handleLogin(newToken: string) { localStorage.setItem(TOKEN_KEY, newToken); setToken(newToken); }
  async function handleLogout() { await logout().catch(() => undefined); localStorage.removeItem(TOKEN_KEY); setToken(null); }
  return <Routes><Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />} /><Route element={token ? <AppShell onLogout={handleLogout} theme={theme} onThemeToggle={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} /> : <Navigate to="/login" replace />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/meters" element={<MeterInventoryPage />} /><Route path="/meters/:meterId" element={<MeterDetailPage />} /><Route path="/transformers" element={<TransformerInventoryPage />} /><Route path="/transformers/:code" element={<TransformerAssetPage />} /></Route><Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} /><Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} /></Routes>;
}

export default App;
