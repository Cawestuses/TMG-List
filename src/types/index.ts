export interface Level {
  id: string;
  rank: number;
  name: string;
  difficulty: string;
  points: number;
  creator: string;
  verifier: string;
  victors: number;
  video: string;
  isActive: boolean;
  thumbnail?: string; // Optioanl thumbnail from youtube
  geometryDashId: string; // Real GD ID of the level
}

export interface FutureLevel {
  id: string;
  name: string;
  creator: string;
  video: string;
  status: string; // e.g. "Verifying", "Building", "Layout"
  thumbnail?: string;
}

export interface BeautyLevel {
  id: string;
  rank: number;
  name: string;
  creator: string;
  video: string;
  thumbnail?: string;
  geometryDashId: string;
}

export interface Verifier {
  id: string;
  name: string;
}

export interface RecordSubmission {
  id: string;
  username: string;
  levelName: string;
  progress: number;
  videoProof: string;
  status: string;
  createdAt: string;
}

export interface Player {
  id: string;
  rank: number;
  username: string;
  points: number;
  completedLevels: number;
  createdLevels: number;
  verifiedLevels: number;
  hardestDemon: string;
  hardestDemonId?: string;
  country: string;
  roles: string[];
  discord?: string;
  gdUsername?: string;
  description?: string;
  hardestProgressStr?: string;
  hardestProgressId?: string;
  hardestProgressPercent?: number;
  completedLevelsList: { name: string; progress: number, url: string, id: string }[];
  progressLevelsList: { name: string; progress: number, url: string, id: string }[];
  createdLevelsList: { name: string, id: string }[];
}

export interface UserProfile {
  id: string;
  discord?: string;
  gdUsername?: string;
  description?: string;
  country?: string;
  role?: "user" | "moderator" | "elder_moder" | "admin";
}

export interface ChangelogItem {
  id: string;
  date: string;
  content: string;
  levelId?: string;
}

