// Server.js
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

async function getBuildId(id, slug) {
  const pageUrl = `https://cricheroes.com/scorecard/${id}/individual/${slug}/live`;
  const r = await fetch(pageUrl, { headers: { "User-Agent": "Mozilla/5.0" }});
  if (!r.ok) throw new Error(`Page fetch ${r.status}`);
  const html = await r.text();
  const m = html.match(/"buildId":"([^"]+)"/);
  if (!m) throw new Error("buildId not found");
  return m[1];
}

app.get("/api/score", async (req, res) => {
  try {
    let { id, slug, url } = req.query;

    // Direct JSON url support
    if (url) {
      if (!/^https:\/\/cricheroes\.com\/_next\/data\//.test(url))
        return res.status(400).json({ error: "Invalid url" });
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept":"application/json" }});
      if (!r.ok) return res.status(r.status).json({ error: `Upstream ${r.status}`});
      return res.json(await r.json());
    }

    // Fallback to id+slug (recommended)
    id = id || "18754689";
    slug = slug || "jaajssi-vs-jeejej";

    const buildId = await getBuildId(id, slug);
    const jsonUrl = `https://cricheroes.com/_next/data/${buildId}/scorecard/${id}/individual/${slug}/live.json`;

    const r = await fetch(jsonUrl, { headers: { "User-Agent": "Mozilla/5.0", "Accept":"application/json" }});
    if (!r.ok) return res.status(r.status).json({ error: `Upstream ${r.status}`});
    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error("API error:", e);
    res.status(500).json({ error: e.message || "Failed to fetch score" });
  }
});

// Health check (optional)
app.get("/health", (req,res)=>res.send("ok"));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
