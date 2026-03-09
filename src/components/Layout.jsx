'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { RoleBadge } from '@/components/UI';
import api from '@/lib/axios';

export function Layout({ children, nav }) {
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [pwModal, setPwModal] = useState(false);
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [pwError, setPwError] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwSuccess, setPwSuccess] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwError('');
        if (pwForm.newPassword !== pwForm.confirm) return setPwError('New passwords do not match.');
        if (pwForm.newPassword.length < 6) return setPwError('New password must be at least 6 characters.');
        setPwLoading(true);
        try {
            await api.put('/auth/change-password', {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword,
            });
            setPwSuccess(true);
            setTimeout(() => {
                setPwModal(false); setPwSuccess(false);
                setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
            }, 1500);
        } catch (err) {
            setPwError(err.response?.data?.error || 'Failed to change password.');
        }
        setPwLoading(false);
    };

    const closePwModal = () => { setPwModal(false); setPwError(''); setPwForm({ currentPassword: '', newPassword: '', confirm: '' }); };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:relative z-50
        ${collapsed ? 'lg:w-16' : 'lg:w-60'}
        w-60 h-full flex flex-col bg-slate-900
        transition-all duration-300 ease-in-out flex-shrink-0
      `}>
                {/* Logo */}
                <div className={`flex items-center gap-3 p-4 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
                    <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-white font-bold text-sm font-heading leading-tight">WavaGrill</p>
                            <p className="text-slate-400 text-xs">IMS</p>
                        </div>
                    )}
                </div>

                {/* Nav items */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {nav?.map((item, i) => (
                        <button key={i}
                            onClick={() => { item.onClick(); setMobileOpen(false); }}
                            className={`sidebar-link w-full text-left ${item.active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                            title={collapsed ? item.label : undefined}>
                            <span className="text-lg flex-shrink-0">{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                            {!collapsed && item.badge > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User panel */}
                <div className="p-3 border-t border-white/10">
                    {!collapsed ? (
                        <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                            <div className="mt-1 mb-3"><RoleBadge role={user?.role} /></div>
                            <button onClick={() => setPwModal(true)}
                                className="w-full text-left text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 mb-2">
                                🔑 Change Password
                            </button>
                            <button onClick={logout}
                                className="w-full text-left text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                                ← Sign out
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            <button onClick={() => setPwModal(true)} className="sidebar-link w-full justify-center" title="Change Password">🔑</button>
                            <button onClick={logout} className="sidebar-link w-full justify-center" title="Sign out">↩</button>
                        </div>
                    )}
                </div>

                {/* Collapse toggle */}
                <button onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-900 border border-white/10 items-center justify-center text-white text-xs hover:bg-slate-700 transition-colors">
                    {collapsed ? '›' : '‹'}
                </button>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="lg:hidden flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3">
                    <button onClick={() => setMobileOpen(true)} className="btn-ghost">☰</button>
                    <p className="font-bold text-slate-800 font-heading text-sm">WavaGrill IMS</p>
                    <div className="w-8" />
                </header>
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
            </div>

            {/* Change Password Modal */}
            {pwModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closePwModal} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm fade-up">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="font-bold text-lg text-slate-800 font-heading">🔑 Change Password</h3>
                            <button onClick={closePwModal} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">✕</button>
                        </div>
                        <div className="p-6">
                            {pwSuccess ? (
                                <div className="text-center py-6">
                                    <div className="text-4xl mb-3">✅</div>
                                    <p className="font-semibold text-emerald-700">Password changed successfully!</p>
                                </div>
                            ) : (
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="label">Current Password</label>
                                        <input type="password" className="input" placeholder="Enter current password" required
                                            value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="label">New Password</label>
                                        <input type="password" className="input" placeholder="Enter new password" required
                                            value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="label">Confirm New Password</label>
                                        <input type="password" className="input" placeholder="Repeat new password" required
                                            value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
                                    </div>
                                    {pwError && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pwError}</p>}
                                    <div className="flex gap-3 justify-end pt-2">
                                        <button type="button" onClick={closePwModal} className="btn-secondary">Cancel</button>
                                        <button type="submit" disabled={pwLoading} className="btn-primary">
                                            {pwLoading ? 'Saving…' : 'Change Password'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
