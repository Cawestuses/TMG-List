import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "primary" | "secondary" | "accent" | "red" | "green";
  delay?: number;
}

const colorMap = {
  primary: "from-[#ec4899]/20 via-[#a855f7]/20 to-[#06b6d4]/20 border-[#a855f7]/30",
  secondary: "from-[#06b6d4]/20 to-transparent border-[#06b6d4]/30",
  accent: "from-[#a855f7]/20 to-transparent border-[#a855f7]/30",
  red: "from-red-500/20 to-transparent border-red-500/30",
  green: "from-emerald-500/20 to-transparent border-emerald-500/30",
};

export function GlowCard({ children, className, glowColor = "primary", delay = 0 }: GlowCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "relative rounded-xl overflow-hidden group glass-card",
        "border", // Border color is handled conditionally below
        className
      )}
    >
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-100 transition-opacity duration-500",
          colorMap[glowColor].split("border")[0] // Extract gradient specific part roughly
        )} 
        style={{ zIndex: 0 }}
      />
      <div className={cn("absolute inset-0 border rounded-xl pointer-events-none transition-colors duration-300", colorMap[glowColor].split(" ")[2] || "border-white/10")} style={{ zIndex: 0 }}/>
      
      {/* Content wrapper */}
      <div className="relative z-10 p-6 h-full">
        {children}
      </div>
    </motion.div>
  );
}
