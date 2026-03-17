"use client";
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { StatusBadge, StockBar, StatCard, Spinner, Empty, Modal, SearchInput, SectionHeader, Field, TableSkeleton } from '@/components/UI';
import { SupplyBill } from '@/components/SupplyBill';
import { useToast } from '@/context/ToastContext';
import { UnitSelect } from '@/utils/units';
import api from '@/lib/axios';
import { LayoutDashboard, Store, Salad, Truck, ScrollText, FileText, AlertTriangle, AlertOctagon, Info, Package, Check, X } from 'lucide-react';

const NAV = [
  { key: 'overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
  { key: 'location', icon: <Store size={20} />, label: 'Location Detail' },
  { key: 'ingredients', icon: <Salad size={20} />, label: 'Ingredients' },
  { key: 'dispatch', icon: <Truck size={20} />, label: 'Dispatch Supply' },
  { key: 'history', icon: <ScrollText size={20} />, label: 'Supply History' },
];

export default function AdminDashboard() {
  const toast = useToast();
  const [page, setPage] = useState('overview');
  const [dashboard, setDashboard] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invLoading, setInvLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [ingModal, setIngModal] = useState(false);
  const [ingForm, setIngForm] = useState({ name: '', unit: 'lb' });
  const [ingLoading, setIngLoading] = useState(false);
  const [dispatch, setDispatch] = useState({ location_id: '', items: [], notes: '' });
  const [currentDispatchItem, setCurrentDispatchItem] = useState({ ingredient_id: '', quantity: '' });
  const [dispatching, setDispatching] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billModal, setBillModal] = useState(false);

  useEffect(() => { loadInitial(); }, []);
  useEffect(() => {
    if (page === 'ingredients') loadIngredients();
    if (page === 'history') loadHistory();
    if (page === 'dispatch') loadIngredients();
    if (page === 'location' && !selectedLoc && locations.length) setSelectedLoc(locations[0].id);
  }, [page]);
  useEffect(() => { if (selectedLoc) loadInventory(selectedLoc); }, [selectedLoc]);
  useEffect(() => {
    if (page === 'location' && !selectedLoc && locations.length) setSelectedLoc(locations[0].id);
  }, [locations]);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [rDash, rLoc] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/locations')
      ]);
      setDashboard(rDash.data);
      setLocations(rLoc.data);
    } catch { toast('Failed to load dashboard', 'error'); }
    setLoading(false);
  };

  const loadDashboard = async () => { setLoading(true); const r = await api.get('/admin/dashboard'); setDashboard(r.data); setLoading(false); };
  const loadLocations = async () => { const r = await api.get('/admin/locations'); setLocations(r.data); };
  const loadInventory = async (id) => { setInvLoading(true); const r = await api.get(`/admin/locations/${id}/inventory`); setInventory(r.data); setInvLoading(false); };
  const loadIngredients = async () => { const r = await api.get('/admin/ingredients'); setIngredients(r.data); };
  const loadHistory = async () => {
    const r = await api.get('/admin/supply/history');
    // Group records by batch_id
    const grouped = r.data.reduce((acc, curr) => {
      const bid = curr.batch_id || `SINGLE-${curr.id}`;
      if (!acc[bid]) {
        acc[bid] = {
          ...curr,
          items: []
        };
      }
      acc[bid].items.push({
        name: curr.ingredient_name,
        quantity: curr.quantity_dispatched,
        unit: curr.unit
      });
      return acc;
    }, {});
    setHistory(Object.values(grouped));
  };

  const createIngredient = async (e) => {
    e.preventDefault(); setIngLoading(true);
    try {
      await api.post('/admin/ingredients', ingForm);
      toast(`${ingForm.name} added!`, 'success');
      setIngModal(false); setIngForm({ name: '', unit: 'lb' });
      loadIngredients();
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error'); }
    setIngLoading(false);
  };

  const addDispatchItem = () => {
    if (!currentDispatchItem.ingredient_id || !currentDispatchItem.quantity) return;
    const ing = ingredients.find(i => String(i.id) === String(currentDispatchItem.ingredient_id));
    setDispatch(prev => ({
      ...prev,
      items: [...prev.items, {
        ...currentDispatchItem,
        name: ing?.name,
        unit: ing?.unit
      }]
    }));
    setCurrentDispatchItem({ ingredient_id: '', quantity: '' });
  };

  const removeDispatchItem = (index) => {
    setDispatch(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const dispatchSupply = async (e) => {
    e.preventDefault();
    if (!dispatch.location_id || dispatch.items.length === 0) return;

    setDispatching(true);
    try {
      const res = await api.post('/admin/supply/dispatch', {
        location_id: parseInt(dispatch.location_id),
        items: dispatch.items.map(it => ({
          ingredient_id: parseInt(it.ingredient_id),
          quantity: parseFloat(it.quantity)
        })),
        notes: dispatch.notes,
      });
      toast('Supply batch dispatched!', 'success');

      const loc = locations.find(l => String(l.id) === String(dispatch.location_id));

      setSelectedBill({
        batch_id: res.data.batch_id,
        location_name: loc?.name,
        items: dispatch.items,
        notes: dispatch.notes,
        dispatched_at: new Date().toISOString()
      });
      setBillModal(true);

      setDispatch({ location_id: '', items: [], notes: '' });
      loadDashboard();
    } catch (err) { toast(err.response?.data?.error || 'Dispatch failed', 'error'); }
    setDispatching(false);
  };

  const totalCritical = dashboard.reduce((s, l) => s + Number(l.critical_count || 0), 0);
  const totalLow = dashboard.reduce((s, l) => s + Number(l.low_count || 0), 0);
  const filteredInv = inventory.filter(i => i.ingredient_name.toLowerCase().includes(search.toLowerCase()));
  const currentLocName = locations.find(l => String(l.id) === String(selectedLoc))?.name;
  const selectedIng = ingredients.find(i => String(i.id) === String(currentDispatchItem.ingredient_id));

  const nav = NAV.map(n => ({
    ...n, active: page === n.key,
    onClick: () => { setPage(n.key); setSearch(''); },
    badge: n.key === 'overview' ? totalCritical : 0,
  }));

  return (
    <Layout nav={nav}>
      {loading && page === 'overview' ? <Spinner /> : (
        <>
          {/* OVERVIEW */}
          {page === 'overview' && (
            <div className="space-y-6 fade-up">
              <SectionHeader title="Kitchen Overview" sub="All locations at a glance"
                action={<button onClick={loadDashboard} className="btn-secondary">🔄 Refresh</button>} />

              <div className="grid grid-cols-3 gap-4">
                <StatCard icon={<Store size={20} strokeWidth={1.5} />} label="Locations" value={dashboard.length} gradient="bg-[#2B3544]" overlayClass="bg-white/5" />
                <StatCard icon={<AlertTriangle size={20} strokeWidth={1.5} />} label="Low Stock" value={totalLow} gradient="bg-[#E68200]" overlayClass="bg-white/10" />
                <StatCard icon={<AlertOctagon size={20} strokeWidth={1.5} />} label="Critical" value={totalCritical} gradient="bg-[#E40026]" overlayClass="bg-white/10" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboard.map(loc => {
                  const critical = Number(loc.critical_count || 0);
                  const low = Number(loc.low_count || 0);
                  const ok = Number(loc.ok_count || 0);
                  const status = critical > 0 ? 'CRITICAL' : low > 0 ? 'LOW' : 'OK';
                  return (
                    <div key={loc.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
                      onClick={() => { setSelectedLoc(loc.id); setPage('location'); }}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Store size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 font-heading group-hover:text-blue-700 transition-colors">{loc.name}</h3>
                            <p className="text-xs text-slate-400 font-mono mt-0.5 group-hover:text-blue-600/60 transition-colors">{loc.location_code}</p>
                          </div>
                        </div>
                        <StatusBadge status={status} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Inventory</span><span>{Number(loc.total_items || 0)} items</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                          {ok > 0 && <div className="bg-emerald-400 rounded-full" style={{ flex: ok }} />}
                          {low > 0 && <div className="bg-amber-400 rounded-full" style={{ flex: low }} />}
                          {critical > 0 && <div className="bg-red-500 rounded-full pulse-glow" style={{ flex: critical }} />}
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-emerald-600 flex items-center gap-1"><Check size={12} /> {ok} OK</span>
                          <span className="text-amber-600 flex items-center gap-1"><AlertTriangle size={12} /> {low} Low</span>
                          <span className="text-red-600 flex items-center gap-1"><X size={12} /> {critical} Critical</span>
                        </div>
                      </div>
                      {loc.last_updated && (
                        <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-slate-50">
                          Updated {new Date(loc.last_updated).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LOCATION DETAIL — read only, max/min set by Super Admin */}
          {page === 'location' && (
            <div className="space-y-5 fade-up">
              <SectionHeader
                title={currentLocName ? `${currentLocName} — Inventory` : 'Location Inventory'}
                sub="View stock levels · Max/Min quantities managed by Super Admin"
                action={
                  <div className="flex gap-2 relative">
                    <button onClick={() => loadInventory(selectedLoc)} className="btn-secondary whitespace-nowrap">🔄 Refresh</button>
                  </div>
                }
              />

              {/* Location tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
                <span className="text-sm font-medium text-slate-500 mr-2 whitespace-nowrap">Select Location:</span>
                {locations.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLoc(l.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${String(selectedLoc) === String(l.id)
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-[1.02]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <Store size={16} />
                    {l.name}
                  </button>
                ))}
              </div>

              {/* Read-only notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-700">
                <Info size={16} />
                <span>Max & Min quantities are set by <strong>Super Admin</strong> in Stock Limits. Dispatch supplies below to refill locations.</span>
              </div>

              <div className="card-sm">
                <SearchInput value={search} onChange={setSearch} placeholder="Search ingredients…" />
              </div>

              {invLoading ? <TableSkeleton rows={6} cols={6} /> : (
                <div className="card p-0 overflow-hidden">
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr>
                        {['Ingredient', 'Unit', 'Stock Level', 'Min', 'Max', 'Supplied', 'Current', 'Gap', 'Status'].map(h => <th key={h}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {filteredInv.map(item => (
                          <tr key={item.id}>
                            <td className="font-medium text-slate-800">{item.ingredient_name}</td>
                            <td><span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{item.unit}</span></td>
                            <td className="min-w-[120px]"><StockBar current={item.current_quantity} max={item.max_quantity} /></td>
                            <td className="text-amber-600 font-medium">{item.min_quantity || '—'}</td>
                            <td className="text-slate-600">{item.max_quantity}</td>
                            <td className="text-blue-600">{item.already_supplied}</td>
                            <td className="font-semibold">{item.current_quantity}</td>
                            <td className={parseFloat(item.gap) > 0 ? 'text-red-600 font-bold' : 'text-emerald-500'}>
                              {parseFloat(item.gap) > 0 ? `${item.gap} ${item.unit}` : '✓ Full'}
                            </td>
                            <td><StatusBadge status={item.status} /></td>
                          </tr>
                        ))}
                        {!filteredInv.length && (
                          <tr><td colSpan="9"><Empty icon={<Package size={48} className="mx-auto text-slate-300" />} message="No inventory items" /></td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* INGREDIENTS */}
          {page === 'ingredients' && (
            <div className="space-y-5 fade-up">
              <SectionHeader title="Ingredients" sub="Master ingredient list · Admin can add, Super Admin manages limits"
                action={<button onClick={() => setIngModal(true)} className="btn-primary">+ Add Ingredient</button>} />
              <div className="card p-0 overflow-hidden">
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr>{['#', 'Ingredient', 'Unit', 'Status'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {ingredients.map((ing, i) => (
                        <tr key={ing.id}>
                          <td className="text-slate-400 font-mono text-xs">{String(ing.id).padStart(3, '0')}</td>
                          <td className="font-medium">{ing.name}</td>
                          <td><span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-mono">{ing.unit}</span></td>
                          <td><span className="badge-active">Active</span></td>
                        </tr>
                      ))}
                      {!ingredients.length && <tr><td colSpan="4"><Empty icon="🥗" message="No ingredients yet" /></td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DISPATCH SUPPLY */}
          {page === 'dispatch' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-up">
              <div className="space-y-6">
                <SectionHeader title="Dispatch Supply" sub="Add items to dispatch list" />
                <div className="card space-y-5">
                  <Field label="Destination Location">
                    <select className="input" value={dispatch.location_id} required
                      onChange={e => setDispatch(d => ({ ...d, location_id: e.target.value }))}>
                      <option value="">Select a location…</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </Field>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="text-sm font-bold text-slate-700">Add Ingredient</h4>
                    <Field label="Ingredient">
                      <select className="input bg-white" value={currentDispatchItem.ingredient_id}
                        onClick={() => !ingredients.length && loadIngredients()}
                        onChange={e => setCurrentDispatchItem(d => ({ ...d, ingredient_id: e.target.value }))}>
                        <option value="">Select an ingredient…</option>
                        {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} — {i.unit}</option>)}
                      </select>
                    </Field>
                    <Field label="Quantity">
                      <div className="flex gap-2">
                        <input className="input flex-1 bg-white" type="number" step="0.01" min="0.01" placeholder="0.00"
                          value={currentDispatchItem.quantity}
                          onChange={e => setCurrentDispatchItem(d => ({ ...d, quantity: e.target.value }))} />
                        <div className="input w-20 text-center bg-slate-100 text-slate-500 text-sm pointer-events-none">
                          {selectedIng?.unit || 'unit'}
                        </div>
                      </div>
                    </Field>
                    <button type="button" onClick={addDispatchItem}
                      disabled={!currentDispatchItem.ingredient_id || !currentDispatchItem.quantity}
                      className="btn-secondary w-full justify-center">
                      + Add to List
                    </button>
                  </div>

                  <Field label="Batch Notes (optional)">
                    <input className="input" placeholder="e.g. Morning delivery batch"
                      value={dispatch.notes} onChange={e => setDispatch(d => ({ ...d, notes: e.target.value }))} />
                  </Field>
                </div>
              </div>

              <div className="space-y-6">
                <SectionHeader title="Dispatch List" sub={`${dispatch.items.length} items ready`} />
                <div className="card p-0 flex flex-col min-h-[400px]">
                  <div className="flex-1 overflow-auto">
                    {dispatch.items.length === 0 ? (
                      <Empty icon={<Package size={48} className="text-slate-200" />} message="No items added yet" />
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {dispatch.items.map((item, idx) => (
                          <div key={idx} className="p-4 flex items-center justify-between group">
                            <div>
                              <p className="font-bold text-slate-800">{item.name}</p>
                              <p className="text-sm text-amber-600 font-mono font-bold">{item.quantity} {item.unit}</p>
                            </div>
                            <button onClick={() => removeDispatchItem(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={dispatchSupply}
                      disabled={dispatching || dispatch.items.length === 0 || !dispatch.location_id}
                      className="btn-primary w-full justify-center py-4 text-lg shadow-lg shadow-blue-500/20"
                    >
                      {dispatching ? (
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Truck size={20} /> Confirm & Dispatch Batch
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUPPLY HISTORY */}
          {page === 'history' && (
            <div className="space-y-5 fade-up">
              <SectionHeader title="Supply History" sub="All dispatch records" />
              <div className="card p-0 overflow-hidden">
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr>{['Date & Time', 'Location', 'Ingredient', 'Qty Dispatched', 'Notes', 'Action'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i}>
                          <td className="text-slate-400 text-xs whitespace-nowrap">{new Date(h.dispatched_at).toLocaleString()}</td>
                          <td className="font-medium">{h.location_name}</td>
                          <td>
                            {h.items?.length > 1 ? (
                              <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                                <Package size={14} /> {h.items.length} Items Batch
                              </span>
                            ) : (
                              <span className="text-slate-700">{h.ingredient_name}</span>
                            )}
                          </td>
                          <td>
                            {h.items?.length > 1 ? (
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Multiple Items</span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 font-bold text-sm px-2 py-0.5 rounded-lg whitespace-nowrap">
                                {h.quantity_dispatched} {h.unit}
                              </span>
                            )}
                          </td>
                          <td className="text-slate-400 max-w-[150px] truncate">{h.notes || '—'}</td>
                          <td>
                            <button
                              onClick={() => { setSelectedBill(h); setBillModal(true); }}
                              className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 group"
                            >
                              <FileText size={14} className="group-hover:scale-110 transition-transform" /> View Bill
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!history.length && <tr><td colSpan="6"><Empty icon="📜" message="No dispatch records yet" /></td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Ingredient Modal */}
      <Modal open={ingModal} onClose={() => setIngModal(false)} title="Add Ingredient" size="sm">
        <form onSubmit={createIngredient} className="space-y-4">
          <Field label="Ingredient Name">
            <input className="input" placeholder="e.g. Chicken Breast" value={ingForm.name} required
              onChange={e => setIngForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Unit of Measurement">
            <UnitSelect value={ingForm.unit} onChange={v => setIngForm(f => ({ ...f, unit: v }))} />
          </Field>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            ⚙️ After adding, ask your <strong>Super Admin</strong> to set Max/Min quantities in Stock Limits.
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setIngModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={ingLoading}>
              {ingLoading ? 'Adding…' : '+ Add Ingredient'}
            </button>
          </div>
        </form>
      </Modal>

      <SupplyBill
        isOpen={billModal}
        onClose={() => setBillModal(false)}
        dispatch={selectedBill}
      />
    </Layout>
  );
}
