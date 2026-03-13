// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const cls = { OK: "badge-ok", LOW: "badge-low", CRITICAL: "badge-critical" };
  const icons = { OK: "●", LOW: "◐", CRITICAL: "○" };
  return (
    <span className={cls[status] || "badge bg-slate-100 text-slate-500"}>
      <span className={status === "CRITICAL" ? "pulse-glow" : ""}>
        {icons[status]} {status}
      </span>
    </span>
  );
}

import { ShieldCheck, ChefHat, Store } from "lucide-react";

// ─── Role Badge ───────────────────────────────────────────────────────────────
export function RoleBadge({ role }) {
  const configs = {
    SUPER_ADMIN: {
      className: "badge-super",
      label: "Super Admin",
      emoji: "🛡",
    },
    ADMIN: {
      className: "badge-admin",
      label: "Admin",
      emoji: "👨‍🍳",
    },
    KITCHEN_USER: {
      className: "badge-kitchen",
      label: "Kitchen",
      emoji: "📦",
    },
  };

  const config = configs[role] || {
    className: "badge bg-slate-100 text-slate-500",
    label: role,
    emoji: "👤",
  };

  return (
    <span
      className={`${config.className} inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold cursor-default transition-all duration-300 hover:shadow-md hover:scale-105 group`}
    >
      <span className="text-base group-hover:scale-125 transition-transform duration-300">
        {config.emoji}
      </span>
      {config.label}
    </span>
  );
}

// ─── Stock Progress Bar ───────────────────────────────────────────────────────
export function StockBar({ current, max }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="progress-bar flex-1">
        <div
          className={`progress-fill ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  icon,
  gradient,
  sub,
  overlayClass = "bg-white/10",
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl p-5 text-white ${gradient} shadow-sm border border-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
    >
      <div
        className={`absolute top-0 right-0 w-28 h-28 rounded-bl-full ${overlayClass} transition-transform duration-500 origin-top-right group-hover:scale-125`}
      />
      <div className="relative z-10 flex flex-col min-h-[110px] justify-between">
        <div>{icon}</div>
        <div className="mt-4">
          <p className="text-4xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-white/70 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
export function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = "md" }) {
  const sizes = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className="flex justify-center items-center py-12">
      <div
        className={`${sizes[size]} border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin`}
      />
    </div>
  );
}

import { Inbox } from "lucide-react";

// ─── Empty State ──────────────────────────────────────────────────────────────
export function Empty({
  icon = <Inbox size={48} className="mx-auto text-slate-300" />,
  message = "No data found",
  sub,
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mb-4">{icon}</div>
      <p className="font-semibold text-slate-600">{message}</p>
      {sub && <p className="text-sm text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = "md" }) {
  if (!open) return null;
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} fade-up`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 font-heading">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  danger,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={danger ? "btn-danger" : "btn-primary"}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}

// ─── Search Input ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
        🔍
      </span>
      <input
        className="input pl-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 font-heading">
          {title}
        </h2>
        {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────
export function Field({ label, error, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
