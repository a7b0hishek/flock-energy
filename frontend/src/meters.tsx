import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { downloadMeterExport, fetchMeters } from './api';
import type { InstallStatus, Meter, MeterQuery, PhaseType } from './types';

type IconName = 'search' | 'download';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const statusClasses: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  inactive: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  pending: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
};

function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[status] ?? 'bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/30'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function PageIntro({ action }: { action: ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-cyan-400">Inventory</p><h1 className="mt-2 text-3xl font-semibold text-white">Meters</h1></div>{action}</div>;
}

function LoadingState() { return <div className="p-12 text-center text-sm text-slate-400">Loading meter data…</div>; }
function EmptyState({ message }: { message: string }) { return <div className="p-12 text-center text-sm text-slate-400">{message}</div>; }
function ErrorState({ message }: { message: string }) { return <div role="alert" className="panel border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{message}</div>; }
function SuccessToast({ message }: { message: string }) { return <div role="status" className="toast-success">{message}</div>; }

export function MeterInventoryPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MeterQuery>({});
  const [page, setPage] = useState(1);
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const pageSize = 25;

  useEffect(() => {
    fetchMeters(filters).then((response) => { setMeters(response.items); setError(null); setPage(1); }).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load meters.')).finally(() => setLoading(false));
  }, [filters]);

  const filteredMeters = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? meters.filter((meter) => `${meter.meterId} ${meter.make} ${meter.dtCode} ${meter.serialNo}`.toLowerCase().includes(query)) : meters;
  }, [meters, search]);
  const pageCount = Math.max(1, Math.ceil(filteredMeters.length / pageSize));
  const visibleMeters = filteredMeters.slice((page - 1) * pageSize, page * pageSize);
  const filtersActive = Boolean(search || filters.status || filters.phaseType || filters.make || filters.dtCode);

  function updateFilter<K extends keyof MeterQuery>(key: K, value: MeterQuery[K] | '') {
    setFilters((current) => ({ ...current, [key]: value === '' ? undefined : value }));
    setPage(1);
  }

  function clearFilters() { setSearch(''); setFilters({}); setPage(1); }
  async function exportAll() { setExportState('loading'); try { await downloadMeterExport(); setExportState('success'); window.setTimeout(() => setExportState('idle'), 2500); } catch { setExportState('error'); } }

  return <div className="space-y-6"><PageIntro action={<button onClick={exportAll} disabled={exportState === 'loading'} className="primary-button"><Icon name="download" size={16} />{exportState === 'loading' ? 'Exporting…' : 'Export All Meters'}</button>} />{exportState === 'success' ? <SuccessToast message="Meter download started." /> : null}{exportState === 'error' ? <ErrorState message="The meter export could not be generated." /> : null}{error ? <ErrorState message={error} /> : null}<div className="panel p-4"><div className="toolbar-grid"><label className="relative block"><span className="sr-only">Search meters</span><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Icon name="search" size={16} /></span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search meter, serial, or make" className="control w-full pl-9" /></label><label><span className="sr-only">Filter meters by status</span><select aria-label="Filter meters by status" value={filters.status ?? ''} onChange={(event) => updateFilter('status', event.target.value as InstallStatus | '')} className="control w-full"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option></select></label><label><span className="sr-only">Filter meters by phase</span><select aria-label="Filter meters by phase" value={filters.phaseType ?? ''} onChange={(event) => updateFilter('phaseType', event.target.value as PhaseType | '')} className="control w-full"><option value="">All phases</option><option value="single-phase">Single phase</option><option value="three-phase">Three phase</option><option value="unknown">Unknown</option></select></label><label><span className="sr-only">Filter meters by make</span><input aria-label="Filter meters by make" value={filters.make ?? ''} onChange={(event) => updateFilter('make', event.target.value)} placeholder="Make" className="control w-full" /></label><label><span className="sr-only">Filter meters by DT code</span><input aria-label="Filter meters by DT code" value={filters.dtCode ?? ''} onChange={(event) => updateFilter('dtCode', event.target.value)} placeholder="DT code" className="control w-full" /></label><button onClick={clearFilters} disabled={!filtersActive} className="secondary-button">Clear filters</button></div></div><div className="panel overflow-hidden"><div className="overflow-x-auto">{loading ? <LoadingState /> : visibleMeters.length ? <table className="data-table"><thead><tr><th>Meter</th><th>Make</th><th>Phase</th><th>Status</th><th>DT code</th><th>Install type</th></tr></thead><tbody>{visibleMeters.map((meter) => <tr key={meter.meterId}><td><Link to={`/meters/${meter.meterId}`} className="detail-link">{meter.meterId}</Link></td><td>{meter.make}</td><td className="capitalize">{meter.phaseType}</td><td><StatusBadge status={meter.installStatus} /></td><td>{meter.dtCode}</td><td>{meter.installType}</td></tr>)}</tbody></table> : <EmptyState message="No meters match the selected filters." />}</div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-5 py-4 text-sm text-slate-400"><span>{filteredMeters.length} records</span><div className="flex items-center gap-3"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="secondary-button">Previous</button><span>Page {page} of {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} className="secondary-button">Next</button></div></div></div></div>;
}
