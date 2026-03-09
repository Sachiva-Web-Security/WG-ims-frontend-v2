'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const DEMO = [
    { label: '🛡 Super Admin', email: 'superadmin@wavagrill.com', color: 'border-violet-300 bg-violet-50 hover:bg-violet-100 text-violet-700' },
    { label: '👨‍🍳 Admin (CK)', email: 'admin@wavagrill.com', color: 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700' },
    { label: '📦 Denton', email: 'denton@wavagrill.com', color: 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700' },
    { label: '📦 Greenville', email: 'greenville@wavagrill.com', color: 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700' },
];

export default function Login() {
    const { login } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const [form, setF] = useState({ email: '', password: '' });
    const [errors, setE] = useState({});
    const [loading, setL] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.email) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
        if (!form.password) e.password = 'Password is required';
        setE(e);
        return !Object.keys(e).length;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setL(true);
        try {
            const user = await login(form.email, form.password);
            toast('Welcome back, ' + user.name + '!', 'success');
            if (user.role === 'SUPER_ADMIN') router.push('/super-admin');
            else if (user.role === 'ADMIN') router.push('/admin');
            else router.push('/kitchen');
        } catch (err) {
            const msg = err.response?.data?.error || 'Login failed';
            toast(msg, 'error');
            setE({ password: 'Incorrect email or password' });
        } finally { setL(false); }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full" />
                </div>

                <div className="relative">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                        <div>
                            <p className="text-white font-bold font-heading">WavaGrill IMS</p>
                            <p className="text-slate-500 text-xs">Inventory Management</p>
                        </div>
                    </div>
                </div>

                <div className="relative space-y-6">
                    <h1 className="text-4xl font-bold text-white font-heading leading-tight">
                        Smarter inventory,<br />
                        <span className="text-amber-400">fresher kitchens.</span>
                    </h1>
                    <p className="text-slate-400 leading-relaxed">
                        Real-time stock tracking across all your Wava Grill locations. Know what you need, when you need it.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {['📊 Live gap tracking', '🚚 Supply dispatch', '📦 Multi locations', '🔐 Role-based access'].map(f => (
                            <span key={f} className="text-xs bg-white/5 text-slate-400 border border-white/10 px-3 py-1.5 rounded-full">{f}</span>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <p className="text-slate-600 text-xs">© 2026 IAN Brand Tech · WavaGrill LLC</p>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-md fade-up">
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                        <div>
                            <p className="font-bold font-heading text-slate-800">WavaGrill IMS</p>
                            <p className="text-slate-500 text-xs">Inventory Management</p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 font-heading mb-1">Sign in</h2>
                    <p className="text-slate-500 text-sm mb-8">Enter your credentials to access your dashboard.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Email address</label>
                            <input type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                                placeholder="name@wavagrill.com" value={form.email}
                                onChange={e => { setF(f => ({ ...f, email: e.target.value })); setE(e2 => ({ ...e2, email: '' })); }} />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <input type="password" className={`input ${errors.password ? 'input-error' : ''}`}
                                placeholder="••••••••" value={form.password}
                                onChange={e => { setF(f => ({ ...f, password: e.target.value })); setE(e2 => ({ ...e2, password: '' })); }} />
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in…
                                </span>
                            ) : 'Sign in →'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-200">
                        <p className="text-xs text-slate-400 text-center mb-3 font-medium uppercase tracking-wide">Quick demo login</p>
                        <div className="grid grid-cols-2 gap-2">
                            {DEMO.map(d => (
                                <button key={d.email} onClick={() => setF({ email: d.email, password: 'Password1!' })}
                                    className={`text-xs px-3 py-2.5 rounded-xl border font-medium transition-all ${d.color}`}>
                                    {d.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-xs text-slate-400 mt-3">Password: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Password1!</code></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
