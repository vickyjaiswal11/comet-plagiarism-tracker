export interface UserProfile {
  name: string;
  email: string;
  institution: string;
  department: string;
  role: string;
  walletAddress: string;
  similarityThreshold: number; // e.g. 25
  aiAnalysisEnabled: boolean;
  detectAiGeneratedContent: boolean;
  autoAttestBlockchain: boolean;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Dr. Alexis Vance',
  email: 'alexis.vance@stanford.edu',
  institution: 'Stanford University / Academic Integrity Board',
  department: 'Computer Science & AI',
  role: 'Senior Academic Auditor & Thesis Supervisor',
  walletAddress: '0x9464E683A3C089531548810261A721Ac3065b210',
  similarityThreshold: 20,
  aiAnalysisEnabled: true,
  detectAiGeneratedContent: true,
  autoAttestBlockchain: true,
};

const STORAGE_KEY = 'veriplag_user_profile_v1';

export function getStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PROFILE;
    return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}
