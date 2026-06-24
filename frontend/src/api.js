// Talks to the FastAPI backend (proxied to :8000 in dev).

const jsonPost = (body) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function getHome(location = "Vijayawada") {
  const r = await fetch("/api/home?location=" + encodeURIComponent(location));
  if (!r.ok) throw new Error("home");
  return r.json();
}

export async function sendChat(message, history, location, lang) {
  const r = await fetch("/api/chat", jsonPost({ message, history, location, lang }));
  return r.json();
}

export async function analyzeImage(file, question, lang) {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("question", question || "");
  fd.append("lang", lang || "en");
  const r = await fetch("/api/analyze", { method: "POST", body: fd });
  return r.json();
}
