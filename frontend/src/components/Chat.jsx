import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Mic, Send, ArrowLeft, Languages } from "lucide-react";
import { sendChat, analyzeImage } from "../api.js";
import { chatCards } from "../lib/derive.js";
import { ResponseCards, rise, spring } from "./cards.jsx";

const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

async function speak(text, lang) {
  if (!text) return;
  // Backend gTTS first — reliable Telugu + English voices.
  try {
    const r = await fetch("/api/tts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
    });
    if (r.ok && r.headers.get("content-type")?.includes("audio")) {
      const audio = new Audio(URL.createObjectURL(await r.blob()));
      await audio.play();
      return;
    }
  } catch { /* fall through to browser TTS */ }
  // Fallback: browser speech engine (may lack a Telugu voice).
  if (window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "te" ? "te-IN" : "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}

export default function Chat({ location, lang, setLang, seed, onBack }) {
  const [msgs, setMsgs] = useState([
    { role: "bot", kind: "text", text: "Namaste 🙏 I'm AgriAgent. Ask me what to sow, snap a sick leaf, or check the market." },
  ]);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [recording, setRec] = useState(false);
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const histRef = useRef([]);
  const recRef = useRef(null);

  const scroll = () => endRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scroll, [msgs, busy]);

  // seed from home / bottom-nav: open camera, start mic, or send a question
  useEffect(() => {
    if (!seed) return;
    if (seed.scan) fileRef.current?.click();
    else if (seed.voice) mic();
    else if (seed.text) send(seed.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed?.id]);

  async function send(q) {
    const message = (q ?? text).trim();
    if (!message || busy) return;
    setText("");
    setMsgs((m) => [...m, { role: "user", kind: "text", text: message }]);
    setBusy(true);
    try {
      const res = await sendChat(message, histRef.current, location, lang);
      histRef.current = [...histRef.current, ["user", message], ["assistant", res.reply]].slice(-8);
      const cards = res.type === "advice" ? chatCards(res.reply, res.signals) : null;
      setMsgs((m) => [...m, cards
        ? { role: "bot", kind: "cards", cards }
        : { role: "bot", kind: "text", text: res.reply }]);
      speak(res.reply, lang);
    } catch {
      setMsgs((m) => [...m, { role: "bot", kind: "text", text: "Network error. Is the backend running on :8000?" }]);
    }
    setBusy(false);
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMsgs((m) => [...m, { role: "user", kind: "image", url }]);
    setBusy(true);
    try {
      const res = await analyzeImage(file, "", lang);
      setMsgs((m) => [...m, { role: "bot", kind: "scan", text: res.reply }]);
      speak(res.reply, lang);
    } catch {
      setMsgs((m) => [...m, { role: "bot", kind: "text", text: "Could not analyse that photo." }]);
    }
    setBusy(false);
  }

  async function mic() {
    // tap again to stop
    if (recording && recRef.current) { recRef.current.stop(); return; }
    if (!SR) {
      alert("Voice input needs Chrome or Edge. Please type your question instead.");
      return;
    }
    // Make sure the browser actually has mic permission (gives a clear prompt).
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach((t) => t.stop());
      }
    } catch {
      alert("Microphone is blocked. Click the lock/🎤 icon at the left of the address bar, set Microphone to Allow, then try again.");
      return;
    }
    const rec = new SR();
    recRef.current = rec;
    rec.lang = lang === "te" ? "te-IN" : "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setRec(true);
    rec.onresult = (e) => {
      const t = e.results?.[0]?.[0]?.transcript;
      if (t) send(t);
    };
    rec.onerror = (e) => {
      setRec(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed")
        alert("Microphone access is blocked. Allow it for this site in the address bar and retry.");
      else if (e.error === "no-speech")
        alert("I didn't hear anything — please tap the mic and speak again.");
      else if (e.error === "network")
        alert("Voice recognition needs an internet connection.");
    };
    rec.onend = () => { setRec(false); recRef.current = null; };
    try { rec.start(); } catch { setRec(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex h-[100dvh] flex-col">

      {/* header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-ink/5 bg-white/85 px-4 py-3 backdrop-blur-xl pt-[max(12px,env(safe-area-inset-top))]">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full bg-base"><ArrowLeft size={18} /></button>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white">🌿</div>
          <div>
            <div className="text-sm font-extrabold leading-tight">AgriAgent</div>
            <div className="text-[11px] text-success">● online</div>
          </div>
        </div>
        <button onClick={() => setLang(lang === "te" ? "en" : "te")}
          className="ml-auto flex items-center gap-1 rounded-full bg-base px-3 py-1.5 text-xs font-bold">
          <Languages size={14} /> {lang === "te" ? "తె" : "EN"}
        </button>
      </header>

      {/* messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-40">
        {msgs.map((m, i) => (
          <Message key={i} m={m} />
        ))}
        {busy && <Typing />}
        <div ref={endRef} />
      </div>

      {/* floating composer — sits just above the bottom nav */}
      <div className="fixed bottom-[72px] left-1/2 z-20 w-full max-w-[460px] -translate-x-1/2 px-4">
        <div className="flex items-center gap-2 rounded-full border border-ink/5 bg-white p-1.5 shadow-soft">
          <button onClick={() => fileRef.current?.click()} className="grid h-11 w-11 place-items-center rounded-full bg-base text-primary active:scale-95">
            <Camera size={20} />
          </button>
          <input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask anything…" className="min-w-0 flex-1 bg-transparent px-1 text-[15px] outline-none" />
          <motion.button onClick={mic} animate={recording ? { scale: [1, 1.12, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            className={`grid h-11 w-11 place-items-center rounded-full active:scale-95 ${recording ? "bg-danger text-white" : "bg-base text-primary"}`}>
            <Mic size={20} />
          </motion.button>
          <button onClick={() => send()} disabled={!text.trim()}
            className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-glow active:scale-95 disabled:opacity-40">
            <Send size={18} />
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
    </motion.div>
  );
}

function Message({ m }) {
  if (m.role === "user") {
    return (
      <motion.div {...rise} transition={spring} className="flex justify-end">
        {m.kind === "image"
          ? <img src={m.url} alt="" className="max-w-[70%] rounded-3xl rounded-br-md border border-ink/5" />
          : <div className="max-w-[80%] rounded-3xl rounded-br-md bg-gradient-to-br from-primary to-secondary px-4 py-2.5 text-[15px] text-white shadow-card">{m.text}</div>}
      </motion.div>
    );
  }
  if (m.kind === "cards") {
    return <div className="max-w-[92%]"><ResponseCards cards={m.cards} /></div>;
  }
  if (m.kind === "scan") {
    return (
      <motion.div {...rise} transition={spring}
        className="max-w-[88%] rounded-4xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5 shadow-card">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-rose-600">🔬 Scan Result</div>
        <p className="text-[15px] leading-relaxed text-ink/80">{m.text}</p>
      </motion.div>
    );
  }
  return (
    <motion.div {...rise} transition={spring}
      className="max-w-[82%] rounded-3xl rounded-bl-md border border-ink/5 bg-white px-4 py-2.5 text-[15px] leading-relaxed shadow-card">
      {m.text}
    </motion.div>
  );
}

function Typing() {
  return (
    <div className="flex w-16 items-center justify-center gap-1 rounded-3xl rounded-bl-md border border-ink/5 bg-white px-4 py-3 shadow-card">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="h-2 w-2 rounded-full bg-primary/60"
          animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
      ))}
    </div>
  );
}
