/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Booth, FestivalSettings, Participant, ActivityLog } from './types';
import { store } from './services/store';
import { Header } from './components/Header';
import { VisitorHome } from './components/VisitorHome';
import { QRScannerModal } from './components/QRScannerModal';
import { CompleteVoucher } from './components/CompleteVoucher';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { StaffSnackScannerModal } from './components/StaffSnackScannerModal';
import { TestHelperModal } from './components/TestHelperModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'complete' | 'admin'>('home');
  const [booths, setBooths] = useState<Booth[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [settings, setSettings] = useState<FestivalSettings>(store.getSettings());
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [myParticipant, setMyParticipant] = useState<Participant | null>(null);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [isStaffScannerOpen, setIsStaffScannerOpen] = useState(false);
  const [isTestHelperOpen, setIsTestHelperOpen] = useState(false);

  // Check URL routes for /admin or #admin
  useEffect(() => {
    const unsubBooths = store.subscribeBooths((b) => setBooths(b));
    const unsubParticipants = store.subscribeParticipants((p) => {
      setParticipants(p);
      setMyParticipant(store.getLocalParticipant());
    });
    const unsubSettings = store.subscribeSettings((s) => setSettings(s));
    const unsubLogs = store.subscribeLogs((l) => setLogs(l));

    const checkRoute = () => {
      if (typeof window === 'undefined') return;
      const isAuth = sessionStorage.getItem('kfc_admin_auth') === 'true';
      setIsAdminAuth(isAuth);

      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path.endsWith('/admin') || hash === '#admin') {
        if (isAuth) {
          setCurrentView('admin');
        } else {
          setCurrentView('home');
          setIsAdminLoginOpen(true);
        }
      } else if (path.endsWith('/complete') || hash === '#complete') {
        setCurrentView('complete');
      }
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);

    return () => {
      unsubBooths();
      unsubParticipants();
      unsubSettings();
      unsubLogs();
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  // Update current participant whenever participants or storage changes
  useEffect(() => {
    const current = store.getLocalParticipant();
    setMyParticipant(current);

    if (currentView === 'complete' && (!current || !current.isCompleted)) {
      setCurrentView('home');
    }
  }, [participants, currentView]);

  // Navigate to admin
  const handleOpenAdmin = () => {
    if (isAdminAuth) {
      setCurrentView('admin');
      window.location.hash = '#admin';
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuth(true);
    setIsAdminLoginOpen(false);
    window.location.hash = '#admin';
    setCurrentView('admin');
  };

  const handleBackToVisitor = () => {
    setCurrentView('home');
    if (window.location.pathname.endsWith('/admin')) {
      window.history.pushState(null, '', '/');
    } else {
      window.location.hash = '';
    }
  };

  // QR Processing
  const handleScanResult = (rawCode: string) => {
    const result = store.processBoothScan(rawCode);
    setMyParticipant(store.getLocalParticipant());
    return result;
  };

  const handleQuickSimulateScan = (booth: Booth) => {
    const code = store.generateBoothCode
      ? store.generateBoothCode(booth)
      : `BOOTH:${booth.id}:${booth.qrSecret}`;
    const result = store.processBoothScan(code);
    setMyParticipant(store.getLocalParticipant());

    if (result.success) {
      alert(`[${booth.name}] 스탬프가 성공적으로 적립되었습니다!`);
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/60 font-sans text-neutral-900 flex flex-col">
      {/* Top Header */}
      {currentView !== 'admin' && (
        <Header
          settings={settings}
          participant={myParticipant}
          isAdmin={isAdminAuth}
          onOpenAdmin={handleOpenAdmin}
          onOpenQuickTest={() => setIsTestHelperOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
        />
      )}

      {/* Main Views */}
      <main className="flex-1">
        {currentView === 'home' && (
          <VisitorHome
            booths={booths}
            participant={myParticipant}
            settings={settings}
            onOpenScanner={() => setIsScannerOpen(true)}
            onSelectBoothToScan={() => setIsScannerOpen(true)}
            onNavigateToComplete={() => {
              setCurrentView('complete');
              window.location.hash = '#complete';
            }}
            onQuickSimulateScan={handleQuickSimulateScan}
          />
        )}

        {currentView === 'complete' && myParticipant && (
          <CompleteVoucher
            participant={myParticipant}
            settings={settings}
            onBackToStampBook={() => {
              setCurrentView('home');
              window.location.hash = '';
            }}
            onStaffClaimSnack={(pId) => store.claimSnack(pId)}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            booths={booths}
            participants={participants}
            settings={settings}
            logs={logs}
            onBackToVisitorView={handleBackToVisitor}
            onAddBooth={(b) => store.addBooth(b)}
            onUpdateBooth={(id, u) => store.updateBooth(id, u)}
            onDeleteBooth={(id) => store.deleteBooth(id)}
            onToggleBoothActive={(id) => store.toggleBoothActive(id)}
            onUpdateSettings={(s) => store.updateSettings(s)}
            onClaimSnack={(pId) => store.claimSnack(pId)}
            onResetAllData={() => store.resetAllParticipantsAndStats()}
            onRestoreDefaultBooths={() => store.restoreDefaultBooths()}
            onOpenStaffSnackScanner={() => setIsStaffScannerOpen(true)}
          />
        )}
      </main>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
        availableBooths={booths.filter((b) => b.isActive)}
        onNavigateToComplete={() => {
          setCurrentView('complete');
          window.location.hash = '#complete';
        }}
      />

      {/* Admin ID / PW Login Modal (ID: 수련관, PW: 9826) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => {
          setIsAdminLoginOpen(false);
          if (window.location.pathname.endsWith('/admin')) {
            window.history.pushState(null, '', '/');
          }
        }}
        correctPassword={settings.adminPassword}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Staff Snack QR Scanner Modal */}
      <StaffSnackScannerModal
        isOpen={isStaffScannerOpen}
        onClose={() => setIsStaffScannerOpen(false)}
        onClaimSuccess={() => {
          setParticipants(store.getParticipants());
        }}
      />

      {/* Test / Dev Helper QR Modal */}
      <TestHelperModal
        isOpen={isTestHelperOpen}
        onClose={() => setIsTestHelperOpen(false)}
        booths={booths}
        participant={myParticipant}
        onSimulateScan={(code) => handleScanResult(code)}
        onResetMyParticipant={() => store.resetMyParticipant()}
      />
    </div>
  );
}
