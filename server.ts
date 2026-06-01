import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import NodeCache from "node-cache";
import { parse } from 'csv-parse/sync';
import { initializeApp, deleteApp } from "firebase/app";
import { initializeFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const app = express();
const PORT = 3000;

// Simple cache to avoid hitting Google Sheets API too often
const sheetCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Route to migrate old database data to new database
app.get("/api/migrate", async (req, res) => {
  const oldConfig = {
    apiKey: "AIzaSyAh9oD9otcM2oBaoqHDd88aPMUElaOO0Z4",
    authDomain: "excellent-shape-307pf.firebaseapp.com",
    projectId: "excellent-shape-307pf",
    storageBucket: "excellent-shape-307pf.firebasestorage.app",
    messagingSenderId: "576850039935",
    appId: "1:576850039935:web:8cda9d5dd42f11a1935b4a",
  };

  const newConfig = {
    apiKey: "AIzaSyCm61Wj9DOhsEN5GfIoQiOTA5LGiThpeyg",
    authDomain: "tmg-list.firebaseapp.com",
    projectId: "tmg-list",
    storageBucket: "tmg-list.firebasestorage.app",
    messagingSenderId: "104757774501",
    appId: "1:104757774501:web:2e7882de0230b4342c254c"
  };

  try {
    console.log("Starting DB migration...");
    
    // Initialize temporary App instances
    const sourceApp = initializeApp(oldConfig, `source-migration-${Date.now()}`);
    const destApp = initializeApp(newConfig, `dest-migration-${Date.now()}`);

    const sourceDb = initializeFirestore(sourceApp, {
      experimentalAutoDetectLongPolling: true,
    }, "ai-studio-3030118e-7588-4ad8-be33-4d5cbe9e56ea");

    const destDb = initializeFirestore(destApp, {
      experimentalAutoDetectLongPolling: true,
    }, "(default)");

    const collections = [
      "levels",
      "future_levels",
      "verifiers",
      "record_submissions",
      "app_users",
      "user_profiles",
      "admins"
    ];

    const logs: string[] = [];

    for (const collName of collections) {
      logs.push(`Migrating collection: ${collName}`);
      console.log(`Migrating collection: ${collName}`);

      try {
        const snap = await getDocs(collection(sourceDb, collName));
        logs.push(`Found ${snap.docs.length} documents in ${collName}`);
        console.log(`Found ${snap.docs.length} documents in ${collName}`);

        let count = 0;
        for (const d of snap.docs) {
          try {
            await setDoc(doc(destDb, collName, d.id), d.data());
            count++;
          } catch (e: any) {
            logs.push(`Failed to write doc ${d.id}: ${e.message}`);
          }
        }
        logs.push(`Successfully migrated ${count}/${snap.docs.length} documents for ${collName}`);
        console.log(`Successfully migrated ${count}/${snap.docs.length} documents for ${collName}`);
      } catch (err: any) {
        logs.push(`Failed to migrate collection ${collName}: ${err.message}`);
        console.error(`Failed to migrate collection ${collName}`, err);
      }
    }

    // Clean up connections
    await deleteApp(sourceApp);
    await deleteApp(destApp);

    res.json({
      status: "success",
      message: "Data migrated successfully!",
      logs
    });
  } catch (error: any) {
    console.error("Migration failed:", error);
    res.status(500).json({
      status: "error",
      message: error.message || String(error),
      stack: error.stack
    });
  }
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
