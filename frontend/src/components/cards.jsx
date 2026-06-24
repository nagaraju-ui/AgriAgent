import React from "react";
import { motion } from "framer-motion";
import {
  Home, MessageCircle, TrendingUp, TrendingDown, Minus,
  Sprout, CloudSun, ClipboardList, Sparkles, ScanLine, Mic,
} from "lucide-react";
import { emoji, cap } from "../lib/derive.js";

export const spring = { type: "spring", stiffness: 320, damping: 26 };
export const rise = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

/* ---------- trend chip ---------- */
export function TrendChip({ trend }) {
  const map = {
    rising: ["text-success bg-success/10", TrendingUp, "Rising"],
    steady: ["text-success bg-success/10", TrendingUp, "Steady"],
    flat: ["text-ink/50 bg-ink/5", Minus, "Flat"],
    falling: ["text-danger bg-danger/10", TrendingDown, "Falling"],
  };
  const [cls, Icon, label] = map[trend] || map.flat;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <Icon size={13} /> {label}
    </span>
  );
}

/* ---------- skeleton ---------- */
export function Skeleton({ className = "" }) {
  return <div className={`shimmer rounded-3xl bg-ink/[0.06] ${className}`} />;
}

/* ---------- bottom nav ---------- */
export function BottomNav({ active, onTab }) {
  const side = [
    { id: "home", label: "Home", Icon: Home },
    { id: "scan", label: "Scan", Icon: ScanLine },
    { id: "chat", label: "Chat", Icon: MessageCircle },
  ];
  const item = (it) => {
    const on = active === it.id;
    return (
      <button key={it.id} onClick={() => onTab(it.id)}
        className="flex flex-1 flex-col items-center gap-1 py-1">
        <it.Icon size={23} className={on ? "text-primary" : "text-ink/40"} />
        <span className={`text-[11px] font-semibold ${on ? "text-primary" : "text-ink/40"}`}>{it.label}</span>
      </button>
    );
  };
  const onVoice = active === "voice";
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[460px] -translate-x-1/2 border-t border-ink/5 bg-white/95 backdrop-blur-xl">
      <div className="flex items-end px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
        {item(side[0])}
        {item(side[1])}
        {/* elevated center Voice */}
        <button onClick={() => onTab("voice")} className="flex flex-1 flex-col items-center">
          <motion.div whileTap={{ scale: 0.92 }}
            className={`-mt-8 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-glow ring-4 ring-white ${onVoice ? "scale-105" : ""}`}>
            <Mic size={24} />
          </motion.div>
          <span className="mt-0.5 text-[11px] font-bold text-primary">Voice</span>
        </button>
        {item(side[2])}
      </div>
    </nav>
  );
}

/* ---------- chat response cards (each a different treatment) ---------- */
function CropCard({ crop, pct, trend, i }) {
  return (
    <motion.div {...rise} transition={{ ...spring, delay: i * 0.06 }}
      className="overflow-hidden rounded-4xl bg-gradient-to-br from-primary to-secondary p-5 text-white shadow-glow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
          <Sprout size={18} /> Crop Recommendation
        </div>
        <span className="text-3xl">{emoji(crop)}</span>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <div className="text-3xl font-extrabold leading-tight">{cap(crop)}</div>
          <div className="mt-1 text-sm opacity-90">{trend === "rising" ? "Good selling window" : "Best fit right now"}</div>
        </div>
        <Ring pct={pct} />
      </div>
    </motion.div>
  );
}

function Ring({ pct }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-[68px] w-[68px] place-items-center">
      <svg className="absolute -rotate-90" width="68" height="68">
        <circle cx="34" cy="34" r={r} stroke="rgba(255,255,255,.25)" strokeWidth="6" fill="none" />
        <motion.circle cx="34" cy="34" r={r} stroke="white" strokeWidth="6" fill="none"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * pct) / 100 }}
          transition={{ duration: 0.9, ease: "easeOut" }} />
      </svg>
      <div className="text-center leading-none">
        <div className="text-lg font-extrabold">{pct}%</div>
        <div className="text-[9px] font-semibold opacity-80">MATCH</div>
      </div>
    </div>
  );
}

function WeatherCard({ rain7, tmax, summary, i }) {
  return (
    <motion.div {...rise} transition={{ ...spring, delay: i * 0.06 }}
      className="rounded-4xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 shadow-card">
      <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
        <CloudSun size={18} /> Weather Analysis
      </div>
      <div className="mt-3 flex items-center gap-5">
        <span className="text-4xl">🌤</span>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {tmax != null && <div><span className="text-ink/50">High</span> <b>{Math.round(tmax)}°C</b></div>}
          {rain7 != null && <div><span className="text-ink/50">Rain 7d</span> <b>{rain7} mm</b></div>}
          <div className="col-span-2 text-ink/60">{summary || "Conditions look stable"}</div>
        </div>
      </div>
    </motion.div>
  );
}

function MarketCard({ movers, i }) {
  return (
    <motion.div {...rise} transition={{ ...spring, delay: i * 0.06 }}
      className="rounded-4xl border border-ink/5 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <TrendingUp size={18} /> Market Trend
      </div>
      <div className="mt-3 space-y-2.5">
        {movers.map((m) => (
          <div key={m.crop} className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <span>{emoji(m.crop)}</span> {cap(m.crop)}
            </div>
            <div className="flex items-center gap-3">
              {m.modal_price && <span className="font-semibold">₹{m.modal_price}/q</span>}
              <TrendChip trend={m.trend} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function PlanCard({ steps, i }) {
  return (
    <motion.div {...rise} transition={{ ...spring, delay: i * 0.06 }}
      className="rounded-4xl border border-accent/30 bg-accent/[0.07] p-5 shadow-card">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <ClipboardList size={18} /> Action Plan
      </div>
      <ol className="mt-3 space-y-2.5">
        {steps.map((s, k) => (
          <li key={k} className="flex items-start gap-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">{k + 1}</span>
            <span className="text-[15px] leading-snug">{s}</span>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}

function NoteCard({ text, i }) {
  if (!text) return null;
  return (
    <motion.div {...rise} transition={{ ...spring, delay: i * 0.06 }}
      className="rounded-4xl border border-ink/5 bg-white p-5 shadow-card">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink/70">
        <Sparkles size={16} className="text-accent" /> Agronomist's note
      </div>
      <p className="text-[15px] leading-relaxed text-ink/80">{text}</p>
    </motion.div>
  );
}

export function ResponseCards({ cards }) {
  return (
    <div className="space-y-3">
      {cards.map((c, i) => {
        if (c.type === "crop") return <CropCard key={i} i={i} {...c} />;
        if (c.type === "weather") return <WeatherCard key={i} i={i} {...c} />;
        if (c.type === "market") return <MarketCard key={i} i={i} {...c} />;
        if (c.type === "plan") return <PlanCard key={i} i={i} {...c} />;
        if (c.type === "note") return <NoteCard key={i} i={i} {...c} />;
        return null;
      })}
    </div>
  );
}
