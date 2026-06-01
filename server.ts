import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import NodeCache from "node-cache";
import { parse } from 'csv-parse/sync';

const app = express();
const PORT = 3000;

// Simple cache to avoid hitting Google Sheets API too often
const sheetCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Route to fetch levels
app.get("/api/levels", async (req, res) => {
  const cacheKey = "levelsList";
  const cachedData = sheetCache.get(cacheKey);
  
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const response = await fetch(`https://docs.google.com/spreadsheets/d/1mFj778dlqzh_J1Qy_WJhdaz2XNvqBzDD/export?format=csv&gid=1933116060`);
    const text = await response.text();
    const records = parse(text, {
        columns: true,
        skip_empty_lines: true
    });
    
    const parsedLevels = records.map((record: any, index: number) => {
        const rankStr = record[" Number Of List"] || record["Number Of List"];
        const parsedRank = parseInt(rankStr);
        const pointsStr = record["Point "] || "0";
        const pointsMatch = pointsStr.match(/(\d+(\.\d+)?)/);
        const points = pointsMatch ? parseFloat(pointsMatch[1]) : 0;
        
        let victorsCount = 0;
        const victorsStr = record["Victory(only Extreme)"];
        if (victorsStr && victorsStr.toLowerCase() !== 'никто') {
            victorsCount = victorsStr.split(',').length; // very rough estimate
        }

        const isUnaccounted = record["Неучитываемые"] && record["Неучитываемые"].trim() !== "";

        return {
            id: `lvl-${rankStr || index}`,
            rank: isNaN(parsedRank) ? (index + 1) : parsedRank,
            name: record["Name"] || "Unknown",
            difficulty: record["Сложность"] || "Extreme Demon",
            points: points,
            creator: record["Creator"] || "Unknown",
            verifier: record["Verifer(top 20)"] || "Unknown",
            victors: victorsCount,
            video: "#",
            isActive: !isUnaccounted
        };
    }).filter((l: any) => l.name !== "Unknown" && l.name !== "");
    
    sheetCache.set(cacheKey, parsedLevels);
    res.json(parsedLevels);
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "Failed to fetch levels data" });
  }
});

// Route to fetch players
app.get("/api/players", async (req, res) => {
  const cacheKey = "playersList";
  const cachedData = sheetCache.get(cacheKey);
  
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    const usernames = ["Zoink", "Trick", "Doggie", "SpaceUK", "Sunix", "Riot", "Dolphy", "Technical", "npesta", "Cursed"];
    const countries = ["US", "GB", "RU", "PL", "MX", "DE", "FR", "CA"];
    
    const players = [];
    for (let i = 0; i < usernames.length; i++) {
      players.push({
        id: `player-${i + 1}`,
        rank: i + 1,
        username: usernames[i],
        points: Math.round(15000 * Math.pow(0.85, i)),
        completedLevels: Math.floor(Math.random() * 50) + 20,
        hardestDemon: i < 3 ? "Tidal Wave" : "Acheron",
        country: countries[Math.floor(Math.random() * countries.length)],
      });
    }
    for (let i = usernames.length; i < 50; i++) {
      players.push({
        id: `player-${i + 1}`,
        rank: i + 1,
        username: `Dasher${i + 1}`,
        points: Math.round(3000 * Math.pow(0.95, i - usernames.length)),
        completedLevels: Math.floor(Math.random() * 20) + 5,
        hardestDemon: "Slaughterhouse",
        country: countries[Math.floor(Math.random() * countries.length)],
      });
    }

    sheetCache.set(cacheKey, players);
    res.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ error: "Failed to fetch players data" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 4 compatibility
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
