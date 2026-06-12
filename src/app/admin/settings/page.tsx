"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Sliders, ToggleLeft, ToggleRight, Loader2, Database } from 'lucide-react';
import { 
  getFeatureToggles, setFeatureToggles,
  getRolePermissions, setRolePermissions,
  seedPermissions,
  type FeatureToggle, type ModulePermission 
} from '../../../lib/api';

const FEATURE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', admissions: 'Admissions', students: 'Students',
  attendance: 'Attendance', timetable: 'Timetable', fees: 'Fees & Finance',
  exams: 'Exams & Results', canteen: 'Canteen', hostel: 'Hostel',
  library: 'Library', placements: 'Placements', hr: 'HR Management',
  gate: 'Smart Gate', gym: 'FitZone Gym', transit: 'Transit',
  events: 'Events', notices: 'Notices', idcards: 'ID Cards',
  ai_concierge: 'AI Concierge', obe: 'OBE Maps', naac: 'NAAC Scorecard',
  faculty_development: 'Faculty Dev', achievements: 'Achievements',
  director: 'Director Console', parent_portal: 'Parent Portal'
};

const FEATURE_ICONS: Record<string, string> = {
  dashboard: '📊', admissions: '🎓', students: '👤', attendance: '✅',
  timetable: '📅', fees: '💰', exams: '📝', canteen: '🍽️',
  hostel: '🏠', library: '📚', placements: '💼', hr: '👥',
  gate: '🚪', gym: '💪', transit: '🚌', events: '🎉',
  notices: '📢', idcards: '🪪', ai_concierge: '🤖', obe: '📋',
  naac: '🏆', faculty_development: '👨‍🏫', achievements: '🏅',
  director: '🎯', parent_portal: '👨‍👩‍👧'
};

type Tab = 'features' | 'permissions';

