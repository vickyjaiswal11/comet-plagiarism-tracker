import React, { useState } from 'react';
import { 
  X, 
  User, 
  Building2, 
  Wallet, 
  Sparkles, 
  Sliders, 
  Check, 
  ShieldCheck, 
  Mail, 
  GraduationCap,
  RotateCcw
} from 'lucide-react';
import { UserProfile, DEFAULT_USER_PROFILE } from '../utils/userProfile';

interface ProfileModalProps {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_USER_PROFILE });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Auditor & Academic Profile Setup
              </h2>
              <p className="text-xs text-slate-400">
                Institutional credentials, blockchain wallet, and similarity thresholds.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close profile modal"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Identity & Contact */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Auditor Credentials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name & Title</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Dr. Alexis Vance"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Institutional Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. alexis@university.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Institution / University</label>
                <input
                  type="text"
                  required
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Stanford University"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Department / Faculty</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Computer Science"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Academic Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Senior Academic Auditor & Thesis Supervisor">
                  Senior Academic Auditor & Thesis Supervisor
                </option>
                <option value="Department Chair / Faculty Dean">
                  Department Chair / Faculty Dean
                </option>
                <option value="Peer Reviewer & Journal Editor">
                  Peer Reviewer & Journal Editor
                </option>
                <option value="Graduate Teaching Assistant / Evaluator">
                  Graduate Teaching Assistant / Evaluator
                </option>
                <option value="Undergraduate / Postgraduate Researcher">
                  Undergraduate / Postgraduate Researcher
                </option>
              </select>
            </div>
          </div>

          {/* Blockchain Wallet Setup */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ethereum Auditor Wallet (Solidity Attestation Signer)</span>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Auditor Public Address</label>
              <input
                type="text"
                required
                value={formData.walletAddress}
                onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="0x..."
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Used to sign cryptographic proof-of-originality certificates on-chain.
              </p>
            </div>
          </div>

          {/* Similarity Tolerance & AI Thresholds */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Audit Sensitivity & Plagiarism Threshold</span>
              </div>
              <span className="font-bold text-amber-400 text-sm">{formData.similarityThreshold}%</span>
            </div>

            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={formData.similarityThreshold}
              onChange={(e) => setFormData({ ...formData, similarityThreshold: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Strict (5%)</span>
              <span>Standard Academic (20%)</span>
              <span>Lenient (50%)</span>
            </div>
          </div>

          {/* AI Features Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Capabilities</span>
            </div>

            <label className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
              <div className="space-y-0.5 pr-4">
                <div className="font-semibold text-slate-200">Auto-Run AI Deep Audit</div>
                <div className="text-[11px] text-slate-400">
                  Analyze syntactic burstiness, stylistic consistency, and semantic paraphrasing.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.aiAnalysisEnabled}
                onChange={(e) => setFormData({ ...formData, aiAnalysisEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
              <div className="space-y-0.5 pr-4">
                <div className="font-semibold text-slate-200">Estimate AI-Generated Text Likelihood</div>
                <div className="text-[11px] text-slate-400">
                  Calculates AI vs Human generation probability alongside lexical similarity.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.detectAiGeneratedContent}
                onChange={(e) => setFormData({ ...formData, detectAiGeneratedContent: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
              />
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition-colors"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
