import { Building2 } from 'lucide-react';

export default function Logo({ onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 transition hover:opacity-80 ${className}`}
      title="Kembali ke Dashboard"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg shadow-md overflow-hidden bg-white">
        <img src="/yorushika-logo.png" alt="Logo" className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold text-slate-900">InfraTrack</span>
        <span className="text-xs text-slate-600">v2.0</span>
      </div>
    </button>
  );
}
