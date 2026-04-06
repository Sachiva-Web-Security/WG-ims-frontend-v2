"use client";
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { StatusBadge, StockBar, StatCard, Spinner, Empty, SectionHeader, Modal } from '@/components/UI';
import { SupplyBill } from '@/components/SupplyBill';
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
  const [selectedBill, setSelectedBill] = useState(null);
  const [billModal, setBillModal] = useState(false);
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const [pendingPage, setPendingPage] = useState(null);
  const [pendingLogout, setPendingLogout] = useState(false);
  const [logoutResolver, setLogoutResolver] = useState(null);

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
      return true;
    } catch {
      toast('Update failed. Please try again.', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const setQty = (ingId, val) => {
    setUpdates(u => ({ ...u, [ingId]: val }));
    setDirty(true);
  };

  const openUnsavedModal = () => setUnsavedModalOpen(true);

  const closeUnsavedModal = () => {
    setUnsavedModalOpen(false);
    setPendingPage(null);
    setPendingLogout(false);
    if (logoutResolver) {
      logoutResolver(false);
      setLogoutResolver(null);
    }
  };

  const continuePendingAction = () => {
    if (pendingPage) {
      setPage(pendingPage);
      setPendingPage(null);
    }

    if (pendingLogout && logoutResolver) {
      logoutResolver(true);
      setLogoutResolver(null);
      setPendingLogout(false);
    }

    setUnsavedModalOpen(false);
  };

  const handleSaveAndContinue = async () => {
    const ok = await submitUpdate();
    if (!ok) return;
    continuePendingAction();
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

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
    onClick: () => {
      if (page === n.key) return;
      if (dirty) {
        setPendingPage(n.key);
        setPendingLogout(false);
        openUnsavedModal();
        return;
      }
      setPage(n.key);
    },
    badge: n.key === 'inventory' ? critical : 0,
  }));

  const handleBeforeLogout = () => {
    if (!dirty) return true;
    setPendingPage(null);
    setPendingLogout(true);
    openUnsavedModal();
    return new Promise((resolve) => setLogoutResolver(() => resolve));
  };

  return (
    <Layout nav={nav} onBeforeLogout={handleBeforeLogout}>
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
                <div className="hidden md:block table-wrap">
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
                          <td className="min-w-35">
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

                <div className="md:hidden p-3 space-y-3">
                  {inventory.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-slate-800 text-sm">{item.ingredient_name}</p>
                        <StatusBadge status={item.status} />
                      </div>

                      <div className="mb-2">
                        <StockBar current={item.current_quantity} max={item.max_quantity} />
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                        <div>
                          <p className="text-slate-400">Unit</p>
                          <p className="text-slate-700 font-medium">{item.unit}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Max</p>
                          <p className="text-slate-700 font-medium">{item.max_quantity}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Supplied</p>
                          <p className="text-blue-600 font-semibold">{item.already_supplied}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Current</p>
                          <p className="text-slate-800 font-semibold">{item.current_quantity}</p>
                        </div>
                      </div>

                      <div className="mt-2 text-xs">
                        <p className="text-slate-400">Gap</p>
                        <p className={parseFloat(item.gap) > 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-semibold'}>
                          {parseFloat(item.gap) > 0 ? `↓ ${item.gap} ${item.unit}` : 'Full'}
                        </p>
                      </div>
                    </div>
                  ))}

                  {!inventory.length && (
                    <Empty icon={<Package size={48} className="mx-auto text-slate-300" />} message="No inventory assigned" sub="Contact your admin to set up your location's inventory." />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* UPDATE STOCK */}
          {page === 'update' && (
            <div className="space-y-5 fade-up">
              <SectionHeader title="Update Stock" sub="Enter the actual on-hand quantity for each item." />

              <div className="min-h-[74px]">
                <div
                  className={`bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 transition-all duration-150 ${dirty ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
                >
                  <span className="text-xl">💾</span>
                  <p className="text-sm text-amber-800 font-medium flex-1">You have unsaved changes.</p>
                  <button onClick={submitUpdate} disabled={saving || !dirty} className="btn-primary text-sm">
                    {saving ? 'Saving…' : 'Save Now'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {inventory.map(item => {
                  const cur = parseFloat(updates[item.ingredient_id] ?? item.current_quantity) || 0;
                  const status = getStatus(cur, item.max_quantity);
                  const pct = item.max_quantity > 0 ? Math.min(100, (cur / item.max_quantity) * 100) : 0;
                  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-500';

                  return (
                    <div key={item.ingredient_id}
                      className={`card p-4 sm:p-5 border-l-4 ${status === 'CRITICAL' ? 'border-l-red-500' : status === 'LOW' ? 'border-l-amber-400' : 'border-l-emerald-500'}`}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 mb-2">
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

                        <div className="flex items-center justify-end gap-2 shrink-0">
                          <button
                            onClick={() => setQty(item.ingredient_id, Math.max(0, cur - 1))}
                            className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors flex items-center justify-center">
                            −
                          </button>
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max={item.max_quantity}
                              className="input w-22 sm:w-24 h-10 text-center font-bold px-2"
                              value={updates[item.ingredient_id] ?? item.current_quantity}
                              onChange={e => setQty(item.ingredient_id, e.target.value)}
                            />
                            <span className="mt-1 text-[11px] text-slate-400">{item.unit}</span>
                          </div>
                          <button
                            onClick={() => setQty(item.ingredient_id, Math.min(item.max_quantity, cur + 1))}
                            className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors flex items-center justify-center">
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {inventory.length > 0 && (
                <div className="sticky bottom-3 z-10 rounded-2xl bg-white/85 backdrop-blur-sm border border-slate-200 p-2 shadow-lg">
                  <button onClick={submitUpdate} disabled={saving || !dirty}
                    className={`btn-primary w-full justify-center py-4 text-base shadow-xl transition-all
                      ${dirty ? 'shadow-amber-500/30' : 'opacity-50 cursor-not-allowed'}`}>
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving…
                      </span>
                    ) : 'Submit Stock Update'}
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
                  <div className="hidden md:block table-wrap">
                    <table className="table">
                      <thead><tr>{['Date & Time', 'Ingredient', 'Quantity Received', 'Notes', 'Action'].map(h => <th key={h}>{h}</th>)}</tr></thead>
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
                            <td>
                              <button 
                                onClick={() => { setSelectedBill(h); setBillModal(true); }}
                                className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 group"
                              >
                                <ScrollText size={14} className="group-hover:scale-110 transition-transform" /> View Bill
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!history.length && <tr><td colSpan="5"><Empty icon={<ScrollText size={48} className="mx-auto text-slate-300" />} message="No deliveries yet" sub="Supply history will appear here once the Central Kitchen dispatches to your location." /></td></tr>}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden p-3 space-y-3">
                    {history.map((h, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-800 text-sm">{h.ingredient_name}</p>
                          <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2 py-0.5 rounded-lg">
                            +{h.quantity_dispatched} {h.unit}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-2">{new Date(h.dispatched_at).toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">{h.notes || 'No notes'}</p>

                        <button
                          onClick={() => { setSelectedBill(h); setBillModal(true); }}
                          className="mt-3 text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"
                        >
                          <ScrollText size={14} /> View Bill
                        </button>
                      </div>
                    ))}

                    {!history.length && (
                      <Empty icon={<ScrollText size={48} className="mx-auto text-slate-300" />} message="No deliveries yet" sub="Supply history will appear here once the Central Kitchen dispatches to your location." />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      <SupplyBill 
        isOpen={billModal} 
        onClose={() => setBillModal(false)} 
        dispatch={{...selectedBill, location_name: location?.name}} 
      />

      <Modal open={unsavedModalOpen} onClose={closeUnsavedModal} title="Unsaved Stock Changes" size="sm">
        <p className="text-sm text-slate-600 mb-5">
          You have unsaved stock changes. Save before leaving this page?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={closeUnsavedModal} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSaveAndContinue} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
