import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
  BarChart, Bar
} from "recharts";

type Page = "dashboard" | "incidents" | "reports" | "users" | "config";

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  rose: "#805062",
  roseDeep: "#76485A",
  pink: "#F8BBD0",
  pinkLight: "#FCE4EC",
  pinkMid: "#F48FB1",
  slate: "#526069",
  dark: "#1A1C1C",
  warm: "#504447",
  muted: "#827377",
  bg: "#FAF7F8",
  bgCard: "rgba(255,255,255,0.82)",
  green: "#A5D6A7",
  red: "#EF9A9A",
};

// ── Data ─────────────────────────────────────────────────────────────────────
const vitalityData = [
  { t: "00:00", v: 180 }, { t: "03:00", v: 240 }, { t: "06:00", v: 420 },
  { t: "09:00", v: 890 }, { t: "12:00", v: 1240 }, { t: "15:00", v: 1100 },
  { t: "18:00", v: 980 }, { t: "21:00", v: 620 }, { t: "24:00", v: 380 },
];

const bandwidthData = [
  { day: "Mon", inbound: 45, outbound: 30 }, { day: "Tue", inbound: 52, outbound: 38 },
  { day: "Wed", inbound: 68, outbound: 55 }, { day: "Thu", inbound: 74, outbound: 62 },
  { day: "Fri", inbound: 58, outbound: 48 }, { day: "Sat", inbound: 42, outbound: 35 },
  { day: "Sun", inbound: 38, outbound: 28 },
];

const energyData = [
  { name: "Core Servers", value: 42, color: C.pink },
  { name: "Edge Nodes", value: 28, color: "#BDC2FF" },
  { name: "Cooling (Wind)", value: 14, color: "#BAC9D3" },
];

const incidentTrendData = [
  { w: "W-8", total: 18 }, { w: "W-7", total: 22 }, { w: "W-6", total: 15 },
  { w: "W-5", total: 31 }, { w: "W-4", total: 26 }, { w: "W-3", total: 19 },
  { w: "W-2", total: 12 }, { w: "W-1", total: 8 },
];

const incidents = [
  { id: "INC-092-A", type: "Routing Failure", location: "US-East-1 (Blossom)", priority: "Critical", status: "Pending", tech: "E. Thorne" },
  { id: "INC-494-X", type: "Database Cluster Drop", location: "EU-West-2 (Petal)", priority: "Major", status: "In Progress", tech: "L. Vance" },
  { id: "INC-112-C", type: "Core Switch Latency", location: "AP-South-1 (Lotus)", priority: "Minor", status: "Resolved", tech: "M. Lin" },
  { id: "INC-219-B", type: "Memory Overflow", location: "US-West-1 (Sakura)", priority: "Major", status: "Pending", tech: "S. Ward" },
  { id: "INC-331-D", type: "SSL Certificate Expiry", location: "EU-Central-1 (Bloom)", priority: "Minor", status: "Resolved", tech: "J. Mercer" },
];

const users = [
  { name: "Elias Thorne", email: "elias.t@infratrack.io", role: "Administrator", dept: "Core Systems", status: "Active", initials: "ET" },
  { name: "Lyra Vance", email: "lyra.v@infratrack.io", role: "Technician", dept: "Field Operations", status: "On Leave", initials: "LV" },
  { name: "Julian Mercer", email: "julian.m@infratrack.io", role: "Reporter", dept: "Data Analysis", status: "Active", initials: "JM" },
  { name: "Silas Ward", email: "silas.w@infratrack.io", role: "Administrator", dept: "Security", status: "Suspended", initials: "SW" },
  { name: "Mei Lin", email: "mei.l@infratrack.io", role: "Engineer", dept: "Field Operations", status: "Active", initials: "ML" },
  { name: "Ren Ashby", email: "ren.a@infratrack.io", role: "Analyst", dept: "Core Systems", status: "Active", initials: "RA" },
];

const deptData = [
  { dept: "Core Systems", count: 2 }, { dept: "Field Ops", count: 2 },
  { dept: "Data Analysis", count: 1 }, { dept: "Security", count: 1 },
];

// ── Falling Petals ────────────────────────────────────────────────────────────
const PETAL_CONFIG = [
  { left: "3%", dur: 11, delay: 0, drift: 20 },
  { left: "11%", dur: 14, delay: 2.5, drift: -15 },
  { left: "19%", dur: 9, delay: 5, drift: 25 },
  { left: "28%", dur: 13, delay: 1, drift: -20 },
  { left: "36%", dur: 10, delay: 7, drift: 10 },
  { left: "47%", dur: 15, delay: 3, drift: -30 },
  { left: "55%", dur: 12, delay: 8, drift: 18 },
  { left: "63%", dur: 9.5, delay: 4.5, drift: -22 },
  { left: "72%", dur: 16, delay: 1.5, drift: 12 },
  { left: "80%", dur: 11, delay: 6, drift: -10 },
  { left: "88%", dur: 13, delay: 2, drift: 28 },
  { left: "95%", dur: 10, delay: 9, drift: -18 },
];

