const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/api/score", async (req, res) => {
  try {
    const response = await fetch("https://cricheroes.com/_next/data/GWn-9wsDkpg5k-2hvyhaR/scorecard/18754689/individual/jaajssi-vs-jeejej/live.json");
    const data = await response.json();

    // Extract only the needed `miniScorecard` path
    const mini = data.pageProps?.miniScorecard?.data;
    if (!mini) return res.json({ error: "Product not found" });

    // Pick batting info
    const battingTeam = mini.team_a.summary && !/Yet to bat/i.test(mini.team_a.summary)
      ? mini.team_a : mini.team_b;
    const inning = battingTeam.innings?.[0] || {};
    const batsmen = mini.batsmen || {};
    const bowler = mini.bowlers?.sb || mini.bowlers?.nsb || {};

    res.json({
      team: battingTeam.name || "",
      score: inning.summary?.score || "",
      overs: inning.summary?.over?.replace(/[()]/g, "") || inning.overs_played || "",
      crr: inning.summary?.rr || "",
      batsman1: { name: batsmen.sb?.name || "", runs: batsmen.sb?.runs || 0, balls: batsmen.sb?.balls || 0 },
      batsman2: { name: batsmen.nsb?.name || "", runs: batsmen.nsb?.runs || 0, balls: batsmen.nsb?.balls || 0 },
      bowler: { name: bowler.name || "", overs: bowler.overs || "", runs: bowler.runs || 0, wickets: bowler.wickets || 0 },
      balls: inning.summary?.over && (inning.summary.over.startsWith("(") ? mini.recent_over.split("|")[0].trim().split(" ") : []) || []
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
