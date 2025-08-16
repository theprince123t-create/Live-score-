const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "accept": "text/html,application/xhtml+xml"
    }
  });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return res.text();
}

function parseNextData(html) {
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/
  );
  if (!m) throw new Error("__NEXT_DATA__ not found");
  return JSON.parse(m[1]);
}

function pickBatting(mini) {
  // jo team batting kar rahi hai, uski summary "Yet to bat" nahi hogi
  const a = mini.team_a;
  const b = mini.team_b;
  const aBat = a?.summary && !/Yet to bat/i.test(a.summary);
  return aBat ? { team: a, which: "A" } : { team: b, which: "B" };
}

function lastSix(mini) {
  // recent_over jaise "2 3 0 0 6 2 | 1 2 1 "
  let arr = (mini.recent_over || "")
    .replace(/\|/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (arr.length === 0 && Array.isArray(mini.commentary)) {
    // fallback: commentary se runs map kar lo
    arr = mini.commentary
      .slice(-6)
      .map((b) => (b.is_out ? "W" : String(b.run ?? "")));
  }
  // sirf last 6
  arr = arr.slice(-6);
  // agar 6 se kam ho, pad se fill karo
  while (arr.length < 6) arr.unshift("");
  return arr;
}

// API: 1) full match URL दो  ?url=<cricheroes live link>
//      2) sirf id दो        ?id=18754689&slug=TeamA-vs-TeamB (slug optional but safer)
app.get("/api", async (req, res) => {
  try {
    let { url, id, slug } = req.query;
    let pageUrl = url;

    if (!pageUrl && id) {
      // slug दिया है तो सबसे reliable
      if (slug) {
        pageUrl = `https://cricheroes.com/scorecard/${id}/individual/${slug}/live`;
      } else {
        // कभी-कभी slug mandatory होता है—अगर ये fail हो, तो URL mode use करें
        pageUrl = `https://cricheroes.com/scorecard/${id}/individual/live`;
      }
    }

    if (!pageUrl) {
      return res.status(400).json({
        error:
          "Provide ?url=<live page link> OR ?id=<matchId>&slug=<TeamA-vs-TeamB>"
      });
    }

    const html = await fetchText(pageUrl);
    const next = parseNextData(html);

    const mini = next?.props?.pageProps?.miniScorecard?.data;
    if (!mini) throw new Error("miniScorecard not found");

    const batting = pickBatting(mini);
    const inningsObj = (batting.team.innings && batting.team.innings[0]) || {};
    const overStr =
      inningsObj.summary?.over?.replace(/[()]/g, "") ||
      inningsObj.overs_played ||
      "";

    const sb = mini.batsmen?.sb || {};
    const nsb = mini.batsmen?.nsb || {};
    const bow = mini.bowlers?.sb || mini.bowlers?.nsb || {};

    const balls = lastSix(mini);

    res.json({
      title: `${mini.team_a?.name || ""} vs ${mini.team_b?.name || ""}`,
      ground: `${mini.ground_name || ""}, ${mini.city_name || ""}`,
      toss: mini.toss_details || "",
      battingTeam: batting.team?.name || "",
      score: inningsObj.total_run ?? null,
      wickets: inningsObj.total_wicket ?? null,
      overs: overStr || "",
      batsman1: { name: sb.name || "", runs: sb.runs ?? "", balls: sb.balls ?? "" },
      batsman2: { name: nsb.name || "", runs: nsb.runs ?? "", balls: nsb.balls ?? "" },
      bowler: {
        name: bow.name || "",
        overs: bow.overs ?? "",
        runs: bow.runs ?? "",
        wickets: bow.wickets ?? "",
        economy_rate: bow.economy_rate ?? ""
      },
      recentBalls: balls
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Internal error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