function FallingPetals() {
  return (
    <>
      <style>{`
        @keyframes petalFall {
          0%   { transform: translateY(-30px) rotate(0deg); opacity: 0; }
          8%   { opacity: 0.65; }
          88%  { opacity: 0.45; }
          100% { transform: translateY(102vh) rotate(var(--spin)) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes petalSway {
          0%,100% { margin-left: 0; }
          50%      { margin-left: var(--sway); }
        }
        .sakura-petal {
          animation:
            petalFall var(--dur) var(--delay) linear infinite,
            petalSway calc(var(--dur) * 0.38) var(--delay) ease-in-out infinite alternate;
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {PETAL_CONFIG.map((p, i) => (
          <div
            key={i}
            className="sakura-petal absolute top-0"
            style={{
              left: p.left,
              "--dur": `${p.dur}s`,
              "--delay": `${p.delay}s`,
              "--drift": `${p.drift}px`,
              "--spin": `${220 + i * 27}deg`,
              "--sway": `${p.drift * 0.6}px`,
            } as React.CSSProperties}
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
              <ellipse cx="5" cy="8" rx="4" ry="6" fill={C.pink} fillOpacity="0.55" transform="rotate(-15 5 8)" />
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "First Breath", icon: <HomeIcon /> },
  { id: "incidents", label: "Scattered Petals", icon: <PetalIcon /> },
  { id: "reports", label: "Echoes of Spring", icon: <ChartIcon /> },
  { id: "users", label: "Chorus of Souls", icon: <UsersIcon /> },
  { id: "config", label: "Ink & Paper", icon: <InkIcon /> },
];

function HomeIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>;
}
function PetalIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9 2 6 5 6 9c0 3 1.5 5.5 4 7-2.5 1.5-4 4-4 7h2c0-2.5 1.5-4.5 4-5 2.5.5 4 2.5 4 5h2c0-3-1.5-5.5-4-7 2.5-1.5 4-4 4-7 0-4-3-7-6-7z"/></svg>;
}
function ChartIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v7H3zm4-4h2v11H7zm4-6h2v17h-2zm4 7h2v10h-2zm4-4h2v14h-2z"/></svg>;
}
function UsersIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;
}
function InkIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
}

function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-30"
      style={{
        background: "rgba(250,247,248,0.92)",
        backdropFilter: "blur(16px)",
        borderRight: `1px solid rgba(248,187,208,0.25)`,
        boxShadow: "4px 0 24px rgba(128,80,98,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F8BBD0, #FCE4EC)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={C.rose}>
              <path d="M12 2C9 5 5 8 5 13a7 7 0 0014 0c0-5-4-8-7-11z"/>
            </svg>
          </div>
          <div>
            <div className="font-['Playfair_Display'] italic font-bold text-xl leading-tight" style={{ color: C.rose }}>
              Spring Thief
            </div>
            <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: C.slate }}>
              Infrastructure
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
              style={{
                background: active ? "linear-gradient(90deg, #F8BBD0, #FCE4EC)" : "transparent",
                color: active ? C.roseDeep : C.slate,
                fontWeight: active ? 600 : 500,
                fontSize: "12px",
                letterSpacing: "0.04em",
                boxShadow: active ? "0 2px 8px rgba(248,187,208,0.4)" : "none",
              }}
            >
              <span style={{ opacity: active ? 1 : 0.65 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Lyric fragment */}
      <div className="px-6 py-4 mx-3 mb-4 rounded-xl" style={{ background: "rgba(248,187,208,0.08)", border: "1px solid rgba(248,187,208,0.2)" }}>
        <p className="font-['Playfair_Display'] italic text-[11px] leading-relaxed" style={{ color: C.muted }}>
          "春を盗んでいく<br/>
          <span className="not-italic text-[10px] tracking-wide">stealing the spring away…"</span>
        </p>
      </div>

      {/* Profile */}
      <div className="px-4 pb-6">
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
               style={{ background: "linear-gradient(135deg, #F8BBD0, #805062)" }}>
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold truncate" style={{ color: C.dark }}>Administrator</div>
            <div className="text-[11px]" style={{ color: C.slate }}>System Overview</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Shared card wrapper ───────────────────────────────────────────────────────
function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: C.bgCard,
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(248,187,208,0.28)",
        boxShadow: "0 4px 24px rgba(128,80,98,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(250,247,248,0.96)", border: `1px solid ${C.pink}`, color: C.warm }}>
      <div className="font-semibold mb-0.5" style={{ color: C.rose }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

function DashboardPage() {
  return (
    <div className="p-10 max-w-6xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-['Playfair_Display'] font-bold text-5xl tracking-tight" style={{ color: C.dark }}>First Breath</h1>
          <p className="mt-1 text-lg" style={{ color: C.warm }}>System vitality and initial awakening metrics.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-widest uppercase"
                style={{ background: "linear-gradient(90deg, #F8BBD0, #FCE4EC)", color: C.roseDeep }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0L7.5 4.5H12L8.5 7.3 9.9 12 6 9.2 2.1 12 3.5 7.3 0 4.5H4.5z"/></svg>
          Awaken Nodes
        </button>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* Vitality Stream — spans 8 */}
        <Card className="col-span-8 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-['Playfair_Display'] font-semibold text-2xl" style={{ color: C.dark }}>Vitality Stream</h2>
            </div>
            {/* Decorative petal watermark */}
            <div className="opacity-[0.08]">
              <svg width="80" height="80" viewBox="0 0 80 80" fill={C.rose}>
                <path d="M40 4C28 12 12 22 12 40c0 15.5 12.5 28 28 28s28-12.5 28-28C68 22 52 12 40 4z"/>
              </svg>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mb-6">
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: C.warm }}>Total Requests</p>
              <p className="font-['Playfair_Display'] font-semibold text-3xl" style={{ color: C.rose }}>2.4M</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: C.warm }}>Latency</p>
              <p className="font-['Playfair_Display'] font-semibold text-3xl" style={{ color: C.dark }}>42ms</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: C.warm }}>Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full" style={{ background: C.green }} />
                <span className="text-lg" style={{ color: C.dark }}>Blooming</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vitalityData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="vitalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.pink} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={C.pink} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(248,187,208,0.2)" />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="v" name="Requests" stroke={C.pinkMid} strokeWidth={2} fill="url(#vitalGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Whispers — spans 4 */}
        <Card className="col-span-4 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-['Playfair_Display'] font-semibold text-2xl" style={{ color: C.dark }}>Recent Whispers</h2>
            <svg width="16" height="12" viewBox="0 0 18 12" fill={C.muted}><path d="M1 1h16M1 6h10M1 11h13"/><path d="M1 1h16M1 6h10M1 11h13" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {/* Critical */}
            <div className="rounded-lg p-4" style={{ background: "rgba(255,218,214,0.2)", border: "1px solid #FFDAD6" }}>
              <div className="flex items-start gap-3">
                <svg width="18" height="22" viewBox="0 0 20 24" fill="#BA1A1A" className="mt-0.5 flex-shrink-0"><path d="M12 2L2 7l2 14 8 3 8-3 2-14z"/></svg>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide" style={{ color: "#BA1A1A" }}>East Wind Anomaly</p>
                  <p className="text-[13px] mt-1 leading-snug" style={{ color: C.warm }}>High latency detected in Tokyo node cluster. Petals scattering rapidly.</p>
                  <p className="text-[12px] mt-1.5 opacity-60" style={{ color: C.warm }}>2 mins ago</p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="rounded-lg p-4" style={{ background: "#EEEEEE", border: "1px solid rgba(212,194,198,0.3)" }}>
              <div className="flex items-start gap-3">
                <svg width="20" height="21" viewBox="0 0 22 23" fill={C.muted} className="mt-0.5 flex-shrink-0"><path d="M11 3L1 20h20z" strokeWidth="1.5" stroke={C.muted} fill="none"/><path d="M11 9v5M11 17v1" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/></svg>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide" style={{ color: C.dark }}>Memory Frost</p>
                  <p className="text-[13px] mt-1 leading-snug" style={{ color: C.warm }}>Cache utilization approaching 85% in primary database.</p>
                  <p className="text-[12px] mt-1.5 opacity-60" style={{ color: C.warm }}>15 mins ago</p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="rounded-lg p-4" style={{ background: "#EEEEEE", border: "1px solid rgba(212,194,198,0.3)" }}>
              <div className="flex items-start gap-3">
                <svg width="18" height="22" viewBox="0 0 20 24" fill={C.slate} className="mt-0.5 flex-shrink-0"><circle cx="10" cy="10" r="8" stroke={C.slate} strokeWidth="1.5" fill="none"/><path d="M10 8v6M10 6.5v1" stroke={C.slate} strokeWidth="2" strokeLinecap="round"/></svg>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide" style={{ color: C.dark }}>Seed Deployed</p>
                  <p className="text-[13px] mt-1 leading-snug" style={{ color: C.warm }}>Version 4.2.1 successfully rooted in production.</p>
                  <p className="text-[12px] mt-1.5 opacity-60" style={{ color: C.warm }}>1 hour ago</p>
                </div>
              </div>
            </div>
          </div>

          <button className="mt-4 text-[12px] font-semibold tracking-wide" style={{ color: C.rose }}>
            View all whispers →
          </button>
        </Card>

        {/* Orchard Distribution — spans 12 */}
        <Card className="col-span-12 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-['Playfair_Display'] font-semibold text-2xl" style={{ color: C.dark }}>Orchard Distribution</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: C.green }} />
                <span className="text-sm" style={{ color: C.warm }}>Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: C.red }} />
                <span className="text-sm" style={{ color: C.warm }}>Fading</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Network map visualization */}
            <div className="col-span-2 rounded-xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #F8F0F4, #EDF0F5)", height: "280px" }}>
              {/* Atmospheric overlay */}
              <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(248,187,208,0.4) 0%, transparent 70%)" }} />

              {/* SVG world-map inspired layout */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 280" preserveAspectRatio="xMidYMid meet">
                {/* Subtle grid lines */}
                {[70, 140, 210].map(y => (
                  <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="rgba(128,80,98,0.06)" strokeWidth="1" />
                ))}
                {[100, 200, 300, 400, 500, 600].map(x => (
                  <line key={x} x1={x} y1="0" x2={x} y2="280" stroke="rgba(128,80,98,0.06)" strokeWidth="1" />
                ))}

                {/* Connection lines between nodes */}
                <line x1="245" y1="115" x2="360" y2="125" stroke="rgba(165,214,167,0.5)" strokeWidth="1.5" strokeDasharray="4,3" />
                <line x1="360" y1="125" x2="530" y2="155" stroke="rgba(239,154,154,0.4)" strokeWidth="1.5" strokeDasharray="4,3" />
                <line x1="245" y1="115" x2="530" y2="155" stroke="rgba(165,214,167,0.3)" strokeWidth="1" strokeDasharray="6,4" />

                {/* North America */}
                <circle cx="245" cy="115" r="8" fill={C.green} opacity="0.9" />
                <circle cx="245" cy="115" r="16" fill={C.green} opacity="0.15" />
                <text x="235" y="142" fill={C.slate} fontSize="10" textAnchor="middle">US-East-1</text>
                <text x="235" y="153" fill={C.slate} fontSize="9" textAnchor="middle" opacity="0.6">Blossom</text>

                {/* Europe */}
                <circle cx="360" cy="125" r="8" fill={C.green} opacity="0.9" />
                <circle cx="360" cy="125" r="16" fill={C.green} opacity="0.15" />
                <text x="360" y="152" fill={C.slate} fontSize="10" textAnchor="middle">EU-West-2</text>
                <text x="360" y="163" fill={C.slate} fontSize="9" textAnchor="middle" opacity="0.6">Petal</text>

                {/* Asia — Fading/anomaly */}
                <circle cx="530" cy="155" r="8" fill={C.red} opacity="0.9" />
                <circle cx="530" cy="155" r="20" fill={C.red} opacity="0.15" />
                <circle cx="530" cy="155" r="28" fill={C.red} opacity="0.07" />
                <text x="530" y="185" fill={C.slate} fontSize="10" textAnchor="middle">AP-South-1</text>
                <text x="530" y="196" fill={C.slate} fontSize="9" textAnchor="middle" opacity="0.6">Lotus ⚠</text>

                {/* Decorative petals */}
                <ellipse cx="80" cy="60" rx="8" ry="12" fill={C.pink} fillOpacity="0.3" transform="rotate(-30 80 60)" />
                <ellipse cx="620" cy="50" rx="6" ry="9" fill={C.pink} fillOpacity="0.25" transform="rotate(20 620 50)" />
                <ellipse cx="450" cy="240" rx="7" ry="10" fill={C.pink} fillOpacity="0.2" transform="rotate(-15 450 240)" />
              </svg>
            </div>

            {/* Right: stats + quote */}
            <div className="flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: "rgba(165,214,167,0.12)", border: "1px solid rgba(165,214,167,0.3)" }}>
                  <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: C.slate }}>Active Nodes</p>
                  <p className="font-['Playfair_Display'] text-3xl font-semibold" style={{ color: C.dark }}>2</p>
                  <p className="text-[12px] mt-1" style={{ color: C.slate }}>US-East-1, EU-West-2</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "rgba(239,154,154,0.12)", border: "1px solid rgba(239,154,154,0.3)" }}>
                  <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: C.slate }}>Fading Nodes</p>
                  <p className="font-['Playfair_Display'] text-3xl font-semibold" style={{ color: C.roseDeep }}>1</p>
                  <p className="text-[12px] mt-1" style={{ color: C.slate }}>AP-South-1 (Lotus)</p>
                </div>
              </div>
              {/* Poetic quote */}
              <div className="p-4 rounded-xl mt-2" style={{ background: "rgba(248,187,208,0.08)", border: "1px solid rgba(248,187,208,0.2)" }}>
                <p className="font-['Playfair_Display'] italic text-[13px] leading-relaxed" style={{ color: C.muted }}>
                  "Even the nodes that fade<br/>leave traces in the wind—<br/>their echoes, still blooming."
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Incidents Page ─────────────────────────────────────────────────────────────
function IncidentsPage() {
  const priorityStyle: Record<string, { bg: string; color: string }> = {
    Critical: { bg: "#FFDAD6", color: "#BA1A1A" },
    Major:    { bg: "#FFF0C8", color: "#7A5800" },
    Minor:    { bg: "#D3E2ED", color: "#374955" },
  };
  const statusStyle: Record<string, string> = {
    Pending:     C.warm,
    "In Progress": "#4C56AF",
    Resolved:    "#2E7D32",
  };

  return (
    <div className="p-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-['Playfair_Display'] font-bold text-5xl tracking-tight" style={{ color: C.rose }}>Incident Ledger</h1>
        <p className="mt-2 text-lg leading-relaxed" style={{ color: C.slate }}>
          A complete ledger of network incidents drifting through the<br />current infrastructure landscape.
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <input
            className="pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
            placeholder="Search incidents..."
            style={{ background: "white", border: `1px solid ${C.pink}`, color: C.warm, width: "256px" }}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 18 18" fill={C.slate}>
            <circle cx="7.5" cy="7.5" r="5.5" stroke={C.slate} strokeWidth="1.5" fill="none"/>
            <path d="M11.5 11.5l3.5 3.5" stroke={C.slate} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <button className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-widest uppercase"
                style={{ background: "linear-gradient(90deg, #F8BBD0, #FCE4EC)", color: C.roseDeep }}>
          <svg width="12" height="9" viewBox="0 0 13.5 9" fill="currentColor"><path d="M0 0h13.5M2 4h9.5M4 8h5.5"/></svg>
          Filter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {[
          { label: "Total Incidents", val: "1,428", sub: "+12 this week", accent: C.rose },
          { label: "Resolved Today", val: "98.2%", sub: "Operating efficiently", accent: C.slate },
          { label: "Open Tickets", val: "24", sub: "Pending review", accent: C.roseDeep },
        ].map((s) => (
          <Card key={s.label} className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-[0.07] -translate-y-1/4 translate-x-1/4">
              <svg width="100" height="100" viewBox="0 0 100 100" fill={C.rose}>
                <path d="M50 5C33 16 10 28 10 50a40 40 0 0080 0C90 28 67 16 50 5z"/>
              </svg>
            </div>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: C.slate }}>{s.label}</p>
            <p className="font-['Playfair_Display'] text-4xl font-semibold" style={{ color: s.accent }}>{s.val}</p>
            <p className="text-[12px] mt-1" style={{ color: C.slate }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(212,194,198,0.3)" }}>
              {["Report ID", "Issue Type", "Location", "Priority", "Status", "Technician"].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold tracking-wider uppercase" style={{ color: C.slate }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc, i) => (
              <tr key={inc.id} style={{ borderBottom: i < incidents.length - 1 ? "1px solid rgba(212,194,198,0.2)" : "none" }}>
                <td className="px-5 py-4 font-mono text-[12px]" style={{ color: C.slate }}>{inc.id}</td>
                <td className="px-5 py-4 font-medium" style={{ color: C.dark }}>{inc.type}</td>
                <td className="px-5 py-4" style={{ color: C.slate }}>{inc.location}</td>
                <td className="px-5 py-4">
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold" style={priorityStyle[inc.priority]}>
                    {inc.priority}
                  </span>
                </td>
                <td className="px-5 py-4 font-medium text-[13px]" style={{ color: statusStyle[inc.status] }}>
                  {inc.status}
                </td>
                <td className="px-5 py-4" style={{ color: C.warm }}>{inc.tech}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid rgba(212,194,198,0.25)" }}>
          <span className="text-[12px]" style={{ color: C.slate }}>Showing 1 to 5 of 1,428 entries</span>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded flex items-center justify-center text-xs" style={{ border: `1px solid rgba(212,194,198,0.4)`, color: C.slate }}>‹</button>
            <button className="w-8 h-8 rounded flex items-center justify-center text-xs" style={{ border: `1px solid rgba(212,194,198,0.4)`, color: C.slate }}>›</button>
          </div>
        </div>
      </Card>

      {/* Fill blank space: trend chart + quote */}
      <div className="grid grid-cols-2 gap-5">
        <Card className="p-6">
          <h3 className="font-['Playfair_Display'] font-semibold text-lg mb-4" style={{ color: C.dark }}>Seasonal Drift Pattern</h3>
          <p className="text-[12px] mb-4" style={{ color: C.slate }}>Weekly incident frequency — last 8 weeks</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentTrendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(248,187,208,0.2)" />
                <XAxis dataKey="w" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Incidents" fill={C.pink} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between" style={{ background: "linear-gradient(135deg, rgba(248,187,208,0.12), rgba(252,228,236,0.08))" }}>
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-4" style={{ color: C.muted }}>Seasonal Reflection</p>
            <blockquote className="font-['Playfair_Display'] italic text-xl leading-relaxed" style={{ color: C.rose }}>
              "The petals that scatter<br/>are not lost—they become<br/>part of the breeze."
            </blockquote>
          </div>
          <div className="flex justify-end">
            <svg width="60" height="80" viewBox="0 0 60 80" fill="none" opacity="0.15">
              <ellipse cx="30" cy="50" rx="22" ry="30" fill={C.rose} transform="rotate(-10 30 50)" />
              <ellipse cx="30" cy="50" rx="22" ry="30" fill={C.rose} transform="rotate(10 30 50)" />
            </svg>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Reports Page ──────────────────────────────────────────────────────────────
function ReportsPage() {
  return (
    <div className="p-10 max-w-6xl">
      {/* Top nav breadcrumb */}
      <div className="flex items-center gap-3 mb-6 text-sm">
        <span className="font-['Playfair_Display'] font-semibold text-xl" style={{ color: C.slate }}>Echoes of Spring</span>
        <span style={{ color: C.pink }}>›</span>
        <span style={{ color: C.rose }}>Performance Reports</span>
      </div>

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-['Playfair_Display'] font-bold text-5xl tracking-tight" style={{ color: C.dark }}>Echoes of Spring</h1>
          <p className="mt-1 text-lg" style={{ color: C.slate }}>Visualizing the transient flow of energy and data across the canopy.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide"
                  style={{ border: `1px solid ${C.slate}`, color: C.slate }}>
            This Season
          </button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide"
                  style={{ background: "linear-gradient(135deg, #F8BBD0, #FCE4EC)", color: C.slate }}>
            Export Verse
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Bandwidth Currents — spans 8 */}
        <Card className="col-span-8 p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-[0.06] -translate-y-1/4 translate-x-1/4">
            <svg width="100" height="100" viewBox="0 0 100 100" fill={C.pink}>
              <circle cx="50" cy="50" r="48"/>
            </svg>
          </div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="font-['Playfair_Display'] font-semibold text-2xl" style={{ color: C.dark }}>Bandwidth Currents</h2>
              <p className="text-[13px] mt-1" style={{ color: C.warm }}>Network throughput mimicking wind patterns</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold" style={{ background: "#F3F3F3", border: "1px solid rgba(212,194,198,0.3)" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: C.rose }} />
              <span style={{ color: C.slate }}>Stable Breeze</span>
            </div>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bandwidthData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.pink} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C.pink} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(248,187,208,0.25)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line type="monotone" dataKey="inbound" name="Inbound Flow" stroke={C.pinkMid} strokeWidth={2.5} dot={{ fill: "white", stroke: C.pinkMid, strokeWidth: 2, r: 4 }} />
                <Line type="monotone" dataKey="outbound" name="Outbound Flow" stroke="#BDC2FF" strokeWidth={2.5} dot={{ fill: "white", stroke: "#BDC2FF", strokeWidth: 2, r: 4 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Energy Bloom — spans 4 */}
        <Card className="col-span-4 p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-[0.06] -translate-y-1/4 translate-x-1/4">
            <svg width="100" height="100" viewBox="0 0 100 100" fill={C.pink}>
              <circle cx="50" cy="50" r="48"/>
            </svg>
          </div>
          <h2 className="font-['Playfair_Display'] font-semibold text-2xl mb-1" style={{ color: C.dark }}>Energy Bloom</h2>
          <p className="text-[13px] mb-6" style={{ color: C.warm }}>Power draw across nodes</p>

          {/* Doughnut */}
          <div className="relative h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={energyData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                  {energyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `${v} kWh`} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-['Playfair_Display'] font-semibold text-3xl" style={{ color: C.rose }}>84%</span>
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: C.slate }}>Efficiency</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3 mt-2">
            {energyData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                  <span className="text-[13px]" style={{ color: C.dark }}>{d.name}</span>
                </div>
                <span className="text-[12px] font-semibold" style={{ color: C.warm }}>{d.value} kWh</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Stats cards — 3 cols each = 4 per card */}
        {[
          {
            label: "Latency Whispers", val: "24", unit: "ms avg",
            badge: { text: "12ms", color: "#4C56AF", bg: "rgba(224,224,255,0.5)" },
            icon: <svg width="18" height="16" viewBox="0 0 20 16" fill={C.dark}><path d="M20 8H4M4 8L10 2M4 8l6 6" stroke={C.dark} strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>,
            iconBg: "#FFD9E4",
          },
          {
            label: "CPU Canopy Load", val: "68", unit: "%",
            badge: { text: "+4%", color: "#BA1A1A", bg: "rgba(255,218,214,0.5)" },
            icon: <svg width="18" height="18" viewBox="0 0 18 18" fill={C.roseDeep}><rect x="4" y="4" width="10" height="10" rx="1" stroke={C.roseDeep} strokeWidth="1.5" fill="none"/><rect x="6" y="6" width="6" height="6" rx="0.5" fill={C.roseDeep}/></svg>,
            iconBg: "#E0E0FF",
          },
          {
            label: "Scattered Packets (Loss)", val: "0.02", unit: "%",
            badge: { text: "Stable", color: C.slate, bg: "rgba(211,226,237,0.5)" },
            icon: <svg width="18" height="16" viewBox="0 0 20 16" fill={C.slate}><path d="M2 8h16M2 3h16M2 13h10" stroke={C.slate} strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>,
            iconBg: "#D6E5EF",
          },
        ].map((s) => (
          <Card key={s.label} className="col-span-4 p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-[0.06] -translate-y-1/4 translate-x-1/4">
              <svg width="100" height="100" viewBox="0 0 100 100" fill={C.pink}><circle cx="50" cy="50" r="48"/></svg>
            </div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.iconBg }}>
                {s.icon}
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold" style={{ background: s.badge.bg, color: s.badge.color }}>
                {s.badge.text}
              </span>
            </div>
            <p className="text-[13px] mt-3" style={{ color: C.warm }}>{s.label}</p>
            <div className="flex items-end gap-1 mt-1">
              <span className="font-['Playfair_Display'] font-semibold text-3xl" style={{ color: C.dark }}>{s.val}</span>
              <span className="text-lg mb-0.5" style={{ color: C.slate }}>{s.unit}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Users Page ────────────────────────────────────────────────────────────────
function UsersPage() {
  const statusStyle: Record<string, { bg: string; color: string }> = {
    Active:     { bg: "#E8F5E9", color: "#2E7D32" },
    "On Leave": { bg: "#D3E2ED", color: "#56656E" },
    Suspended:  { bg: "#FFDAD6", color: "#93000A" },
  };

  return (
    <div className="p-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-['Playfair_Display'] font-bold text-5xl tracking-tight" style={{ color: C.rose }}>Chorus of Souls</h1>
        <p className="mt-2 text-lg" style={{ color: C.slate }}>
          Manage the disparate entities and roles currently drifting through the<br />infrastructure ecosystem.
        </p>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold"
                  style={{ background: "rgba(249,249,249,0.5)", border: `1px solid ${C.pink}`, color: C.slate, backdropFilter: "blur(4px)" }}>
            Filter Roles
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold"
                  style={{ background: "rgba(249,249,249,0.5)", border: `1px solid ${C.pink}`, color: C.slate, backdropFilter: "blur(4px)" }}>
            Sort by Status
          </button>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-semibold"
                style={{ background: "linear-gradient(165deg, #F8BBD0, #FCE4EC)", color: C.rose, border: "1px solid rgba(255,255,255,0.5)" }}>
          + Summon Entity
        </button>
      </div>

      {/* User grid */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {users.map((u) => (
          <Card key={u.name} className="p-6 relative overflow-hidden" style={{ background: "#F9F9F9" }}>
            {/* Watermark */}
            <div className="absolute top-0 right-0 opacity-[0.08] -translate-y-1/4 translate-x-1/4">
              <svg width="90" height="90" viewBox="0 0 90 90" fill={C.pink}>
                <path d="M45 5C31 14 8 26 8 45a37 37 0 0074 0C82 26 59 14 45 5z"/>
              </svg>
            </div>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                     style={{ background: "linear-gradient(135deg, #F8BBD0, #805062)" }}>
                  {u.initials}
                </div>
                <div>
                  <p className="font-['Playfair_Display'] font-semibold text-xl leading-tight" style={{ color: C.dark }}>{u.name}</p>
                  <p className="text-[13px] mt-0.5" style={{ color: C.slate }}>{u.email}</p>
                </div>
              </div>
              <button className="opacity-40 hover:opacity-70">
                <svg width="4" height="16" viewBox="0 0 4 16" fill={C.slate}><circle cx="2" cy="2" r="1.5"/><circle cx="2" cy="8" r="1.5"/><circle cx="2" cy="14" r="1.5"/></svg>
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: "ROLE", val: u.role },
                { label: "DEPARTMENT", val: u.dept },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid #E2E2E2" }}>
                  <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: C.slate }}>{row.label}</span>
                  <span className="text-[15px] font-medium" style={{ color: C.dark }}>{row.val}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: C.slate }}>STATUS</span>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold" style={statusStyle[u.status]}>
                  {u.status}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Fill blank space: dept chart + quote */}
      <div className="grid grid-cols-2 gap-5">
        <Card className="p-6">
          <h3 className="font-['Playfair_Display'] font-semibold text-lg mb-4" style={{ color: C.dark }}>Souls by Department</h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Members" fill={C.pink} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between" style={{ background: "linear-gradient(135deg, rgba(248,187,208,0.10), rgba(252,228,236,0.06))" }}>
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-4" style={{ color: C.muted }}>Of the Gathering</p>
          <blockquote className="font-['Playfair_Display'] italic text-xl leading-relaxed" style={{ color: C.rose }}>
            "Each soul drifts through<br/>the same spring breeze,<br/>and yet—arrives differently."
          </blockquote>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full" style={{ background: C.green }} />
            <span className="text-[12px]" style={{ color: C.slate }}>4 Active  ·  </span>
            <div className="w-2 h-2 rounded-full" style={{ background: "#D3E2ED" }} />
            <span className="text-[12px]" style={{ color: C.slate }}>1 On Leave  ·  </span>
            <div className="w-2 h-2 rounded-full" style={{ background: C.red }} />
            <span className="text-[12px]" style={{ color: C.slate }}>1 Suspended</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Config Page ───────────────────────────────────────────────────────────────
function ConfigPage() {
  const [flags, setFlags] = useState({ sCurve: true, verbose: true, experimental: false });
  const [retention, setRetention] = useState("30 Days");
  const [freq, setFreq] = useState("Daily (Evening Wind)");

  return (
    <div className="p-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-['Playfair_Display'] font-bold text-5xl tracking-tight" style={{ color: C.rose }}>Ink & Paper</h1>
        <p className="mt-1 text-lg italic font-['Playfair_Display']" style={{ color: C.slate }}>System Configuration & Parameters</p>
      </div>

      <Card className="p-10 relative overflow-hidden">
        {/* Decorative watermark */}
        <div className="absolute right-8 top-8 opacity-[0.06]">
          <svg width="120" height="120" viewBox="0 0 120 120" fill={C.rose}>
            <path d="M60 6C44 18 12 32 12 60a48 48 0 0096 0C108 32 76 18 60 6z"/>
          </svg>
        </div>

        {/* Chapter I */}
        <h2 className="font-['Playfair_Display'] font-bold text-2xl mb-6" style={{ color: C.dark }}>Chapter I: Global Parameters</h2>
        <div className="space-y-6 mb-10">
          {[
            { label: "DATA RETENTION WINDOW", val: retention, set: setRetention, hint: "Duration before ephemeral logs drift away." },
            { label: "PRIMARY ACCESS KEY", val: "•".repeat(24), hint: null, masked: true },
            { label: "REPORTING FREQUENCY", val: freq, set: setFreq, hint: null },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-[11px] font-semibold tracking-widest uppercase block mb-2" style={{ color: C.slate }}>{f.label}</label>
              <div className="px-4 py-3 rounded-lg text-[15px]"
                   style={{ background: "#F9F9F9", border: "1px solid rgba(212,194,198,0.3)", color: C.dark, fontFamily: f.masked ? "monospace" : "inherit" }}>
                {f.val}
              </div>
              {f.hint && <p className="mt-1.5 text-[12px] italic" style={{ color: C.muted }}>{f.hint}</p>}
            </div>
          ))}
        </div>

        <div className="my-8" style={{ borderTop: "1px solid rgba(248,187,208,0.3)" }} />

        {/* Chapter II */}
        <h2 className="font-['Playfair_Display'] font-bold text-2xl mb-6" style={{ color: C.dark }}>Chapter II: Feature Flags</h2>
        <div className="space-y-5">
          {[
            { key: "sCurve" as const, label: "Enable S-Curve Interpolation", desc: "Smooths visual data to mimic falling petals." },
            { key: "verbose" as const, label: "Verbose Logging", desc: "Capture every whisper of the network." },
            { key: "experimental" as const, label: "Experimental Dashboards", desc: "Reveal unwritten futures (unstable)." },
          ].map((flag) => (
            <div key={flag.key} className="flex items-start gap-4">
              <button
                onClick={() => setFlags(f => ({ ...f, [flag.key]: !f[flag.key] }))}
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: flags[flag.key] ? C.rose : "white",
                  border: `2px solid ${flags[flag.key] ? C.rose : "#D4C2C6"}`,
                }}
              >
                {flags[flag.key] && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <div>
                <p className="font-medium" style={{ color: C.dark }}>{flag.label}</p>
                <p className="text-[12px] mt-0.5" style={{ color: C.muted }}>{flag.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-10">
          <button className="px-6 py-3 rounded-xl text-[13px] font-semibold"
                  style={{ background: "linear-gradient(135deg, #F8BBD0, #FCE4EC)", color: C.roseDeep, border: "1px solid rgba(248,187,208,0.5)" }}>
            Commit Changes
          </button>
        </div>
      </Card>

      {/* Yorushika poetic footer */}
      <div className="mt-6 p-5 rounded-2xl text-center" style={{ background: "rgba(248,187,208,0.06)", border: "1px solid rgba(248,187,208,0.15)" }}>
        <p className="font-['Playfair_Display'] italic text-[14px]" style={{ color: C.muted }}>
          "Write it in ink, let it dry on paper—<br/>
          <span className="text-[12px]">some configurations outlast the season that wrote them."</span>
        </p>
      </div>
    </div>
  );
}

// ── Top nav bar ───────────────────────────────────────────────────────────────
const PAGE_LABELS: Record<Page, string> = {
  dashboard: "First Breath",
  incidents: "Scattered Petals",
  reports:   "Echoes of Spring",
  users:     "Chorus of Souls",
  config:    "Ink & Paper",
};

function TopBar({ page }: { page: Page }) {
  return (
    <header
      className="fixed top-0 left-64 right-0 z-20 flex items-center justify-between px-6 py-3"
      style={{
        background: "rgba(250,247,248,0.82)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(248,187,208,0.25)",
        boxShadow: "0 1px 8px rgba(128,80,98,0.04)",
      }}
    >
      <div className="flex items-center gap-4">
        <span className="font-['Playfair_Display'] font-semibold text-xl" style={{ color: C.slate }}>InfraTrack</span>
        <span style={{ color: C.pink }}>›</span>
        <span className="text-[14px]" style={{ color: C.rose }}>{PAGE_LABELS[page]}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            className="pl-9 pr-4 py-2 rounded-lg text-[13px] outline-none"
            placeholder="Search the wind…"
            style={{ background: "rgba(211,226,237,0.2)", borderBottom: `1px solid #D6E5EF`, width: "192px", color: C.warm }}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="10" height="10" viewBox="0 0 10.5 10.5" fill={C.warm} opacity="0.5">
            <circle cx="4.5" cy="4.5" r="3.5" stroke={C.warm} strokeWidth="1.3" fill="none"/>
            <path d="M7.5 7.5l2 2" stroke={C.warm} strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
             style={{ background: "linear-gradient(135deg, #F8BBD0, #805062)", border: "1px solid #F8BBD0" }}>
          A
        </div>
      </div>
    </header>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, #FAF7F8 0%, #F5F0F2 50%, #F8F5F7 100%)` }}>
      {/* Ambient radial glow */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(248,187,208,0.08) 0%, transparent 70%)",
      }} />

      <FallingPetals />
      <Sidebar page={page} setPage={setPage} />
      <TopBar page={page} />

      {/* Main content */}
      <main className="pl-64 pt-14 relative z-10">
        {page === "dashboard"  && <DashboardPage />}
        {page === "incidents"  && <IncidentsPage />}
        {page === "reports"    && <ReportsPage />}
        {page === "users"      && <UsersPage />}
        {page === "config"     && <ConfigPage />}
      </main>
    </div>
  );
}
