import { Building2 } from 'lucide-react';

export default function Logo({ onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 transition hover:opacity-80 ${className}`}
      title="Kembali ke Dashboard"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 shadow-md">
        <Building2 size={20} className="text-white" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold text-slate-900">InfraTrack</span>
        <span className="text-xs text-slate-600">v2.0</span>
      </div>
    </button>
  );
}
