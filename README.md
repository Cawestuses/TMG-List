# Obsidian List

A modern, fast, and highly animated Geometry Dash Demon List clone, inspired by Pointercrate and Demonlist.org, built with Vite, React, Express, TailwindCSS, and Framer Motion.

## 🚀 Features
- **Responsive & Modern UI**: Gaming-themed, dark mode by default with glassmorphism and glowing accents.
- **Top Levels Leaderboard**: Browse the hardest Geometry Dash completions.
- **Animations**: Driven by `framer-motion` for smooth layout transitions and hover effects.
- **Server API**: Express backend handles data fetching efficiently.
- **Google Sheets Integration (Stubbed)**: Ready to connect to live Google Sheets data to act as a free real-time database.

## 🛠️ Tech Stack
- Frontend: React 19, Vite, Tailwind CSS 4, Framer Motion, React Router DOM
- Backend: Express, Node-Cache (for caching Google Sheets responses)
- Deployment: Docker / Cloud Run ready (Start with `npm run start`)

## 📊 Connecting Google Sheets

This project is built to accept data directly from Google Sheets. To connect it, follow these steps:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Enable the **Google Sheets API**.
3. Generate an API Key in Credentials.
4. Copy the key and place it in your environment variables (`.env`):
   ```env
   GOOGLE_SHEETS_API_KEY="your-api-key-here"
   ```
5. Edit `server.ts` to use your spreadsheet ID and uncomment the real fetch logic:
   ```typescript
   // In server.ts, inside app.get("/api/levels")
   const SHEET_ID = "1mFj778dlqzh_J1Qy_WJhdaz2XNvqBzDD"; // Provided ID
   const RANGE = "Sheet1!A2:J"; // Adjust to your sheet's data range
   
   const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${process.env.GOOGLE_SHEETS_API_KEY}`);
   const data = await response.json();
   
   // Map the rows to the Level types
   const parsedLevels = data.values.map(row => ({
       id: row[0],
       rank: Number(row[1]),
       name: row[2],
       difficulty: row[3],
       // ... etc.
   }));
   ```

## 🏗️ Getting Started

```bash
# Install dependencies
npm install

# Start the fullstack development server (Frontend + Backend)
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
