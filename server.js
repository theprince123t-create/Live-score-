const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Public folder serve karna (overlay UI)
app.use(express.static("public"));

// API route for fetching score
app.get("/api/score", async (req, res) => {
  try {
    const { id, slug } = req.query;

    if (!id || !slug) {
      return res.status(400).json({ error: "Missing id or slug in query" });
    }

    // Cricheroes JSON API banani
    const apiUrl = `https://cricheroes.com/_next/data/GWn-9wsDkpg5k-2hvyhaR/scorecard/${id}/individual/${slug}/live.json`;

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Cricheroes fetch failed" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch score" });
  }
});

// Server listen
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
