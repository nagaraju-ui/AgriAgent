import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sprout, ScanLine, CloudSun, Wallet, Bug, CloudRain, Droplets,
  Leaf, Sun, ChevronRight, MapPin, History, Bell,
} from "lucide-react";
import { getHome } from "../api.js";
import { bestCrop, suitability, deriveAlerts, emoji, cap } from "../lib/derive.js";
import { Skeleton, spring } from "./cards.jsx";

const ALERT_ICON = { Bug, CloudRain, Droplets, Leaf, Sun };
const TONE = {
  warning: "from-amber-50 to-white border-amber-100 text-amber-600",
  danger: "from-rose-50 to-white border-rose-100 text-rose-600",
  success: "from-emerald-50 to-white border-emerald-100 text-emerald-600",
  info: "from-sky-50 to-white border-sky-100 text-sky-600",
};

export default function Home({ location, lang, onAsk, onScan }) {
  const [data, setData] = useState(null);
  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long" });
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  useEffect(() => { getHome(location).then(setData).catch(() => setData({})); }, [location]);

  const weather = data?.weather || {};
  const prices = data?.prices || {};
  const best = bestCrop(prices, weather);
  const pct = best ? suitability(best, weather) : 0;
  const alerts = deriveAlerts(weather);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="px-5 pb-28 pt-[max(18px,env(safe-area-inset-top))]">

      {/* HEADER */}
      <header className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold tracking-tight">{greet} 👨‍🌾</div>
          <div className="mt-1 flex items-center gap-1 text-sm text-ink/50">
            <MapPin size={14} /> {location} · {today}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-card">
            <Bell size={20} className="text-ink/70" />
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-danger" />
          </button>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-xl text-white shadow-soft">🧑‍🌾</div>
        </div>
      </header>

      {/* SMART FARM HERO CARD */}
      {!data ? <Skeleton className="h-44" /> : (
        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}
          className="relative overflow-hidden rounded-5xl bg-gradient-to-br from-primary via-[#1c8a44] to-secondary p-6 text-white shadow-glow">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-black/10" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Smart Farm · AI Pick</span>
              <span className="text-4xl">{emoji(best?.crop)}</span>
            </div>
            <div className="mt-3 text-3xl font-extrabold">{best ? `${cap(best.crop)} Recommended` : "Analyzing…"}</div>
            <div className="mt-1 text-sm opacity-90">{pct}% match for your conditions this week</div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <Stat icon="🌧" label="Rain 7d" value={weather.rain_7d_mm != null ? `${weather.rain_7d_mm}mm` : "—"} />
              <Stat icon="🌡" label="High" value={weather.tmax_c != null ? `${Math.round(weather.tmax_c)}°` : "—"} />
              <Stat icon="📈" label="Market" value={best?.price?.trend ? cap(best.price.trend) : "—"} />
            </div>
            <button onClick={() => onAsk(`Why is ${best ? best.crop : "this crop"} recommended for me this week?`)}
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-2xl bg-white py-3 text-sm font-bold text-primary active:scale-[.98]">
              See full recommendation <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* TODAY'S FARM ALERTS — horizontal */}
      <SectionTitle>Today's Farm Alerts</SectionTitle>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {(!data ? [0, 1, 2] : alerts).map((a, i) =>
          !data ? <Skeleton key={i} className="h-28 w-60 shrink-0" /> : (
            <motion.button key={a.key} onClick={() => onAsk(`${a.title}: ${a.body} What should I do?`)}
              whileTap={{ scale: 0.97 }}
              className={`flex w-60 shrink-0 flex-col gap-2 rounded-3xl border bg-gradient-to-br p-4 text-left shadow-card ${TONE[a.tone]}`}>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-xl shadow-sm">{a.emoji}</div>
              <div className="font-bold text-ink">{a.title}</div>
              <div className="line-clamp-2 text-xs text-ink/60">{a.body}</div>
            </motion.button>
          )
        )}
      </div>

      {/* QUICK ACTIONS 2x2 */}
      <SectionTitle>Quick Actions</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Action Icon={Sprout} grad="from-primary to-secondary" title="Crop Advice" sub="What to grow now"
          onClick={() => onAsk("What should I sow this week and why?")} />
        <Action Icon={ScanLine} grad="from-rose-500 to-rose-400" title="Scan Disease" sub="Photo a sick crop"
          onClick={onScan} />
        <Action Icon={CloudSun} grad="from-sky-500 to-cyan-400" title="Weather" sub="Plan your week"
          onClick={() => onAsk("Give me a weather plan for my farm this week.")} />
        <Action Icon={Wallet} grad="from-amber-500 to-yellow-400" title="Market Prices" sub="Best time to sell"
          onClick={() => onAsk("How are mandi prices doing for my crops?")} />
      </div>

      {/* MARKET SCROLL */}
      <SectionTitle>Market Today</SectionTitle>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {(!data ? [0, 1, 2] : Object.entries(prices)).map((e, i) =>
          !data ? <Skeleton key={i} className="h-28 w-32 shrink-0" /> : (
            <motion.div key={e[0]} whileTap={{ scale: 0.97 }}
              className="w-32 shrink-0 rounded-3xl border border-ink/5 bg-white p-4 shadow-card">
              <div className="text-3xl">{emoji(e[0])}</div>
              <div className="mt-2 font-bold">{cap(e[0])}</div>
              <div className="text-primary font-extrabold">{e[1]?.modal_price ? `₹${e[1].modal_price}` : "—"}<span className="text-xs font-medium text-ink/40">/q</span></div>
              <div className={`mt-1 text-xs font-semibold ${e[1]?.trend === "falling" ? "text-danger" : e[1]?.trend === "flat" ? "text-ink/40" : "text-success"}`}>
                {e[1]?.trend === "falling" ? "▼" : "▲"} {cap(e[1]?.trend || "")}
              </div>
            </motion.div>
          )
        )}
      </div>

      {/* RECENT ACTIVITY */}
      <SectionTitle>Recent Activity</SectionTitle>
      <div className="mb-2 space-y-2.5">
        <Recent emoji="🌾" title="Cotton vs paddy recommendation" sub="Today · grounded in live signals"
          onClick={() => onAsk("Cotton or paddy this week?")} />
        <Recent emoji="📸" title="Leaf disease scan" sub="Yesterday · early blight detected"
          onClick={onScan} />
        <Recent emoji="💧" title="Irrigation reminder" sub="2 days ago"
          onClick={() => onAsk("When should I irrigate next?")} />
      </div>
    </motion.div>
  );
}

/* ---- small building blocks ---- */
function SectionTitle({ children }) {
  return <h2 className="mb-3 mt-6 text-[15px] font-extrabold tracking-tight text-ink/80">{children}</h2>;
}
function Stat({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/12 py-2">
      <div className="text-base">{icon}</div>
      <div className="mt-0.5 font-bold">{value}</div>
      <div className="text-[10px] opacity-80">{label}</div>
    </div>
  );
}
function Action({ Icon, grad, title, sub, onClick }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick}
      className="rounded-4xl border border-ink/5 bg-white p-4 text-left shadow-card">
      <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${grad} text-white shadow-sm`}>
        <Icon size={22} />
      </div>
      <div className="mt-3 font-bold">{title}</div>
      <div className="text-xs text-ink/50">{sub}</div>
    </motion.button>
  );
}
function Recent({ emoji, title, sub, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-3xl border border-ink/5 bg-white p-3.5 text-left shadow-card">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-base text-lg">{emoji}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{title}</div>
        <div className="text-xs text-ink/45">{sub}</div>
      </div>
      <History size={16} className="opacity-30" />
    </button>
  );
}
