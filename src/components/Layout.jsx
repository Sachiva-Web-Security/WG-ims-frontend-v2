"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { RoleBadge } from "@/components/UI";
import api from "@/lib/axios";
import { User, KeyRound, LogOut, Lock, CheckCircle2, AlertTriangle, Menu, ChevronLeft, ChevronRight } from "lucide-react";

export function Layout({ children, nav, onBeforeLogout }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    if (pwForm.newPassword !== pwForm.confirm)
      return setPwError("New passwords do not match.");
    if (pwForm.newPassword.length < 6)
      return setPwError("New password must be at least 6 characters.");
    setPwLoading(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess(true);
      setTimeout(() => {
        setPwModal(false);
        setPwSuccess(false);
        setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      }, 1500);
    } catch (err) {
      setPwError(err.response?.data?.error || "Failed to change password.");
    }
    setPwLoading(false);
  };

  const closePwModal = () => {
    setPwModal(false);
    setPwError("");
    setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
  };

  const handleLogout = async () => {
    if (onBeforeLogout) {
      const canLeave = await Promise.resolve(onBeforeLogout());
      if (!canLeave) return;
    }
    logout();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 fixed lg:relative z-50
          ${collapsed ? "lg:w-16" : "lg:w-60"}
          w-60 h-full flex flex-col bg-slate-900
          transition-all duration-300 ease-in-out flex-shrink-0
          print-hidden
        `}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-3 p-4 border-b border-white/10 ${collapsed ? "justify-center" : ""}`}
        >
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm font-heading leading-tight">
                WavaGrill
              </p>
              <p className="text-slate-400 text-xs">IMS</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav?.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick();
                setMobileOpen(false);
              }}
              className={`sidebar-link w-full text-left ${item.active ? "active" : ""} ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
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
        <div className="p-1.5 border-t border-white/10">
          {!collapsed ? (
            <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/0 rounded-xl p-3 backdrop-blur-sm border border-white/15 hover:border-white/30 transition-all duration-300 group">
              {/* Header label */}
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-1.5 opacity-75 group-hover:opacity-100 transition-opacity">
                System Owner
              </p>

              {/* User name with icon */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <User size={14} className="text-white" strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate leading-tight group-hover:text-amber-100 transition-colors">
                    {user?.name}
                  </p>
                </div>
              </div>

              {/* Role badge - compact */}
              <div className="mb-2.5 pb-2 border-b border-white/15 group-hover:border-white/25 transition-colors">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 opacity-70">
                  Your Role
                </p>
                <RoleBadge role={user?.role} />
              </div>

              {/* Action buttons */}
              <div className="space-y-1.5">
                <button
                  onClick={() => setPwModal(true)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/40 hover:to-amber-600/30 border border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 group/btn"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound size={14} className="text-amber-300 group-hover/btn:text-amber-200" />
                    <span className="text-xs font-semibold text-amber-300 group-hover/btn:text-amber-200 transition-colors">
                      Change Password
                    </span>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-red-500/20 to-red-600/10 hover:from-red-500/40 hover:to-red-600/30 border border-red-500/30 hover:border-red-500/60 transition-all duration-300 group/btn"
                >
                  <div className="flex items-center gap-2">
                    <LogOut size={14} className="text-red-300 group-hover/btn:text-red-200" />
                    <span className="text-xs font-semibold text-red-300 group-hover/btn:text-red-200 transition-colors">
                      Sign out
                    </span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setPwModal(true)}
                className="sidebar-link w-full justify-center text-amber-400 hover:text-amber-300 hover:bg-white/10"
                title="Change Password"
              >
                <KeyRound size={18} />
              </button>
              <button
                onClick={handleLogout}
                className="sidebar-link w-full justify-center text-red-400 hover:text-red-300 hover:bg-white/10"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-900 border border-white/10 items-center justify-center text-white text-xs hover:bg-slate-700 transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3 print-hidden">
          <button onClick={() => setMobileOpen(true)} className="btn-ghost">
            <Menu size={20} />
          </button>
          <p className="font-bold text-slate-800 font-heading text-sm">
            WavaGrill IMS
          </p>
          <div className="w-8" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Change Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closePwModal}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm fade-up border border-slate-100 overflow-hidden">
            {/* Gradient header */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg font-heading">
                      Change Password
                    </h3>
                    <p className="text-xs text-white/80">
                      Keep your account secure
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePwModal}
                  className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {pwSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <p className="font-semibold text-emerald-700 text-lg">
                    Password updated!
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Your account is now more secure.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="label text-slate-700 font-semibold">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="input border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      placeholder="••••••••"
                      required
                      value={pwForm.currentPassword}
                      onChange={(e) =>
                        setPwForm((f) => ({
                          ...f,
                          currentPassword: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label text-slate-700 font-semibold">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="input border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      placeholder="••••••••"
                      required
                      value={pwForm.newPassword}
                      onChange={(e) =>
                        setPwForm((f) => ({
                          ...f,
                          newPassword: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label text-slate-700 font-semibold">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="input border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      placeholder="••••••••"
                      required
                      value={pwForm.confirm}
                      onChange={(e) =>
                        setPwForm((f) => ({ ...f, confirm: e.target.value }))
                      }
                    />
                  </div>
                  {pwError && (
                    <div className="p-3 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 font-medium">
                        {pwError}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={closePwModal}
                      className="px-4 py-2.5 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="px-4 py-2.5 rounded-lg font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50"
                    >
                      {pwLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Updating…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <KeyRound size={14} /> Change Password
                        </span>
                      )}
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
