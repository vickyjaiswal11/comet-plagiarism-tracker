import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Scanner } from './components/Scanner';
import { ReportDetail } from './components/ReportDetail';
import { CertificateModal } from './components/CertificateModal';
import { ProfileModal } from './components/ProfileModal';
import { OriginalLibrary } from './components/OriginalLibrary';
import { OriginalSource, removeDocument } from './utils/documents';
import { PlagiarismReport } from './utils/plagiarism';
import { UserProfile } from './utils/userProfile';
import { ShieldCheck, Loader2 } from 'lucide-react';

function getLocalData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalData<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

function AppContent() {
  const { user, userProfile, loading, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'report' | 'originals'>('dashboard');
  const [sources, setSources] = useState<OriginalSource[]>([]);
  const [sourceLoading, setSourceLoading] = useState(true);
  const [appError, setAppError] = useState('');
  const [reports, setReports] = useState<PlagiarismReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<PlagiarismReport | null>(null);
  const [certificateReport, setCertificateReport] = useState<PlagiarismReport | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const localSourcesKey = user ? `vp_sources_${user.id}` : 'vp_sources_guest';
  const localReportsKey = user ? `vp_reports_${user.id}` : 'vp_reports_guest';

  // Load this user's reports & original sources
  useEffect(() => {
    if (!user) {
      setReports([]);
      setSources([]);
      setSelectedReport(null);
      return;
    }
    let cancelled = false;
    setSourceLoading(true);

    // 1. Fetch original sources (cloud with local fallback)
    supabase
      .from('original_sources')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          const cached = getLocalData<OriginalSource[]>(localSourcesKey, []);
          setSources(cached);
        } else {
          setSources(data);
          setLocalData(localSourcesKey, data);
        }
        setSourceLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSources(getLocalData<OriginalSource[]>(localSourcesKey, []));
        setSourceLoading(false);
      });

    // 2. Fetch reports (cloud with local fallback)
    supabase
      .from('reports')
      .select('data')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          const cached = getLocalData<PlagiarismReport[]>(localReportsKey, []);
          setReports(cached);
          if (cached.length > 0) setSelectedReport((cur) => cur ?? cached[0] ?? null);
        } else {
          const loaded = data.map((r) => r.data as unknown as PlagiarismReport);
          setReports(loaded);
          setLocalData(localReportsKey, loaded);
          if (loaded.length > 0) setSelectedReport((cur) => cur ?? loaded[0] ?? null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        const cached = getLocalData<PlagiarismReport[]>(localReportsKey, []);
        setReports(cached);
        if (cached.length > 0) setSelectedReport((cur) => cur ?? cached[0] ?? null);
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // If not logged in, show AuthScreen (Login / Sign Up)
  if (!user) {
    return <AuthScreen />;
  }

  const handleSelectReport = (report: PlagiarismReport) => {
    setSelectedReport(report);
    setActiveTab('report');
  };

  const handleScanComplete = async (newReport: PlagiarismReport) => {
    const reportWithUser = { ...newReport, userId: user.id };

    try {
      await supabase.from('reports').insert({
        id: newReport.id,
        user_id: user.id,
        submitted_at: newReport.submittedAt,
        data: reportWithUser as any,
      });
    } catch {
      // cloud insert skipped / local fallback
    }

    const updated = [reportWithUser, ...reports.filter((r) => r.id !== newReport.id)];
    setReports(updated);
    setLocalData(localReportsKey, updated);
    setSelectedReport(reportWithUser);
    setActiveTab('report');
  };

  const handleOpenCertificate = (report: PlagiarismReport) => {
    setCertificateReport(report);
  };

  const handleSaveProfile = async (updated: UserProfile) => {
    await updateUserProfile(updated);
  };

  const handleAddOriginal = async (source: Omit<OriginalSource, 'id' | 'created_at'>) => {
    if (!source.content.trim()) throw new Error('Original text cannot be empty.');

    let newEntry: OriginalSource;
    try {
      const { data, error } = await supabase
        .from('original_sources')
        .insert({
          title: source.title,
          author: source.author,
          content: source.content,
          file_name: source.file_name,
          file_type: source.file_type,
          user_id: user.id,
        })
        .select('*')
        .single();

      if (error || !data) throw error;
      newEntry = data;
    } catch {
      // Create local fallback original source
      newEntry = {
        ...source,
        id: `src-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        created_at: new Date().toISOString(),
      };
    }

    const updated = [newEntry, ...sources];
    setSources(updated);
    setLocalData(localSourcesKey, updated);
  };

  const handleDeleteOriginal = async (source: OriginalSource) => {
    if (!window.confirm(`Delete original "${source.title}"? Future scans will no longer check it. Saved reports keep their historical results.`)) return;

    try {
      await supabase.from('original_sources').delete().eq('id', source.id).eq('user_id', user.id);
    } catch {
      // ignore
    }

    const updated = removeDocument(sources, source.id);
    setSources(updated);
    setLocalData(localSourcesKey, updated);
  };

  const handleDeleteReport = async (report: PlagiarismReport) => {
    if (!window.confirm(`Delete "${report.title}" and its report? This cannot be undone.`)) return;
    setAppError('');

    try {
      await supabase.from('reports').delete().eq('id', report.id).eq('user_id', user.id);
    } catch {
      // ignore
    }

    const updated = removeDocument(reports, report.id);
    setReports(updated);
    setLocalData(localReportsKey, updated);

    if (selectedReport?.id === report.id) {
      setSelectedReport(null);
      setActiveTab('dashboard');
    }
    if (certificateReport?.id === report.id) {
      setCertificateReport(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reportCount={reports.length}
        sourceCount={sources.length}
        hasActiveReport={!!selectedReport}
        userProfile={userProfile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {appError && <p role="alert" className="text-destructive mb-4">{appError}</p>}
        {activeTab === 'originals' && (
          sourceLoading ? (
            <Loader2 className="animate-spin mx-auto text-indigo-500" />
          ) : (
            <OriginalLibrary
              sources={sources}
              onAdd={handleAddOriginal}
              onDelete={handleDeleteOriginal}
            />
          )
        )}
        {activeTab === 'dashboard' && (
          <Dashboard
            reports={reports}
            onSelectReport={handleSelectReport}
            onOpenScan={() => setActiveTab('scan')}
            onOpenCertificate={handleOpenCertificate}
            onDeleteReport={handleDeleteReport}
          />
        )}

        {activeTab === 'scan' && (
          <Scanner
            userProfile={userProfile ?? null}
            sources={sourceLoading ? [] : sources}
            onOpenSources={() => setActiveTab('originals')}
            onScanComplete={handleScanComplete}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'report' && selectedReport && (
          <ReportDetail
            key={selectedReport.id}
            report={selectedReport}
            onBack={() => setActiveTab('dashboard')}
            onOpenCertificate={handleOpenCertificate}
            onDeleteReport={handleDeleteReport}
          />
        )}
      </main>

      {/* Certificate Modal */}
      {certificateReport && (
        <CertificateModal
          report={certificateReport}
          onClose={() => setCertificateReport(null)}
        />
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && userProfile && (
        <ProfileModal
          profile={userProfile}
          onSave={handleSaveProfile}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {/* Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">Comet</span>
            <span>•</span>
            <span>Signed in as <strong className="text-slate-300">{userProfile?.name || user.email}</strong></span>
          </div>
          <span className="text-slate-500 text-[11px]">Academic plagiarism detection &amp; blockchain ledger.</span>
        </div>
      </footer>
    </div>
  );
}

export function VeriPlagApp() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
