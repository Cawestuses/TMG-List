/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import Home from "./pages/Home";
import TopLevels from "./pages/TopLevels";
import FutureLevels from "./pages/FutureLevels";
import LevelDetails from "./pages/LevelDetails";
import Players from "./pages/Players";
import PlayerDetails from "./pages/PlayerDetails";
import SubmitRecord from "./pages/SubmitRecord";
import Statistics from "./pages/Statistics";
import FAQ from "./pages/FAQ";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-500/30">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
        </div>
        
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/top" element={<TopLevels />} />
            <Route path="/future" element={<FutureLevels />} />
            <Route path="/level/:id" element={<LevelDetails />} />
            <Route path="/players" element={<Players />} />
            <Route path="/player/:id" element={<PlayerDetails />} />
            <Route path="/stats" element={<Statistics />} />
            <Route path="/submit" element={<SubmitRecord />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<AuthPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
