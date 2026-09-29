import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { downloadTransformerExport, fetchTransformer, fetchTransformers } from './api';
import type { Transformer } from './types';

type IconName = 'download' | 'back' | 'search' | 'capacity' | 'transformer';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths = {
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    capacity: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 4-6" /></>,
    transformer: <><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function PageIntro({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-cyan-400">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1></div>{action}</div>;
}

function SummaryCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return <div className="panel interactive-panel p-5"><p className="text-sm text-slate-400">{title}</p><p className="mt-3 text-3xl font-semibold text-white">{value}</p><p className="mt-2 text-xs text-slate-400">{hint}</p></div>;
}

function LoadingState() { return <div className="p-12 text-center text-sm text-slate-400">Loading data…</div>; }
function EmptyState({ message }: { message: string }) { return <div className="p-12 text-center text-sm text-slate-400">{message}</div>; }
function ErrorState({ message }: { message: string }) { return <div role="alert" className="panel border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{message}</div>; }
function SuccessState({ message }: { message: string }) { return <div role="status" className="toast-success">{message}</div>; }
function InfoTile({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><p className="eyebrow">{label}</p><p className="mt-2 text-base font-medium text-slate-100">{value}</p></div>; }

export function TransformerInventoryPage() {
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [allTransformers, setAllTransformers] = useState<Transformer[]>([]);
  const [capacityOptions, setCapacityOptions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [feeder, setFeeder] = useState('');
  const [capacity, setCapacity] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const pageSize = 8;

  useEffect(() => {
    const query = { search: search || undefined, feeder: feeder || undefined, capacityKva: capacity ? Number(capacity) : undefined };
    const catalogQuery = { page: 1, limit: 100 };
    Promise.all([fetchTransformers({ ...query, page, limit: pageSize }), fetchTransformers({ ...query, page: 1, limit: 100 }), fetchTransformers(catalogQuery)]).then(([response, summaryResponse, catalogResponse]) => {
      setTransformers(response.items);
      setAllTransformers(summaryResponse.items);
      setCapacityOptions([...new Set(catalogResponse.items.map((item) => item.capacityKva))].sort((left, right) => left - right));
      setTotal(response.meta.total);
      setError(null);
    }).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load transformers.')).finally(() => setLoading(false));
  }, [page, search, feeder, capacity]);

  const capacities = useMemo(() => {
    const counts = new Map<number, number>();
    allTransformers.forEach((transformer) => counts.set(transformer.capacityKva, (counts.get(transformer.capacityKva) ?? 0) + 1));
    return [...counts.entries()].sort(([left], [right]) => left - right);
  }, [allTransformers]);
  const feeders = [...new Set(allTransformers.map((transformer) => transformer.feeder))];
  const totalCapacity = allTransformers.reduce((sum, transformer) => sum + transformer.capacityKva, 0);
  const averageCapacity = allTransformers.length ? Math.round(totalCapacity / allTransformers.length) : 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  async function exportAll() {
    setExportState('loading');
    try { await downloadTransformerExport(); setExportState('success'); window.setTimeout(() => setExportState('idle'), 2500); } catch { setExportState('error'); }
  }
  function clearFilters() { setSearch(''); setFeeder(''); setCapacity(''); setPage(1); }

  return <div className="space-y-6"><PageIntro eyebrow="Network assets" title="Transformers" action={<button onClick={exportAll} disabled={exportState === 'loading'} className="primary-button"><Icon name="download" size={16} />{exportState === 'loading' ? 'Exporting…' : 'Export Transformers'}</button>} /><p className="-mt-3 text-sm text-slate-400">Distribution transformer inventory and network capacity.</p>{exportState === 'success' ? <SuccessState message="Transformer download started." /> : null}{exportState === 'error' ? <ErrorState message="The transformer export could not be generated." /> : null}{error ? <ErrorState message={error} /> : null}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SummaryCard title="Total transformers" value={String(total)} hint="Matching current filters" /><SummaryCard title="Total capacity" value={`${totalCapacity.toLocaleString()} kVA`} hint="Matching current filters" /><SummaryCard title="Average capacity" value={`${averageCapacity} kVA`} hint="Calculated from filtered records" /><SummaryCard title="Feeders" value={String(feeders.length)} hint="Filtered distinct feeders" /></div><div className="panel p-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_220px_220px_auto]"><label className="relative block"><span className="sr-only">Search transformers</span><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Icon name="search" size={16} /></span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search code, name, or feeder" className="control w-full pl-9" /></label><label><span className="sr-only">Filter by feeder</span><select aria-label="Filter by feeder" value={feeder} onChange={(event) => { setFeeder(event.target.value); setPage(1); }} className="control w-full"><option value="">All feeders</option>{feeders.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label><span className="sr-only">Filter by capacity</span><select aria-label="Filter by capacity" value={capacity} onChange={(event) => { setCapacity(event.target.value); setPage(1); }} className="control w-full"><option value="">All capacities</option>{capacityOptions.map((value) => <option key={value} value={value}>{value} kVA</option>)}</select></label><button onClick={clearFilters} disabled={!search && !feeder && !capacity} className="secondary-button">Clear filters</button></div></div><div className="grid gap-6 xl:grid-cols-[1fr_300px]"><div className="panel overflow-hidden"><div className="overflow-x-auto">{loading ? <LoadingState /> : transformers.length ? <table className="data-table"><thead><tr><th>Code</th><th>Name</th><th>Feeder</th><th>Capacity (kVA)</th><th>Actions</th></tr></thead><tbody>{transformers.map((transformer) => <tr key={transformer.code}><td className="font-semibold text-cyan-300">{transformer.code}</td><td>{transformer.name}</td><td>{transformer.feeder}</td><td>{transformer.capacityKva} kVA</td><td><Link to={`/transformers/${transformer.code}`} className="detail-link">View details <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true">→</span></Link></td></tr>)}</tbody></table> : <EmptyState message="No transformers match the selected filters." />}</div><div className="flex items-center justify-between border-t border-slate-800 px-5 py-4 text-sm text-slate-400"><span>Page {page} of {pageCount}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="secondary-button">Previous</button><button disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} className="secondary-button">Next</button></div></div></div><div className="panel p-5"><div className="flex items-center justify-between"><h2 className="section-title">Capacity distribution</h2><Icon name="capacity" size={18} /></div><div className="mt-5 space-y-4">{capacities.length ? capacities.map(([value, count]) => <div key={value}><div className="mb-1 flex justify-between text-sm text-slate-300"><span>{value} kVA</span><span>{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max(count / Math.max(...capacities.map(([, amount]) => amount)) * 100, 8)}%` }} /></div></div>) : <EmptyState message="No capacity data available." />}</div></div></div></div>;
}

export function TransformerAssetPage() {
  const { code } = useParams();
  const [transformer, setTransformer] = useState<Transformer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!code) return; fetchTransformer(code).then(setTransformer).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load transformer details.')).finally(() => setLoading(false)); }, [code]);
  if (loading) return <LoadingState />;
  if (error || !transformer) return <ErrorState message={error ?? 'Transformer not found.'} />;
  return <div className="space-y-6"><PageIntro eyebrow="Network asset" title={transformer.code} action={<Link to="/transformers" className="secondary-button"><Icon name="back" size={16} />Back to Transformers</Link>} /><p className="-mt-3 text-sm text-slate-400">Transformer information from the application fixture.</p><div className="panel p-6"><div className="flex items-start gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300"><Icon name="transformer" size={22} /></div><div><h2 className="text-xl font-semibold text-white">{transformer.name}</h2><p className="mt-1 text-sm text-slate-400">Distribution transformer</p></div></div><div className="mt-8 grid gap-4 sm:grid-cols-3"><InfoTile label="Transformer code" value={transformer.code} /><InfoTile label="Feeder" value={transformer.feeder} /><InfoTile label="Capacity" value={`${transformer.capacityKva} kVA`} /></div></div></div>;
}