export default function AdminSettingsPage() {
  const [institutionId, setInstitutionId] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('features');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Feature toggles
  const [features, setFeatures] = useState<FeatureToggle[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);

  // Role permissions
  const [rolePerms, setRolePerms] = useState<ModulePermission[]>([]);
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const [allModules, setAllModules] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [permsLoading, setPermsLoading] = useState(false);

  useEffect(() => {
    const profile = localStorage.getItem('iris_user_profile');
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        setInstitutionId(parsed.institution_id || '');
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (institutionId) loadAll();
  }, [institutionId]);

  const loadAll = async () => {
    if (!institutionId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      await Promise.all([loadFeatures(), loadPermissions()]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeatures = async () => {
    setFeaturesLoading(true);
    try {
      const result = await getFeatureToggles(institutionId);
      if (result.success && result.features) {
        setFeatures(result.features);
        setHasData(true);
      }
    } catch (err) {
      console.error('Failed to load features:', err);
    } finally {
      setFeaturesLoading(false);
    }
  };

  const loadPermissions = async () => {
    setPermsLoading(true);
    try {
      const result = await getRolePermissions(institutionId);
      if (result.success) {
        setRolePerms(result.permissions || []);
        setAllRoles(result.all_roles || []);
        setAllModules(result.all_modules || []);
        if (result.all_roles?.length > 0) setSelectedRole(result.all_roles[0]);
        if ((result.permissions || []).length > 0) setHasData(true);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setPermsLoading(false);
    }
  };

  const handleToggleFeature = (featureKey: string) => {
    setFeatures(prev => prev.map(f =>
      f.feature_key === featureKey ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const handleToggleAllFeatures = (enabled: boolean) => {
    setFeatures(prev => prev.map(f => ({ ...f, enabled })));
  };

  const handleSaveFeatures = async () => {
    if (!institutionId || features.length === 0) return;
    setIsSaving(true);
    try {
      const result = await setFeatureToggles(institutionId, features);
      if (result.success) {
        alert('Module toggles updated successfully.');
      } else {
        alert('Failed to save: ' + (result.error || 'Unknown error'));
      }
    } catch {
      alert('Failed to save module toggles.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermChange = (role: string, module: string, field: 'can_read' | 'can_write' | 'can_delete', value: boolean) => {
    setRolePerms(prev => {
      const existing = prev.find(p => p.role === role && p.module === module);
      if (existing) {
        return prev.map(p => p.role === role && p.module === module ? { ...p, [field]: value } : p);
      }
      return [...prev, {
        role, module,
        can_read: field === 'can_read' ? value : false,
        can_write: field === 'can_write' ? value : false,
        can_delete: field === 'can_delete' ? value : false,
      }];
    });
  };

  const handleSavePermissions = async () => {
    if (!institutionId || rolePerms.length === 0) return;
    setIsSaving(true);
    try {
      const result = await setRolePermissions(institutionId, rolePerms);
      if (result.success) {
        alert('Permissions updated successfully.');
      } else {
        alert('Failed to save: ' + (result.error || 'Unknown error'));
      }
    } catch {
      alert('Failed to save permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeed = async () => {
    if (!institutionId) return;
    setIsSeeding(true);
    try {
      const result = await seedPermissions(institutionId);
      if (result.success) {
        alert('Default permissions seeded! All modules enabled, Admin has full access.');
        await loadAll();
      } else {
        alert('Failed to seed: ' + (result.error || 'Unknown error'));
      }
    } catch {
      alert('Failed to seed permissions.');
    } finally {
      setIsSeeding(false);
    }
  };

  const getPerm = (role: string, module: string): ModulePermission => {
    return rolePerms.find(p => p.role === role && p.module === module) || {
      role, module, can_read: false, can_write: false, can_delete: false
    };
  };

  const enabledCount = features.filter(f => f.enabled).length;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Institution Settings</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light mt-0.5">Enable/disable modules and configure role permissions.</p>
            </div>
          </div>
          <div className="flex gap-3">
            {!hasData && !isLoading && (
              <button onClick={handleSeed} disabled={isSeeding}
                className="px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50">
                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {isSeeding ? 'Seeding...' : 'Initialize Defaults'}
              </button>
            )}
            {activeTab === 'features' && features.length > 0 && (
              <button onClick={handleSaveFeatures} disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50">
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Modules'}
              </button>
            )}
            {activeTab === 'permissions' && rolePerms.length > 0 && (
              <button onClick={handleSavePermissions} disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50">
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Permissions'}
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          {([
            { key: 'features' as const, label: 'Module Toggles', icon: <ToggleRight className="w-4 h-4" /> },
            { key: 'permissions' as const, label: 'Role Permissions', icon: <Sliders className="w-4 h-4" /> },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === tab.key
                  ? 'bg-violet-600/20 border border-violet-500/40 text-violet-400'
                  : 'bg-white/5 border border-white/10 text-[#C4B5FD]/50 hover:text-white hover:bg-white/10'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="py-16 text-center text-[#C4B5FD]/40 italic flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading settings...
          </div>
        )}

        {/* ===================== FEATURE TOGGLES TAB ===================== */}
        {!isLoading && activeTab === 'features' && (
          <>
            {featuresLoading ? (
              <div className="py-16 text-center text-[#C4B5FD]/40 italic">Loading modules...</div>
            ) : features.length > 0 ? (
              <>
                {/* Stats bar */}
                <div className="glass-panel rounded-2xl border border-white/5 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400">
                      <span className="text-white font-bold">{enabledCount}</span> of {features.length} modules enabled
                    </div>
                    <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all"
                        style={{ width: `${(enabledCount / features.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleAllFeatures(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/20 transition-all">
                      Enable All
                    </button>
                    <button onClick={() => handleToggleAllFeatures(false)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-all">
                      Disable All
                    </button>
                  </div>
                </div>

                {/* Feature grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {features.map(f => (
                    <button
                      key={f.feature_key}
                      onClick={() => handleToggleFeature(f.feature_key)}
                      className={`p-4 rounded-2xl border transition-all text-left group ${
                        f.enabled
                          ? 'bg-violet-500/5 border-violet-500/20 hover:border-violet-500/40'
                          : 'bg-white/[0.02] border-white/5 opacity-50 hover:opacity-70 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{FEATURE_ICONS[f.feature_key] || '📦'}</span>
                        {f.enabled ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div className="text-sm font-bold text-white">{FEATURE_LABELS[f.feature_key] || f.feature_key}</div>
                      <div className={`text-[11px] mt-1 font-medium ${f.enabled ? 'text-emerald-400/70' : 'text-gray-500'}`}>
                        {f.enabled ? 'Active' : 'Disabled'}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-[#C4B5FD]/40 italic text-sm">
                No module data found. Click "Initialize Defaults" to set up all modules.
              </div>
            )}
          </>
        )}

        {/* ===================== ROLE PERMISSIONS TAB ===================== */}
        {!isLoading && activeTab === 'permissions' && (
          <>
            {permsLoading ? (
              <div className="py-16 text-center text-[#C4B5FD]/40 italic">Loading permissions...</div>
            ) : rolePerms.length > 0 ? (
              <>
                {/* Role selector */}
                <div className="flex flex-wrap gap-2">
                  {allRoles.filter(r => ['Admin', 'Staff', 'Teacher', 'Student', 'Parent', 'Warden', 'Security', 'Vendor', 'Driver'].includes(r)).map(role => (
                    <button key={role} onClick={() => setSelectedRole(role)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                        selectedRole === role
                          ? 'bg-violet-600/20 border-violet-500/40 text-violet-400'
                          : 'bg-white/5 border-white/10 text-[#C4B5FD]/50 hover:text-white hover:bg-white/10'
                      }`}>
                      {role}
                    </button>
                  ))}
                </div>

                {/* Permission matrix */}
                {selectedRole && (
                  <div className="glass-panel rounded-2xl border border-white/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sliders className="w-4 h-4 text-violet-400" />
                      <h2 className="text-sm font-bold">{selectedRole} Permissions</h2>
                    </div>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[#C4B5FD] uppercase tracking-wider text-[10px] font-semibold">
                            <th className="py-3 px-4">Module</th>
                            <th className="py-3 px-4 text-center">Read</th>
                            <th className="py-3 px-4 text-center">Write</th>
                            <th className="py-3 px-4 text-center">Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allModules.map(mod => {
                            const perm = getPerm(selectedRole, mod);
                            return (
                              <tr key={mod} className="border-b border-white/5 hover:bg-white/5 transition-all">
                                <td className="py-3 px-4 font-semibold text-white">{FEATURE_LABELS[mod] || mod}</td>
                                {(['can_read', 'can_write', 'can_delete'] as const).map(field => (
                                  <td key={field} className="py-3 px-4 text-center">
                                    <button onClick={() => handlePermChange(selectedRole, mod, field, !perm[field])}
                                      className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                        perm[field]
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-white/5 text-[#C4B5FD]/20 border border-white/10 hover:bg-white/10'
                                      }`}>
                                      {perm[field] ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-2 h-2 rounded-full bg-current" />}
                                    </button>
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center text-[#C4B5FD]/40 italic text-sm">
                No permissions configured. Click "Initialize Defaults" to set up role permissions.
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
