import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, deleteApp } from "firebase/app";
import { initializeFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";
import morgan from "morgan";
import fs from "fs";

const app = express();
app.set('trust proxy', 1 /* number of proxies between user and server */);
const PORT = 3000;

app.use(morgan("dev"));
app.use(express.static(path.join(process.cwd(), 'public')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: { error: "Too many requests from this IP, please try again later." },
  validate: { xForwardedForHeader: false, default: true }
});

app.use("/api", limiter);

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

const firebaseConfig = {
  apiKey: "AIzaSyCm61Wj9DOhsEN5GfIoQiOTA5LGiThpeyg",
  authDomain: "tmg-list.firebaseapp.com",
  projectId: "tmg-list",
  storageBucket: "tmg-list.firebasestorage.app",
  messagingSenderId: "104757774501",
  appId: "1:104757774501:web:2e7882de0230b4342c254c"
};

const firebaseApp = initializeApp(firebaseConfig, "server-app");
const db = initializeFirestore(firebaseApp, {
  experimentalAutoDetectLongPolling: true,
}, "(default)");

// API Routes
app.get("/api/health", (req, res) => {
  try {
    res.json({ status: "ok" });
  } catch (error: any) {
    console.error("Health check error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/levels", async (req, res) => {
  try {
    const cachedLevels = cache.get("levels");
    if (cachedLevels) {
      return res.json(cachedLevels);
    }
    
    const snap = await getDocs(collection(db, "levels"));
    const levels = snap.docs.map(d => d.data());
    levels.sort((a, b) => a.rank - b.rank);
    
    cache.set("levels", levels);
    res.json(levels);
  } catch (error: any) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/changelog", async (req, res) => {
  try {
    const cachedLogs = cache.get("changelog");
    if (cachedLogs) {
      return res.json(cachedLogs);
    }
    
    const snap = await getDocs(collection(db, "changelog"));
    const logs = snap.docs.map(d => ({id: d.id, ...d.data()}));
    logs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    cache.set("changelog", logs);
    res.json(logs);
  } catch (error: any) {
    console.error("Error fetching changelog:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use(express.json());

// Administrative secret verification middleware
const checkAdminSecret = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const secret = req.headers["x-admin-secret"] || req.query.secret;
  const expectedSecret = process.env.ADMIN_API_SECRET;
  
  if (!expectedSecret || secret !== expectedSecret) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing admin secret" });
  }
  next();
};

app.post("/api/submit-record", async (req, res) => {
  const { username, levelName, progress, videoProof, userEmail, userId } = req.body;

  const videoRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be|twitch\.tv)\/.+$/;
  if (!videoRegex.test(videoProof)) {
    return res.status(400).json({ error: "Invalid video URL" });
  }

  try {
    const docRef = doc(collection(db, "record_submissions"));
    await setDoc(docRef, {
      username,
      levelName,
      progress: Number(progress),
      videoProof,
      status: "pending",
      userEmail,
      userId,
      createdAt: new Date().toISOString()
    });
    res.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("Submit record error:", error);
    res.status(500).json({ error: "Failed to submit record" });
  }
});

app.post("/api/clear-cache", checkAdminSecret, (req, res) => {
  cache.flushAll();
  res.json({ status: "Cache cleared" });
});

// Route to migrate old database data to new database
app.get("/api/migrate", checkAdminSecret, async (req, res) => {
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
      error: error.message || String(error),
      stack: error.stack
    });
  }
});

async function generateOpenGraphHtml(html: string, url: string) {
  // Simple check for bot User-Agents
  // if (!isBot) return html; // We can return normal html for browsers, but actually injecting OG tags for everyone is fine.
  
  if (url.startsWith('/level/')) {
    const levelId = url.split('/')[2];
    try {
      const cachedLevels = cache.get("levels") as any[];
      let level = cachedLevels?.find(l => l.id === levelId);
      
      if (!level) {
        const snap = await getDocs(collection(db, "levels"));
        const levels = snap.docs.map(d => d.data());
        cache.set("levels", levels);
        level = levels.find(l => l.id === levelId);
      }
      
      if (level) {
        const ogTags = `
          <title>${level.name} - Demon List</title>
          <meta property="og:title" content="${level.name} - Demon List" />
          <meta property="og:description" content="Difficulty: ${level.difficulty} | Creator: ${level.creator} | Verifier: ${level.verifier} | Rank: #${level.rank}" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="${level.name} - Demon List" />
          <meta name="twitter:description" content="Difficulty: ${level.difficulty} | Creator: ${level.creator} | Rank: #${level.rank}" />
        `;
        return html.replace('</head>', `${ogTags}</head>`);
      }
    } catch(e) {
      console.error("SEO Error:", e);
    }
  }
  return html;
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Use custom so we can intercept HTML
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const html = await generateOpenGraphHtml(template, req.originalUrl);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });

  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false })); // don't serve index.html automatically
    app.get('*', async (req, res) => {
      try {
        let template = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
        const html = await generateOpenGraphHtml(template, req.originalUrl);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        res.status(500).end(e);
      }
    });
  }

  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
