const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

// Public folder serve karna (index.html etc.)
app.use(express.static("public"));

// Score API route
app.get("/api/score", async (req, res) => {
  try {
    const response = await fetch("https://cricheroes.com/_next/data/GWn-9wsDkpg5k-2hvyhaR/scorecard/18754689/individual/jaajssi-vs-jeejej/live.json");
    const data = await response.json();

    res.json(data); // API ka data browser me return hoga
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch score" });
  }
});

// Server listen
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
