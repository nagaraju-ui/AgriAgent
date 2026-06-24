import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Home from "./components/Home.jsx";
import Chat from "./components/Chat.jsx";
import { BottomNav } from "./components/cards.jsx";

const LOCATION = "Vijayawada";

export default function App() {
  const [nav, setNav] = useState("home");        // highlighted tab
  const [lang, setLang] = useState("en");
  const [seed, setSeed] = useState(null);

  const onTab = (id) => {
    if (id === "home") { setNav("home"); setSeed(null); }
    else if (id === "scan") { setNav("scan"); setSeed({ id: Date.now(), scan: true }); }
    else if (id === "voice") { setNav("voice"); setSeed({ id: Date.now(), voice: true }); }
    else { setNav("chat"); setSeed({ id: Date.now() }); }
  };
  const ask = (text) => { setNav("chat"); setSeed({ id: Date.now(), text }); };

  const showHome = nav === "home";

  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[460px] overflow-hidden bg-base">
      <AnimatePresence mode="wait">
        {showHome ? (
          <Home key="home" location={LOCATION} lang={lang} onAsk={ask} onScan={() => onTab("scan")} />
        ) : (
          <Chat key="chat" location={LOCATION} lang={lang} setLang={setLang}
            seed={seed} onBack={() => onTab("home")} />
        )}
      </AnimatePresence>
      <BottomNav active={nav} onTab={onTab} />
    </div>
  );
}
