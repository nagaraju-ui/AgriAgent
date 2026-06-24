// ---------- state ----------
let LANG = "en";
let LOCATION = "Vijayawada";
let history = [];          // [[role, text], ...]
let pendingImage = null;   // File selected for analysis

const $ = (id) => document.getElementById(id);

// ---------- navigation ----------
function go(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $("view-" + view).classList.add("active");
  document.querySelectorAll(".nav").forEach(n => n.classList.remove("active"));
  $("nav-" + view).classList.add("active");
  if (view === "chat") setTimeout(() => $("text").focus(), 100);
}
function ask(text) { go("chat"); $("text").value = text; send(); }

// ---------- home ----------
function greet() {
  const h = new Date().getHours();
  $("greeting").textContent = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  $("today").textContent = new Date().toLocaleDateString(undefined,
    { weekday: "long", day: "numeric", month: "short" });
}
const TREND = { rising: ["▲", "up"], steady: ["▲", "up"], flat: ["▬", "flat"],
                falling: ["▼", "down"], unknown: ["", "flat"] };
const EMOJI = { paddy: "🌾", maize: "🌽", cotton: "🌱", wheat: "🌾", tomato: "🍅",
                chilli: "🌶️", groundnut: "🥜" };

async function loadHome() {
  greet();
  try {
    const r = await fetch("/api/home?location=" + encodeURIComponent(LOCATION));
    const d = await r.json();
    const w = d.weather || {};
    if (w.tmax_c != null) $("wTemp").textContent = Math.round(w.tmax_c) + "°";
    $("wCond").textContent = w.summary || "Weather";
    if (w.rain_7d_mm != null) $("wRain").textContent = w.rain_7d_mm + " mm / 7d";
    const box = $("prices"); box.innerHTML = "";
    for (const [c, p] of Object.entries(d.prices || {})) {
      const [arrow, cls] = TREND[(p && p.trend) || "unknown"] || TREND.unknown;
      const price = p && p.modal_price ? "₹" + p.modal_price + "/q" : "—";
      box.insertAdjacentHTML("beforeend",
        `<div class="price"><div class="emoji">${EMOJI[c] || "🌿"}</div>
         <div class="name">${c}</div><div class="val">${price}</div>
         <div class="trend ${cls}">${arrow} ${(p && p.trend) || ""}</div></div>`);
    }
  } catch (e) { $("wCond").textContent = "Offline"; }
}

// ---------- chat ----------
function bubble(role, html) {
  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "me" : "bot");
  div.innerHTML = html;
  $("messages").appendChild(div);
  div.scrollIntoView({ behavior: "smooth", block: "end" });
  return div;
}
function escapeHtml(s){return (s||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}

async function send(ev) {
  if (ev) ev.preventDefault();
  const input = $("text");
  const text = input.value.trim();
  LANG = $("lang").value;

  // photo flow
  if (pendingImage) {
    const img = pendingImage; pendingImage = null; clearImg();
    const url = URL.createObjectURL(img);
    bubble("user", `<img src="${url}">${escapeHtml(text) || "Analyse this crop photo"}`);
    input.value = "";
    const t = bubble("bot", '<span class="typing">Looking at your photo…</span>');
    const fd = new FormData();
    fd.append("image", img); fd.append("question", text); fd.append("lang", LANG);
    try {
      const r = await fetch("/api/analyze", { method: "POST", body: fd });
      const d = await r.json();
      t.innerHTML = escapeHtml(d.reply); speak(d.reply);
      history.push(["user", text || "[crop photo]"], ["assistant", d.reply]);
    } catch (e) { t.innerHTML = "Sorry, I could not analyse that photo."; }
    return false;
  }

  if (!text) return false;
  bubble("user", escapeHtml(text));
  input.value = "";
  const t = bubble("bot", '<span class="typing">Thinking…</span>');
  try {
    const r = await fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history, location: LOCATION, lang: LANG })
    });
    const d = await r.json();
    let html = escapeHtml(d.reply);
    if (d.signals) {
      html += `<details class="detail"><summary>Live signals I used</summary>
               <pre>${escapeHtml(JSON.stringify(d.signals, null, 2))}</pre></details>`;
    }
    t.innerHTML = html; speak(d.reply);
    history.push(["user", text], ["assistant", d.reply]);
  } catch (e) { t.innerHTML = "Network error. Is the server running?"; }
  return false;
}

// ---------- image (camera / upload) ----------
function onFile(el) {
  if (!el.files || !el.files[0]) return;
  pendingImage = el.files[0];
  $("imgPreviewEl").src = URL.createObjectURL(pendingImage);
  $("imgPreview").classList.remove("hidden");
  go("chat");
}
function clearImg() { pendingImage = null; $("imgPreview").classList.add("hidden"); $("file").value = ""; }

// ---------- voice in (Web Speech API) ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
$("micBtn").addEventListener("click", () => {
  if (!SR) { alert("Voice input is not supported in this browser. Please type."); return; }
  const rec = new SR();
  rec.lang = $("lang").value === "te" ? "te-IN" : "en-IN";
  rec.onresult = (e) => { $("text").value = e.results[0][0].transcript; send(); };
  $("micBtn").classList.add("rec");
  rec.onend = () => $("micBtn").classList.remove("rec");
  rec.start();
});

// ---------- voice out (TTS) ----------
function speak(text) {
  if (!window.speechSynthesis || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = $("lang").value === "te" ? "te-IN" : "en-IN";
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}

// ---------- init + PWA ----------
loadHome();
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
