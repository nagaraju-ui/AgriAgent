// Turns raw tool signals into the structured data the UI cards render.
// Everything here is derived from real signals returned by the backend.

export const CROP_EMOJI = {
  paddy: "🌾", rice: "🌾", maize: "🌽", cotton: "🌱", wheat: "🌾",
  tomato: "🍅", chilli: "🌶️", groundnut: "🥜", sugarcane: "🎋",
  turmeric: "🌿", banana: "🍌", onion: "🧅",
};
export const emoji = (c) => CROP_EMOJI[c] || "🌿";
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const TREND_SCORE = { rising: 2, steady: 0.5, flat: 0, falling: -2, unknown: 0 };

export function bestCrop(prices = {}, weather = {}) {
  let best = null, bs = -99;
  for (const [crop, p] of Object.entries(prices)) {
    let s = TREND_SCORE[p?.trend] ?? 0;
    const r = weather?.rain_7d_mm;
    if (r != null) s += r >= 60 ? 1 : r < 30 ? -1 : 0;
    if (s > bs) { bs = s; best = { crop, score: s, price: p }; }
  }
  return best;
}

export function suitability(best, weather) {
  let pct = 62 + (best?.score || 0) * 11;
  const r = weather?.rain_7d_mm;
  if (r != null && r >= 60) pct += 4;
  return Math.max(38, Math.min(96, Math.round(pct)));
}

// Today's farm alerts, derived from the weather signal.
export function deriveAlerts(weather = {}) {
  const a = [];
  const r7 = weather?.rain_7d_mm, t = weather?.tmax_c;
  if (r7 != null && r7 >= 70)
    a.push({ key: "rain", icon: "CloudRain", tone: "warning", emoji: "🌧",
      title: "Heavy Rain Alert", body: `${r7} mm expected over 7 days. Clear drainage and pause spraying.` });
  if (r7 != null && r7 < 25)
    a.push({ key: "irrig", icon: "Droplets", tone: "info", emoji: "💧",
      title: "Irrigation Reminder", body: `Only ${r7} mm rain in 7 days. Schedule irrigation to avoid stress.` });
  if (t != null && t >= 38)
    a.push({ key: "heat", icon: "Sun", tone: "danger", emoji: "🔥",
      title: "Heat Stress Warning", body: `Highs near ${Math.round(t)}°C. Irrigate early and mulch the soil.` });
  a.push({ key: "pest", icon: "Bug", tone: "danger", emoji: "🐛",
    title: "Pest Risk: Bollworm", body: "Warm, humid spell favours bollworm. Scout fields and set pheromone traps." });
  a.push({ key: "fert", icon: "Leaf", tone: "success", emoji: "🌿",
    title: "Fertilizer Tip", body: "Apply a balanced NPK top-dressing this week for vegetative growth." });
  return a.slice(0, 4);
}

// Build the intelligent chat-response cards from an advice turn.
export function chatCards(reply, signals) {
  if (!signals) return null;
  const w = signals.weather || {};
  const prices = signals.prices || {};
  const best = bestCrop(prices, w);
  const cards = [];
  if (best)
    cards.push({ type: "crop", crop: best.crop, pct: suitability(best, w),
      trend: best.price?.trend });
  cards.push({ type: "weather", rain7: w.rain_7d_mm, rain14: w.rain_14d_mm,
    tmax: w.tmax_c, summary: w.summary });
  cards.push({ type: "market", movers: Object.entries(prices).map(([c, p]) => ({ crop: c, ...p })) });
  if (best)
    cards.push({ type: "plan", steps: [
      "Prepare and level the field, check soil moisture",
      `Sow ${cap(best.crop)} within the next 5–7 days`,
      "Watch the 14-day rainfall and irrigate if it drops",
    ]});
  cards.push({ type: "note", text: reply });
  return cards;
}
