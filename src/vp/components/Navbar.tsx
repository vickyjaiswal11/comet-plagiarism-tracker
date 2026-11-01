import React from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Plus, 
  Settings, 
  LogOut,
  Layers
} from 'lucide-react';
import { UserProfile } from '../utils/userProfile';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  activeTab: 'dashboard' | 'scan' | 'report' | 'originals';
  setActiveTab: (tab: 'dashboard' | 'scan' | 'report' | 'originals') => void;
  reportCount: number;
  sourceCount: number;
  hasActiveReport: boolean;
  userProfile: UserProfile | null;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  reportCount,
  sourceCount,
  hasActiveReport,
  userProfile,
  onOpenProfile,
}) => {
  const { user, signOutUser } = useAuth();

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between min-h-16 py-3 gap-3">
          {/* Logo & Title */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">Comet</span>
              <p className="text-[10px] text-slate-400">Plagiarism Checker</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 order-3 w-full sm:order-none sm:w-auto">
            <Button variant={activeTab === 'originals' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('originals')}><Layers />Originals ({sourceCount})</Button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>My Reports</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                {reportCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'scan'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Check Paper</span>
            </button>

            {hasActiveReport && (
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'report'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Active Report</span>
              </button>
            )}
          </nav>

          {/* Right Section: User Profile & Logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-300 transition-all text-xs cursor-pointer group"
              title="Profile & Settings"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                {userProfile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-semibold text-slate-200 group-hover:text-white truncate max-w-[120px]">
                  {userProfile?.name ||  user?.email?.split('@')[0]}
                </div>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 ml-0.5" />
            </button>

            <button
              onClick={() => signOutUser()}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
