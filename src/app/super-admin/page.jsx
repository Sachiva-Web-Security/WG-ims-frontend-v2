"use client";
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import { Layout } from '@/components/Layout';
import {
  StatCard, Spinner, Empty, RoleBadge, Modal, ConfirmDialog,
  SearchInput, SectionHeader, Field, TableSkeleton, StockBar
} from '@/components/UI';
import { useToast } from '@/context/ToastContext';
import { UnitSelect } from '@/utils/units';
import api from '@/lib/axios';

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'charts', icon: '📈', label: 'Stock Charts' },
  { key: 'ingredients', icon: '🥗', label: 'Ingredients' },
  { key: 'stock-config', icon: '⚙️', label: 'Stock Limits' },
  { key: 'users', icon: '👥', label: 'Users' },
  { key: 'locations', icon: '📍', label: 'Locations' },
  { key: 'audit', icon: '📋', label: 'Audit Log' },
];

// ─── Custom Tooltip for charts ─────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-elevated p-3 text-sm">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value} {p.payload?.unit || ''}
        </p>
      ))}
    </div>
  );
};

// ─── Single Location Bar Chart ─────────────────────────────────────────────
function LocationChart({ location, inventory }) {
  const data = inventory.map(item => ({
    name: item.ingredient_name.length > 10
      ? item.ingredient_name.slice(0, 10) + '…'
      : item.ingredient_name,
    fullName: item.ingredient_name,
    current: parseFloat(item.current_quantity),
    max: parseFloat(item.max_quantity),
    min: parseFloat(item.min_quantity),
    unit: item.unit,
    status: item.status,
  }));

  const statusColor = (s) => s === 'OK' ? '#10B981' : s === 'LOW' ? '#F59E0B' : '#EF4444';

  if (!data.length) return <Empty icon="📊" message="No inventory data" />;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 font-heading">{location}</h3>
          <p className="text-xs text-slate-400">{inventory.length} ingredients tracked</p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />Current</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 inline-block" />Max</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 20, left: 0 }} barSize={18} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="max" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="Max">
            {data.map((_, i) => <Cell key={i} fill="#E2E8F0" />)}
          </Bar>
          <Bar dataKey="current" radius={[4, 4, 0, 0]} name="Current">
            {data.map((entry, i) => (
              <Cell key={i} fill={statusColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Legend row */}
      <div className="flex flex-wrap gap-2 mt-2">
        {inventory.map(item => (
          <span key={item.ingredient_name}
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.status === 'OK' ? 'bg-emerald-100 text-emerald-700' :
              item.status === 'LOW' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
            {item.ingredient_name}: {item.current_quantity}/{item.max_quantity} {item.unit}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const toast = useToast();
  const [page, setPage] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [stockConfig, setStockConfig] = useState([]);
  const [selectedConfigLoc, setSelectedConfigLoc] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [userModal, setUserModal] = useState(false);
  const [locModal, setLocModal] = useState(false);
  const [ingModal, setIngModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmDelIng, setConfirmDelIng] = useState(null);
  const [resetPwModal, setResetPwModal] = useState(null); // { id, name }
  const [resetPwValue, setResetPwValue] = useState('');
  const [resetPwLoading, setResetPwLoading] = useState(false);

  // Forms
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'KITCHEN_USER', location_id: '' });
  const [locForm, setLocForm] = useState({ location_code: '', name: '' });
  const [ingForm, setIngForm] = useState({ name: '', unit: 'lb' });
  const [formLoading, setFormLoading] = useState(false);

  // Stock config inline editing
  const [configEdits, setConfigEdits] = useState({}); // { ingId: { max, min } }
  const [savingConfig, setSavingConfig] = useState({});

  const load = useCallback(async (p) => {
    setLoading(true); setSearch('');
    try {
      if (p === 'dashboard') {
        const [rs, rl] = await Promise.all([
          api.get('/super-admin/stats'),
          api.get('/super-admin/locations'),
        ]);
        setStats(rs.data); setLocations(rl.data);
      }
      if (p === 'charts') {
        const r = await api.get('/super-admin/chart-data');
        setChartData(r.data);
      }
      if (p === 'ingredients') {
        const r = await api.get('/super-admin/ingredients');
        setIngredients(r.data);
      }
      if (p === 'stock-config') {
        const [rl] = await Promise.all([api.get('/super-admin/locations')]);
        setLocations(rl.data);
        if (!selectedConfigLoc && rl.data.length) {
          setSelectedConfigLoc(String(rl.data[0].id));
        }
      }
      if (p === 'users') {
        const [ru, rl] = await Promise.all([
          api.get('/super-admin/users'),
          api.get('/super-admin/locations'),
        ]);
        setUsers(ru.data); setLocations(rl.data);
      }
      if (p === 'locations') {
        const r = await api.get('/super-admin/locations');
        setLocations(r.data);
      }
      if (p === 'audit') {
        const r = await api.get('/super-admin/audit-log?limit=150');
        setAuditLog(r.data);
      }
    } catch { toast('Failed to load data', 'error'); }
    setLoading(false);
  }, [selectedConfigLoc]);

  useEffect(() => { load(page); }, [page]);

  // Load stock config when location changes
  useEffect(() => {
    if (page === 'stock-config' && selectedConfigLoc) {
      api.get(`/super-admin/stock-config/${selectedConfigLoc}`)
        .then(r => {
          setStockConfig(r.data);
          const init = {};
          r.data.forEach(item => {
            init[item.ingredient_id] = {
              max: item.max_quantity,
              min: item.min_quantity,
            };
          });
          setConfigEdits(init);
        })
        .catch(() => toast('Failed to load stock config', 'error'));
    }
  }, [selectedConfigLoc, page]);

  // ── User actions ──────────────────────────────────────────────────────────
  const createUser = async (e) => {
    e.preventDefault(); setFormLoading(true);
    try {
      await api.post('/super-admin/users', userForm);
      toast('User created!', 'success');
      setUserModal(false);
      setUserForm({ name: '', email: '', password: '', role: 'KITCHEN_USER', location_id: '' });
      load('users');
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error'); }
    setFormLoading(false);
  };

  const deactivateUser = async (id) => {
    try {
      await api.put(`/super-admin/users/${id}/deactivate`);
      toast('User deactivated', 'warning');
      load('users');
    } catch { toast('Failed to deactivate', 'error'); }
  };

  const resetUserPassword = async (e) => {
    e.preventDefault();
    if (!resetPwValue || resetPwValue.length < 6)
      return toast('Password must be at least 6 characters', 'error');
    setResetPwLoading(true);
    try {
      await api.post(`/super-admin/users/${resetPwModal.id}/reset-password`, { newPassword: resetPwValue });
      toast(`Password reset for ${resetPwModal.name}!`, 'success');
      setResetPwModal(null);
      setResetPwValue('');
    } catch (err) { toast(err.response?.data?.error || 'Failed to reset password', 'error'); }
    setResetPwLoading(false);
  };

  // ── Location actions ──────────────────────────────────────────────────────
  const createLocation = async (e) => {
    e.preventDefault(); setFormLoading(true);
    try {
      await api.post('/super-admin/locations', locForm);
      toast('Location created!', 'success');
      setLocModal(false);
      setLocForm({ location_code: '', name: '' });
      load('locations');
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error'); }
    setFormLoading(false);
  };

  // ── Ingredient actions ────────────────────────────────────────────────────
  const createIngredient = async (e) => {
    e.preventDefault(); setFormLoading(true);
    try {
      await api.post('/super-admin/ingredients', ingForm);
      toast(`${ingForm.name} added to master list!`, 'success');
      setIngModal(false);
      setIngForm({ name: '', unit: 'lb' });
      load('ingredients');
    } catch (err) { toast(err.response?.data?.error || 'Failed to add ingredient', 'error'); }
    setFormLoading(false);
  };

  const deactivateIngredient = async (id) => {
    try {
      await api.put(`/super-admin/ingredients/${id}/deactivate`);
      toast('Ingredient deactivated', 'warning');
      load('ingredients');
    } catch { toast('Failed', 'error'); }
  };

  // ── Stock Config actions ──────────────────────────────────────────────────
  const saveStockLimit = async (ingId) => {
    setSavingConfig(s => ({ ...s, [ingId]: true }));
    try {
      const { max, min } = configEdits[ingId] || {};
      await api.put(`/super-admin/stock-config/${selectedConfigLoc}/${ingId}`, {
        max_quantity: parseFloat(max) || 0,
        min_quantity: parseFloat(min) || 0,
      });
      toast('Stock limits saved!', 'success');
    } catch { toast('Failed to save', 'error'); }
    setSavingConfig(s => ({ ...s, [ingId]: false }));
  };

  const saveAllLimits = async () => {
    setFormLoading(true);
    let ok = 0;
    for (const [ingId, vals] of Object.entries(configEdits)) {
      try {
        await api.put(`/super-admin/stock-config/${selectedConfigLoc}/${ingId}`, {
          max_quantity: parseFloat(vals.max) || 0,
          min_quantity: parseFloat(vals.min) || 0,
        });
        ok++;
      } catch { }
    }
    toast(`${ok} stock limits saved!`, 'success');
    setFormLoading(false);
  };

  // ── Filters ───────────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredIng = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Chart summary stats ───────────────────────────────────────────────────
  const totalCritical = chartData.reduce((s, loc) =>
    s + loc.inventory.filter(i => i.status === 'CRITICAL').length, 0);

  const nav = NAV.map(n => ({
    ...n, active: page === n.key,
    onClick: () => setPage(n.key),
    badge: n.key === 'charts' ? totalCritical : 0,
  }));

  return (
    <Layout nav={nav}>
      {loading && page !== 'stock-config' ? <Spinner /> : (
        <>
          {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
          {page === 'dashboard' && stats && (
            <div className="space-y-6 fade-up">
              <SectionHeader title="System Overview" sub="WavaGrill IMS · Super Admin Control Center" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="fade-up-1"><StatCard icon="👥" label="Active Users" value={stats.total_users} gradient="bg-gradient-to-br from-slate-700 to-slate-900" /></div>
                <div className="fade-up-2"><StatCard icon="📍" label="Locations" value={stats.total_locations} gradient="bg-gradient-to-br from-blue-600 to-blue-800" /></div>
                <div className="fade-up-3"><StatCard icon="🥗" label="Ingredients" value={stats.total_ingredients} gradient="bg-gradient-to-br from-amber-500 to-amber-700" /></div>
                <div className="fade-up-4"><StatCard icon="🔴" label="Critical Items" value={stats.critical_count} gradient="bg-gradient-to-br from-red-500 to-red-700" /></div>
              </div>

              {/* Location status grid */}
              <div>
                <h3 className="font-semibold text-slate-600 text-sm uppercase tracking-wide mb-3">Location Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {locations.map(loc => (
                    <div key={loc.id} className="card-sm flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => setPage('charts')}>
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-base">📍</div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{loc.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{loc.location_code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  ['📈 Stock Charts', 'charts'],
                  ['⚙️ Stock Limits', 'stock-config'],
                  ['🥗 Ingredients', 'ingredients'],
                  ['👥 Users', 'users'],
                  ['📍 Locations', 'locations'],
                  ['📋 Audit Log', 'audit'],
                ].map(([label, key]) => (
                  <button key={key} onClick={() => setPage(key)}
                    className="card hover:shadow-elevated transition-all cursor-pointer text-left group p-4">
                    <p className="font-semibold text-slate-800 group-hover:text-amber-600 transition-colors text-sm">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">View and manage →</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CHARTS ────────────────────────────────────────────────────── */}
          {page === 'charts' && (
            <div className="space-y-5 fade-up">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 font-heading">Stock Charts</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Live ingredient levels across all 4 locations</p>
                </div>
                <button onClick={() => load('charts')} className="btn-secondary">🔄 Refresh</button>
              </div>

              {/* Summary strip */}
              {chartData.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Items Tracked', value: chartData.reduce((s, l) => s + l.inventory.length, 0), color: 'text-slate-800' },
                    { label: 'Low Stock Alerts', value: chartData.reduce((s, l) => s + l.inventory.filter(i => i.status === 'LOW').length, 0), color: 'text-amber-600' },
                    { label: 'Critical Alerts', value: totalCritical, color: 'text-red-600' },
                  ].map(s => (
                    <div key={s.label} className="card-sm text-center">
                      <p className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 4 location charts */}
              {loading ? <Spinner /> : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {chartData.map(loc => (
                    <LocationChart key={loc.id} location={loc.location} inventory={loc.inventory} />
                  ))}
                  {!chartData.length && <Empty icon="📊" message="No chart data available" sub="Add ingredients and set max quantities first." />}
                </div>
              )}

              {/* Combined overview chart */}
              {chartData.length > 0 && (() => {
                // Build a combined dataset: for each ingredient, show all locations
                const allIngredients = [...new Set(chartData.flatMap(l => l.inventory.map(i => i.ingredient_name)))];
                const combined = allIngredients.map(ing => {
                  const row = { name: ing.length > 12 ? ing.slice(0, 12) + '…' : ing };
                  chartData.forEach(loc => {
                    const item = loc.inventory.find(i => i.ingredient_name === ing);
                    row[loc.location] = item ? parseFloat(item.current_quantity) : 0;
                  });
                  return row;
                });
                const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];
                return (
                  <div className="card">
                    <h3 className="font-bold text-slate-800 font-heading mb-1">All Locations — Side by Side</h3>
                    <p className="text-xs text-slate-400 mb-4">Current stock comparison across all locations</p>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={combined} margin={{ top: 0, right: 0, bottom: 24, left: 0 }} barSize={12}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={30} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                        {chartData.map((loc, i) => (
                          <Bar key={loc.id} dataKey={loc.location} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── INGREDIENTS ───────────────────────────────────────────────── */}
          {page === 'ingredients' && (
            <div className="space-y-5 fade-up">
              <SectionHeader
                title="Ingredient Master List"
                sub={`${ingredients.length} active ingredients · Super Admin manages this list`}
                action={<button onClick={() => setIngModal(true)} className="btn-primary">+ Add Ingredient</button>}
              />
              <div className="card-sm">
                <SearchInput value={search} onChange={setSearch} placeholder="Search ingredients…" />
              </div>
              <div className="card p-0 overflow-hidden">
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr>
                      {['#', 'Ingredient', 'Unit', 'System', 'Status', ''].map(h => <th key={h}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {filteredIng.map((ing, i) => (
                        <tr key={ing.id}>
                          <td className="text-slate-400 font-mono text-xs">{String(ing.id).padStart(3, '0')}</td>
                          <td className="font-medium text-slate-800">{ing.name}</td>
                          <td>
                            <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-mono font-medium">
                              {ing.unit}
                            </span>
                          </td>
                          <td className="text-slate-400 text-xs">
                            {['tsp', 'tbsp', 'fl oz', 'cup', 'pt', 'qt', 'gal'].includes(ing.unit) ? 'US Volume' :
                              ['oz', 'lb'].includes(ing.unit) ? 'US Weight' :
                                ['ml', 'liters'].includes(ing.unit) ? 'Metric Volume' :
                                  ['g', 'kg'].includes(ing.unit) ? 'Metric Weight' : 'Count'}
                          </td>
                          <td><span className="badge-active">Active</span></td>
                          <td>
                            <button onClick={() => setConfirmDelIng(ing.id)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                              Deactivate
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!filteredIng.length && (
                        <tr><td colSpan="6">
                          <Empty icon="🥗" message="No ingredients found" sub='Click "+ Add Ingredient" to get started.' />
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── STOCK CONFIG (Max + Min per location) ─────────────────────── */}
          {page === 'stock-config' && (
            <div className="space-y-5 fade-up">
              <SectionHeader
                title="Stock Limits"
                sub="Set Max and Min quantities per location · Super Admin only"
                action={
                  <button onClick={saveAllLimits} disabled={formLoading} className="btn-primary">
                    {formLoading ? 'Saving…' : '💾 Save All Changes'}
                  </button>
                }
              />

              {/* Location selector */}
              <div className="card-sm flex items-center gap-4 flex-wrap">
                <p className="text-sm font-medium text-slate-600">Select Location:</p>
                <div className="flex gap-2 flex-wrap">
                  {locations.filter(l => l.is_active).map(loc => (
                    <button key={loc.id}
                      onClick={() => setSelectedConfigLoc(String(loc.id))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${selectedConfigLoc === String(loc.id)
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}>
                      📍 {loc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-sm text-amber-800">
                <span className="text-lg">⚙️</span>
                <div>
                  <span className="font-semibold">Super Admin only:</span> Max quantity = target stock level. Min quantity = alert threshold (if 0, system uses 40% of max).
                </div>
              </div>

              {/* Config table */}
              {loading ? <TableSkeleton rows={5} cols={5} /> : (
                <div className="card p-0 overflow-hidden">
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr>
                        <th>Ingredient</th>
                        <th>Unit</th>
                        <th>Current Stock</th>
                        <th className="text-amber-300">Min Quantity ⚠️</th>
                        <th className="text-emerald-300">Max Quantity ✓</th>
                        <th>Level</th>
                        <th></th>
                      </tr></thead>
                      <tbody>
                        {stockConfig.map((item) => {
                          const edits = configEdits[item.ingredient_id] || { max: item.max_quantity, min: item.min_quantity };
                          const isSaving = savingConfig[item.ingredient_id];
                          return (
                            <tr key={item.ingredient_id}>
                              <td className="font-medium text-slate-800">{item.ingredient_name}</td>
                              <td>
                                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-mono">
                                  {item.unit}
                                </span>
                              </td>
                              <td className="font-semibold">{item.current_quantity}</td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="input w-24 py-1.5 text-sm border-amber-200 focus:ring-amber-400"
                                  value={edits.min}
                                  onChange={e => setConfigEdits(c => ({
                                    ...c,
                                    [item.ingredient_id]: { ...edits, min: e.target.value }
                                  }))}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="input w-24 py-1.5 text-sm border-emerald-200 focus:ring-emerald-400"
                                  value={edits.max}
                                  onChange={e => setConfigEdits(c => ({
                                    ...c,
                                    [item.ingredient_id]: { ...edits, max: e.target.value }
                                  }))}
                                />
                              </td>
                              <td className="min-w-[120px]">
                                <StockBar
                                  current={item.current_quantity}
                                  max={parseFloat(edits.max) || item.max_quantity || 1}
                                />
                              </td>
                              <td>
                                <button
                                  onClick={() => saveStockLimit(item.ingredient_id)}
                                  disabled={isSaving}
                                  className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50">
                                  {isSaving ? '…' : 'Save'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {!stockConfig.length && (
                          <tr><td colSpan="7">
                            <Empty icon="⚙️" message="No ingredients configured" sub="Add ingredients first, then set limits here." />
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── USERS ─────────────────────────────────────────────────────── */}
          {page === 'users' && (
            <div className="space-y-5 fade-up">
              <SectionHeader
                title="User Accounts"
                sub={`${users.length} total users`}
                action={<button onClick={() => setUserModal(true)} className="btn-primary">+ Add User</button>}
              />
              <div className="card-sm">
                <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" />
              </div>
              <div className="card p-0 overflow-hidden">
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr>
                      {['Name', 'Email', 'Role', 'Location', 'Status', '', ''].map((h, i) => <th key={i}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td className="font-medium text-slate-800">{u.name}</td>
                          <td className="text-slate-500">{u.email}</td>
                          <td><RoleBadge role={u.role} /></td>
                          <td>{u.location_name || <span className="text-slate-300">—</span>}</td>
                          <td>
                            <span className={u.is_active ? 'badge-active' : 'badge-inactive'}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => { setResetPwModal({ id: u.id, name: u.name }); setResetPwValue(''); }}
                              className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors">
                              🔑 Reset Pwd
                            </button>
                          </td>
                          <td>
                            {u.is_active && (
                              <button onClick={() => setConfirmDel(u.id)}
                                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                                Deactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!filteredUsers.length && (
                        <tr><td colSpan="7"><Empty icon="👤" message="No users found" /></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── LOCATIONS ─────────────────────────────────────────────────── */}
          {page === 'locations' && (
            <div className="space-y-5 fade-up">
              <SectionHeader
                title="Restaurant Locations"
                sub={`${locations.length} locations configured`}
                action={<button onClick={() => setLocModal(true)} className="btn-primary">+ Add Location</button>}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {locations.map(loc => (
                  <div key={loc.id} className="card flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl flex-shrink-0 shadow-amber-glow">
                      📍
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{loc.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{loc.location_code}</p>
                    </div>
                    <span className={loc.is_active ? 'badge-active' : 'badge-inactive'}>
                      {loc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
                {!locations.length && <Empty icon="📍" message="No locations configured" />}
              </div>
            </div>
          )}

          {/* ── AUDIT LOG ─────────────────────────────────────────────────── */}
          {page === 'audit' && (
            <div className="space-y-5 fade-up">
              <SectionHeader title="Audit Log" sub="Tamper-evident record of all system actions" />
              <div className="card p-0 overflow-hidden">
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr>
                      {['Time', 'User', 'Role', 'Action', 'Details'].map(h => <th key={h}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {auditLog.map(a => (
                        <tr key={a.id}>
                          <td className="text-slate-400 text-xs whitespace-nowrap">
                            {new Date(a.created_at).toLocaleString()}
                          </td>
                          <td className="font-medium">{a.user_name}</td>
                          <td><RoleBadge role={a.user_role} /></td>
                          <td>
                            <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                              {a.action}
                            </span>
                          </td>
                          <td className="text-slate-400 text-xs max-w-[200px] truncate">
                            {a.new_value || a.target_table || '—'}
                          </td>
                        </tr>
                      ))}
                      {!auditLog.length && (
                        <tr><td colSpan="5"><Empty icon="📋" message="No audit records yet" /></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MODALS ────────────────────────────────────────────────────────── */}

      {/* Add User */}
      <Modal open={userModal} onClose={() => setUserModal(false)} title="Add New User">
        <form onSubmit={createUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name">
              <input className="input" value={userForm.name} required placeholder="Jane Smith"
                onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Email">
              <input className="input" type="email" value={userForm.email} required placeholder="jane@wavagrill.com"
                onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Password">
              <input className="input" type="password" value={userForm.password} required placeholder="Min. 8 chars"
                onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} />
            </Field>
            <Field label="Role">
              <select className="input" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                <option value="KITCHEN_USER">Kitchen User</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </Field>
          </div>
          {userForm.role === 'KITCHEN_USER' && (
            <Field label="Assign Location">
              <select className="input" value={userForm.location_id} required
                onChange={e => setUserForm(f => ({ ...f, location_id: e.target.value }))}>
                <option value="">Select location…</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setUserModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={formLoading}>
              {formLoading ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Location */}
      <Modal open={locModal} onClose={() => setLocModal(false)} title="Add Restaurant Location" size="sm">
        <form onSubmit={createLocation} className="space-y-4">
          <Field label="Location Code">
            <input className="input" placeholder="e.g. LOC-005" value={locForm.location_code} required
              onChange={e => setLocForm(f => ({ ...f, location_code: e.target.value }))} />
          </Field>
          <Field label="Location Name">
            <input className="input" placeholder="e.g. Frisco" value={locForm.name} required
              onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setLocModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={formLoading}>
              {formLoading ? 'Creating…' : 'Create Location'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Ingredient */}
      <Modal open={ingModal} onClose={() => setIngModal(false)} title="Add Ingredient" size="sm">
        <form onSubmit={createIngredient} className="space-y-4">
          <Field label="Ingredient Name">
            <input className="input" placeholder="e.g. Chicken Breast" value={ingForm.name} required
              onChange={e => setIngForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Unit of Measurement">
            <UnitSelect value={ingForm.unit} onChange={v => setIngForm(f => ({ ...f, unit: v }))} />
          </Field>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            ℹ️ This ingredient will be added to all active locations. Set max/min quantities in <strong>Stock Limits</strong>.
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setIngModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={formLoading}>
              {formLoading ? 'Adding…' : '+ Add Ingredient'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm deactivate user */}
      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => deactivateUser(confirmDel)}
        title="Deactivate User"
        message="This user will lose access immediately. Their historical data is preserved."
        danger
      />

      {/* Reset user password (Super Admin only) */}
      <Modal open={!!resetPwModal} onClose={() => { setResetPwModal(null); setResetPwValue(''); }} title="Reset User Password" size="sm">
        <p className="text-sm text-slate-500 mb-4">
          Set a new password for <span className="font-semibold text-slate-800">{resetPwModal?.name}</span>.
          The user should change it after logging in.
        </p>
        <form onSubmit={resetUserPassword} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" placeholder="Min. 6 characters" required
              value={resetPwValue}
              onChange={e => setResetPwValue(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setResetPwModal(null); setResetPwValue(''); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={resetPwLoading}>
              {resetPwLoading ? 'Resetting…' : '🔑 Reset Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm deactivate ingredient */}
      <ConfirmDialog
        open={!!confirmDelIng}
        onClose={() => setConfirmDelIng(null)}
        onConfirm={() => deactivateIngredient(confirmDelIng)}
        title="Deactivate Ingredient"
        message="This ingredient will be hidden from all dashboards. Stock history is preserved."
        danger
      />
    </Layout>
  );
}
