"use client";
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { StatusBadge, StockBar, StatCard, Spinner, Empty, SectionHeader } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/axios';
import { Package, PenLine, ScrollText, CheckCircle2, AlertTriangle, AlertOctagon, Truck, ShieldAlert } from 'lucide-react';

const NAV = [
  { key: 'inventory', icon: <Package size={20} />, label: 'My Inventory' },
  { key: 'update', icon: <PenLine size={20} />, label: 'Update Stock' },
  { key: 'history', icon: <ScrollText size={20} />, label: 'Supply History' },
];

export default function KitchenDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState('inventory');
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updates, setUpdates] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { loadInitial(); }, []);
  useEffect(() => { if (page === 'history') loadHistory(); }, [page]);

  const loadInitial = async () => {
    setLoading(true);
    await Promise.all([loadInventory(), loadHistory()]);
    setLoading(false);
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const r = await api.get('/kitchen/inventory');
      setData(r.data);
      const init = {};
      r.data.inventory.forEach(item => { init[item.ingredient_id] = item.current_quantity; });
      setUpdates(init);
      setDirty(false);
    } catch { toast('Failed to load inventory', 'error'); }
    setLoading(false);
  };

  const loadHistory = async () => {
    setLoading(true);
    const r = await api.get('/kitchen/supply-history');
    setHistory(r.data);
    setLoading(false);
  };

  const acknowledgeSupply = async (id) => {
    try {
      await api.put(`/kitchen/supply-history/${id}/acknowledge`);
      toast('Delivery acknowledged!', 'success');
      loadHistory(); // Reload to remove the notification
      loadInventory(); // Reload to update the percentage bars and counts
    } catch { toast('Failed to acknowledge delivery', 'error'); }
  };

  const submitUpdate = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(updates).map(([ingredient_id, current_quantity]) => ({
        ingredient_id: parseInt(ingredient_id),
        current_quantity: parseFloat(current_quantity) || 0,
      }));
      await api.put('/kitchen/inventory/update', { updates: payload });
      toast('Stock updated successfully!', 'success');
      setDirty(false);
      loadInventory();
    } catch { toast('Update failed. Please try again.', 'error'); }
    setSaving(false);
  };

  const setQty = (ingId, val) => {
    setUpdates(u => ({ ...u, [ingId]: val }));
    setDirty(true);
  };

  const getStatus = (current, max) => {
    const pct = max > 0 ? (current / max) * 100 : 0;
    return pct >= 80 ? 'OK' : pct >= 40 ? 'LOW' : 'CRITICAL';
  };

  const inventory = data?.inventory || [];
  const location = data?.location;
  const critical = inventory.filter(i => i.status === 'CRITICAL').length;
  const low = inventory.filter(i => i.status === 'LOW').length;
  const ok = inventory.filter(i => i.status === 'OK').length;
  const unreadSupplies = history.filter(h => h.is_acknowledged === 0);

  const nav = NAV.map(n => ({
    ...n, active: page === n.key,
    onClick: () => setPage(n.key),
    badge: n.key === 'inventory' ? critical : 0,
  }));

  return (
    <Layout nav={nav}>
      {loading && page === 'inventory' ? <Spinner /> : (
        <>
          {/* INVENTORY */}
          {page === 'inventory' && (
            <div className="space-y-6 fade-up">
              <SectionHeader
                title={location?.name || user?.name}
                sub={`${location?.location_code} · Kitchen User Dashboard`}
                action={<button onClick={() => { loadInventory(); loadHistory(); }} className="btn-secondary">🔄 Refresh</button>}
              />

              {/* Dispatch Notifications */}
              {unreadSupplies.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Truck size={28} className="text-blue-600" />
                    <h3 className="font-bold text-blue-900 text-lg">New Supplies Dispatched</h3>
                  </div>
                  <div className="space-y-2">
                    {unreadSupplies.map(supply => (
                      <div key={supply.id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-blue-100">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {supply.quantity_dispatched} {supply.unit} of {supply.ingredient_name}
                          </p>
                          <p className="text-xs text-slate-500">Sent on {new Date(supply.dispatched_at).toLocaleString()}</p>
                        </div>
                        <button onClick={() => acknowledgeSupply(supply.id)} className="btn-primary text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700">
                          Acknowledge Delivery
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <StatCard icon={<CheckCircle2 size={20} strokeWidth={1.5} />} label="OK Items" value={ok} gradient="bg-[#10B981]" overlayClass="bg-white/10" />
                <StatCard icon={<AlertTriangle size={20} strokeWidth={1.5} />} label="Low Stock" value={low} gradient="bg-[#E68200]" overlayClass="bg-white/10" />
                <StatCard icon={<AlertOctagon size={20} strokeWidth={1.5} />} label="Critical" value={critical} gradient="bg-[#E40026]" overlayClass="bg-white/10" />
              </div>

              {/* Alerts */}
              {critical > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                  <ShieldAlert size={32} className="text-red-500" />
                  <div>
                    <p className="font-semibold text-red-800">
                      {critical} item{critical > 1 ? 's' : ''} need immediate restocking
                    </p>
                    <p className="text-sm text-red-600">The Central Kitchen has been notified via your stock updates.</p>
                  </div>
                  <button onClick={() => setPage('update')} className="ml-auto btn-danger text-sm">
                    Update Now
                  </button>
                </div>
              )}

              {/* Inventory cards */}
              <div className="card p-0 overflow-hidden">
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr>
                      {['Ingredient', 'Unit', 'Stock Level', 'Max', 'Supplied', 'Current', 'Gap', 'Status'].map(h =>
                        <th key={h}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {inventory.map(item => (
                        <tr key={item.id}>
                          <td className="font-medium text-slate-800">{item.ingredient_name}</td>
                          <td><span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{item.unit}</span></td>
                          <td className="min-w-[140px]">
                            <StockBar current={item.current_quantity} max={item.max_quantity} />
                          </td>
                          <td className="text-slate-500">{item.max_quantity}</td>
                          <td className="text-blue-600 font-medium">{item.already_supplied}</td>
                          <td className="font-bold text-slate-800">{item.current_quantity}</td>
                          <td className={parseFloat(item.gap) > 0 ? 'text-red-600 font-bold' : 'text-emerald-500 font-medium'}>
                            {parseFloat(item.gap) > 0 ? `↓ ${item.gap} ${item.unit}` : '✓ Full'}
                          </td>
                          <td><StatusBadge status={item.status} /></td>
                        </tr>
                      ))}
                      {!inventory.length && (
                        <tr><td colSpan="8"><Empty icon={<Package size={48} className="mx-auto text-slate-300" />} message="No inventory assigned" sub="Contact your admin to set up your location's inventory." /></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* UPDATE STOCK */}
          {page === 'update' && (
            <div className="space-y-5 fade-up">
              <SectionHeader title="Update Stock" sub="Enter the actual on-hand quantity for each item." />

              {dirty && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-xl">💾</span>
                  <p className="text-sm text-amber-800 font-medium flex-1">You have unsaved changes.</p>
                  <button onClick={submitUpdate} disabled={saving} className="btn-primary text-sm">
                    {saving ? 'Saving…' : 'Save Now'}
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {inventory.map(item => {
                  const cur = parseFloat(updates[item.ingredient_id] ?? item.current_quantity) || 0;
                  const status = getStatus(cur, item.max_quantity);
                  const pct = item.max_quantity > 0 ? Math.min(100, (cur / item.max_quantity) * 100) : 0;
                  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-500';

                  return (
                    <div key={item.ingredient_id}
                      className={`card border-l-4 ${status === 'CRITICAL' ? 'border-l-red-500' : status === 'LOW' ? 'border-l-amber-400' : 'border-l-emerald-500'}`}>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-slate-800">{item.ingredient_name}</p>
                            <StatusBadge status={status} />
                          </div>
                          <div className="progress-bar mb-1">
                            <div className={`progress-fill ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>0 {item.unit}</span>
                            <span>Max: {item.max_quantity} {item.unit}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => setQty(item.ingredient_id, Math.max(0, cur - 1))}
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors flex items-center justify-center">
                            −
                          </button>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max={item.max_quantity}
                              className="input w-24 text-center font-bold"
                              value={updates[item.ingredient_id] ?? item.current_quantity}
                              onChange={e => setQty(item.ingredient_id, e.target.value)}
                            />
                            <span className="absolute -bottom-4 left-0 right-0 text-center text-xs text-slate-400">{item.unit}</span>
                          </div>
                          <button
                            onClick={() => setQty(item.ingredient_id, Math.min(item.max_quantity, cur + 1))}
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors flex items-center justify-center">
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {inventory.length > 0 && (
                <div className="sticky bottom-4">
                  <button onClick={submitUpdate} disabled={saving || !dirty}
                    className={`btn-primary w-full justify-center py-4 text-base shadow-xl transition-all
                      ${dirty ? 'shadow-amber-500/30' : 'opacity-50 cursor-not-allowed'}`}>
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving…
                      </span>
                    ) : '✅ Submit Stock Update'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SUPPLY HISTORY */}
          {page === 'history' && (
            <div className="space-y-5 fade-up">
              <SectionHeader title="Supply Received" sub={`Deliveries to ${location?.name}`} />
              {loading ? <Spinner /> : (
                <div className="card p-0 overflow-hidden">
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr>{['Date & Time', 'Ingredient', 'Quantity Received', 'Notes'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {history.map((h, i) => (
                          <tr key={i}>
                            <td className="text-slate-400 text-xs whitespace-nowrap">{new Date(h.dispatched_at).toLocaleString()}</td>
                            <td className="font-medium">{h.ingredient_name}</td>
                            <td>
                              <span className="bg-emerald-50 text-emerald-700 font-bold text-sm px-2.5 py-1 rounded-lg">
                                +{h.quantity_dispatched} {h.unit}
                              </span>
                            </td>
                            <td className="text-slate-400">{h.notes || '—'}</td>
                          </tr>
                        ))}
                        {!history.length && <tr><td colSpan="4"><Empty icon={<ScrollText size={48} className="mx-auto text-slate-300" />} message="No deliveries yet" sub="Supply history will appear here once the Central Kitchen dispatches to your location." /></td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
