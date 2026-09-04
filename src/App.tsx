import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { SubscriptionHero } from './components/SubscriptionHero';
import { KpiCards } from './components/KpiCards';
import { RoleCards } from './components/RoleCards';
import { QuickActions } from './components/QuickActions';
import { ActivityFeed } from './components/ActivityFeed';
import { LicenseKeysTable } from './components/LicenseKeysTable';
import { UsersTable } from './components/UsersTable';
import { PublicResetPortal } from './components/PublicResetPortal';
import { GenerateKeyModal } from './components/GenerateKeyModal';
import { AddBalanceModal } from './components/AddBalanceModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginModal } from './components/LoginModal';
import type { DashboardStats, LicenseKey, ActivityLog, User, SystemSettings } from './types';

const defaultStats: DashboardStats = {
  total_keys: 5,
  active_keys: 4,
  unused_keys: 1,
  expired_keys: 0,
  paused_keys: 0,
  reset_count: 0,
  admins_count: 0,
  resellers_count: 5,
  total_users_count: 6
};

const DashboardContent: React.FC = () => {
  const { user, token, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [initialKeyFilter, setInitialKeyFilter] = useState('all');

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      // 1. Stats & Activity
      const statsRes = await fetch('/api/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.stats) setStats(data.stats);
        if (data.activity) setActivity(data.activity);
        if (data.settings) setSettings(data.settings);
      }

      // 2. Keys
      const keysRes = await fetch('/api/keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setKeys(keysData);
      }

      // 3. Users (Owner/Admin only)
      if (user?.role === 'owner' || user?.role === 'admin') {
        const usersRes = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 10000);
      return () => clearInterval(interval);
    }
  }, [token, user?.role]);

  const handleClearActivity = async () => {
    if (!window.confirm('Clear all activity logs?')) return;
    try {
      const res = await fetch('/api/stats/activity/clear', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActivity([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleKpiFilterClick = (filter: string) => {
    setInitialKeyFilter(filter);
    setActiveTab('keys');
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading MONTAGE CORPORATION...</span>
        </div>
      </div>
    );
  }

  // Not logged in: show login modal
  if (!user) {
    return <LoginModal isOpen={true} />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex text-slate-800 antialiased font-sans">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGenerate={() => setShowGenerateModal(true)}
        onOpenBalance={() => setShowBalanceModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenBalance={() => setShowBalanceModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        {/* Global Announcement Banner */}
        {settings?.announcement && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white text-xs font-semibold py-2 px-8 flex items-center justify-between border-b border-blue-800/40">
            <div className="flex items-center gap-2 truncate">
              <span className="px-2 py-0.5 rounded-full bg-blue-500 text-[10px] uppercase tracking-wider font-bold">
                NOTICE
              </span>
              <span className="truncate">{settings.announcement}</span>
            </div>
            {settings.maintenance_mode && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/50 text-[10px] font-bold uppercase shrink-0">
                ⚠️ Safe Mode / Maintenance Active
              </span>
            )}
          </div>
        )}

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Row 1: Subscription Validity Hero Card */}
              <SubscriptionHero />

              {/* Row 2: 5 KPI Cards */}
              <KpiCards stats={stats} onFilterClick={handleKpiFilterClick} />

              {/* Row 3: 3 Role Cards */}
              <RoleCards
                stats={stats}
                onNavigateToUsers={() => setActiveTab('users')}
              />

              {/* Row 4: Split Layout (Quick Actions on Left 65%, Activity Feed on Right 35%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 flex flex-col">
                  <QuickActions
                    onOpenGenerate={() => setShowGenerateModal(true)}
                    onNavigateKeys={() => setActiveTab('keys')}
                    onNavigateUsers={() => setActiveTab('users')}
                    onOpenSettings={() => setShowSettingsModal(true)}
                    onOpenBalance={() => setShowBalanceModal(true)}
                  />
                </div>
                <div className="lg:col-span-4 flex flex-col">
                  <ActivityFeed
                    activities={activity}
                    onClear={handleClearActivity}
                    canClear={user?.role === 'owner' || user?.role === 'admin'}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'keys' && (
            <LicenseKeysTable
              keys={keys}
              onRefresh={fetchDashboardData}
              onOpenGenerate={() => setShowGenerateModal(true)}
              initialFilter={initialKeyFilter}
            />
          )}

          {activeTab === 'users' && (
            <UsersTable
              users={users}
              onRefresh={fetchDashboardData}
              onOpenBalance={() => setShowBalanceModal(true)}
            />
          )}

          {activeTab === 'client-reset' && (
            <PublicResetPortal />
          )}
        </main>
      </div>

      {/* Modals */}
      <GenerateKeyModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSuccess={fetchDashboardData}
        settings={settings}
      />

      <AddBalanceModal
        isOpen={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        onSuccess={fetchDashboardData}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;
