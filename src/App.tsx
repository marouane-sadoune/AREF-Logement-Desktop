/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DesktopWindowChrome } from './components/DesktopWindowChrome';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DossierList } from './components/DossierList';
import { DossierForm } from './components/DossierForm';
import { DocumentGenerator } from './components/DocumentGenerator';
import { AuditWorkflowModal } from './components/AuditWorkflowModal';
import { RegulationsGuide } from './components/RegulationsGuide';
import { DatabaseBackup } from './components/DatabaseBackup';
import { DossierDetailModal } from './components/DossierDetailModal';
import { UserManagementView } from './components/UserManagementView';
import { AuthLogView } from './components/AuthLogView';
import { SignInView } from './components/SignInView';
import { ArchiveView } from './components/ArchiveView';
import { CompareView } from './components/CompareView';
import { EvictionView } from './components/EvictionView';
import { RegistreLogementsView } from './components/RegistreLogementsView';
import { isArchivable } from './utils/archive';
import { HousingDossier, DossierStatus } from './types/housing';
import { INITIAL_DOSSIERS } from './data/mockDossiers';
import { AuthProvider, useAuth } from './context/AuthContext';
import * as api from './api/client';
import { StatusTimeline } from './components/StatusTimeline';
import Swal from 'sweetalert2';

const normalizeDirectorate = (name: string) => name
  .normalize('NFKC')
  .replace(/^المديرية الإقليمية ب/u, '')
  .replace(/\s*\([^)]*\)\s*/gu, ' ')
  .replace(/\s+/gu, ' ')
  .trim();

function HousingWorkspace() {
  const { currentUser, permissions } = useAuth();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dossiers');

  // Dossiers are loaded from the Laravel API; the backend is the source of truth.
  const [dossiers, setDossiers] = useState<HousingDossier[]>([]);
  const [isLoadingDossiers, setIsLoadingDossiers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Archived dossier ids (closed more than a year ago), persisted locally.
  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('aref_archived_ids') || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('aref_archived_ids', JSON.stringify(archivedIds));
  }, [archivedIds]);

  // State for modals and active selections
  const [selectedDossier, setSelectedDossier] = useState<HousingDossier | null>(null);
  const [editingDossier, setEditingDossier] = useState<HousingDossier | null>(null);
  const [auditDossier, setAuditDossier] = useState<HousingDossier | null>(null);
  const [auditHousingFilter, setAuditHousingFilter] = useState<'all' | 'fonction' | 'administratif'>('all');
  const [printDossierId, setPrintDossierId] = useState<string | undefined>(undefined);
  const [defaultDocType, setDefaultDocType] = useState<string>('demande');

  const visibleDossiers = currentUser.role !== 'dp_agent'
    ? dossiers
    : currentUser.dpNameAr
      ? dossiers.filter(dossier =>
          normalizeDirectorate(dossier.candidate.directionProvinciale) === normalizeDirectorate(currentUser.dpNameAr!)
        )
      : [];

  const activeDossiers = visibleDossiers.filter((d) => !archivedIds.includes(d.id));
  const archivedDossiers = visibleDossiers.filter((d) => archivedIds.includes(d.id));

  const filteredAuditDossiers = auditHousingFilter === 'all'
    ? activeDossiers
    : activeDossiers.filter((d) => d.housingRequest.housingType === auditHousingFilter);

  const handleArchiveDossier = (id: string) => {
    setArchivedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (selectedDossier?.id === id) setSelectedDossier(null);
  };
  const handleArchiveAllArchivable = () => {
    const ids = activeDossiers.filter((d) => isArchivable(d)).map((d) => d.id);
    setArchivedIds((prev) => [...new Set([...prev, ...ids])]);
    setSelectedDossier(null);
  };
  const handleRestoreDossier = (id: string) => {
    setArchivedIds((prev) => prev.filter((x) => x !== id));
    if (selectedDossier?.id === id) setSelectedDossier(null);
  };

  useEffect(() => {
    api
      .fetchDossiers()
      .then(setDossiers)
      .catch((e) => setLoadError(e.message))
      .finally(() => setIsLoadingDossiers(false));
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSaveDossier = async (saved: HousingDossier, docFiles?: Record<string, File | undefined>) => {
    const existsIndex = dossiers.findIndex((d) => d.id === saved.id);
    let dossierId = saved.id;

    if (existsIndex < 0) {
      try {
        // The dossier is always created on behalf of the DP agent of its province
        const dpAgent = currentUser.role === 'dp_agent'
          ? currentUser
          : null;
        const acteurLabel = dpAgent
          ? `${dpAgent.fullName} (${dpAgent.title})`
          : `ممثل المديرية الإقليمية - ${saved.candidate.directionProvinciale}`;
        const created = await api.createDossier(saved, acteurLabel);
        dossierId = created.id;
        setDossiers((prev) => [created, ...prev]);
      } catch (e) {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل إنشاء الملف في الخادم: ' + (e as Error).message,
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#059669',
        });
        return;
      }
    } else {
      // No backend endpoint yet for full dossier edits (only status
      // transitions have one) -- update the local copy only.
      setDossiers((prev) => {
        const updated = [...prev];
        updated[existsIndex] = saved;
        return updated;
      });
    }

    // Upload any staged "Dossier de Demande" files (step 4) now that the
    // dossier has a real backend id, so the DP agent can inspect them.
    const filesToUpload = Object.entries(docFiles || {}).filter(
      (entry): entry is [string, File] => !!entry[1]
    );
    const isChildCert = ([key]: [string, File]) => /^situationFamilialeEnfants_\d+$/.test(key);
    const childCerts = filesToUpload
      .filter(isChildCert)
      .sort((a, b) => Number(a[0].split('_')[1]) - Number(b[0].split('_')[1]))
      .map(([, file]) => file);
    const otherFiles = filesToUpload.filter((e) => !isChildCert(e));
    if (filesToUpload.length > 0) {
      try {
        if (childCerts.length > 0) {
          await api.uploadChildrenCertificates(dossierId, childCerts);
        }
        await Promise.all(
          otherFiles.map(([key, file]) => api.uploadDossierDocument(dossierId, key, file))
        );
        const refreshed = await api.fetchDossier(dossierId);
        setDossiers((prev) => prev.map((d) => (d.id === dossierId ? refreshed : d)));
      } catch (e) {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل رفع بعض الوثائق: ' + (e as Error).message,
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#059669',
        });
      }
    }

    setEditingDossier(null);
    setActiveTab('dossiers');
  };

  const handleDeleteDossier = async (id: string) => {
    const ok = await Swal.fire({
      icon: 'warning',
      title: 'حذف الملف نهائياً؟',
      text: 'سيتم حذف ملف الترشيح ووثائقه من النظام ولا يمكن التراجع.',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
    });
    if (!ok.isConfirmed) return;
    setDossiers((prev) => prev.filter((d) => d.id !== id));
    setArchivedIds((prev) => prev.filter((x) => x !== id));
    if (selectedDossier?.id === id) setSelectedDossier(null);
    if (editingDossier?.id === id) setEditingDossier(null);
    if (auditDossier?.id === id) setAuditDossier(null);
  };

  const handleUpdateStatus = async (
    updatedDossier: HousingDossier,
    newStatus: DossierStatus,
    comment: string,
    bordereauNumber?: string
  ) => {
    let finalDossier: HousingDossier;
    try {
      const fresh = await api.updateDossierStatus(updatedDossier.id, {
        status: newStatus,
        comment,
        acteur: `${currentUser.fullName} (${currentUser.title})`,
        numero_bordereau_dp: bordereauNumber || updatedDossier.dpAudit?.bordereauNumber,
        date_transmission_aref: updatedDossier.dpAudit?.transmissionDate,
        numero_decision_aref: updatedDossier.arefDecision?.decisionNumber,
        date_commission_aref: updatedDossier.arefDecision?.commissionDate,
      });
      finalDossier = {
        ...fresh,
        dpAudit: {
          ...(updatedDossier.dpAudit || {}),
          ...(fresh.dpAudit || {}),
          isComplete: fresh.dpAudit?.isComplete ?? updatedDossier.dpAudit?.isComplete ?? false,
        },
        arefDecision: { ...(updatedDossier.arefDecision || {}), ...fresh.arefDecision },
      };
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'فشل تحديث حالة الملف في الخادم: ' + (e as Error).message,
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#059669',
      });
      return;
    }

    setDossiers((prev) =>
      prev.map((d) => (d.id === finalDossier.id ? finalDossier : d))
    );

    // Keep the audit screen open on the refreshed dossier so the agent can
    // continue (preview docs, next step) without re-entering it.
    setAuditDossier((prev) => (prev && prev.id === finalDossier.id ? finalDossier : prev));
    if (selectedDossier?.id === finalDossier.id) {
      setSelectedDossier(finalDossier);
    }
    
    Swal.fire({
      icon: 'success',
      title: 'تم بنجاح',
      text: 'تمت العملية بنجاح!',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  const handleOpenPrint = (dossier: HousingDossier, docType: string = 'demande') => {
    setPrintDossierId(dossier.id);
    setDefaultDocType(docType);
    setActiveTab('documents');
  };

  if (isLoadingDossiers) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100 text-slate-500 text-sm">
        جاري تحميل الملفات من الخادم...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100 text-red-600 text-sm px-6 text-center">
        تعذر الاتصال بالخادم: {loadError}
      </div>
    );
  }

  return (
    <div className="app-shell flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 select-none">
      {/* Desktop App Window Chrome Title Bar */}
      <DesktopWindowChrome
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        dossiers={activeDossiers}
      />

      {/* Main Desktop Workspace with Sidebar & Content Canvas */}
      <div className="app-workspace flex flex-1 overflow-hidden">
        {/* Institutional Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'new_dossier') {
              setEditingDossier(null);
            }
          }}
          dossiers={activeDossiers}
          archivedCount={archivedDossiers.length}
          onOpenNewDossier={() => {
            setEditingDossier(null);
            setActiveTab('new_dossier');
          }}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/90 relative">
          <div className="max-w-6xl mx-auto">
            {/* View: Dossiers List */}
            {activeTab === 'dossiers' && (
              <DossierList
                dossiers={activeDossiers}
                onSelectDossier={(d) => setSelectedDossier(d)}
                onOpenNewDossier={() => {
                  setEditingDossier(null);
                  setActiveTab('new_dossier');
                }}
                onEditDossier={(d) => {
                  setEditingDossier(d);
                  setActiveTab('new_dossier');
                }}
                onOpenAudit={(d) => {
                  setActiveTab('audit');
                  setAuditDossier(d);
                }}
                onPrintDocuments={(d) => handleOpenPrint(d, d.status === 'approved' ? 'accord_attribution' : 'demande')}
                onDeleteDossier={handleDeleteDossier}
                onArchiveDossier={handleArchiveDossier}
                onArchiveAllArchivable={handleArchiveAllArchivable}
              />
            )}

            {/* View: Create / Edit Dossier */}
            {activeTab === 'new_dossier' && (
              <DossierForm
                initialDossier={editingDossier}
                onSave={handleSaveDossier}
                onCancel={() => {
                  setEditingDossier(null);
                  setActiveTab('dossiers');
                }}
              />
            )}

            {/* View: Official Documents Generator & Printing */}
            {activeTab === 'documents' && (
              <DocumentGenerator
                dossiers={activeDossiers}
                selectedDossierId={printDossierId}
                defaultDocType={defaultDocType}
              />
            )}

            {/* View: Audit Workflow (DP -> AREF) */}
            {activeTab === 'audit' && !auditDossier && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        الأكاديمية الجهوية للتربية والتكوين - جهة الشرق
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-500">8 مديريات إقليمية (DP)</span>
                    </div>
                    <h1 className="text-xl font-extrabold text-slate-900">
                      مسار التدقيق والإحالة الإدارية (DPs ➔ AREF Oriental)
                    </h1>
                    <p className="text-xs text-slate-600 mt-1">
                      تدقيق الملفات وتوليد جداول الإرسال الرسمية للمديريات الثماني: وجدة، بركان، الناظور، الدريوش، تاوريرت، جرسيف، جرادة، وفكيك.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2">
                  {([
                    { key: 'all', label: 'كل الملفات' },
                    { key: 'administratif', label: 'سكن إداري (شبكة التنقيط)' },
                    { key: 'fonction', label: 'سكن وظيفي (بحكم المسؤولية)' },
                  ] as const).map((f) => {
                    const count = f.key === 'all'
                      ? activeDossiers.length
                      : activeDossiers.filter((d) => d.housingRequest.housingType === f.key).length;
                    const isActive = auditHousingFilter === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => setAuditHousingFilter(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                        <span className={`mr-1.5 font-mono ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>{count}</span>
                      </button>
                    );
                  })}
                  <span className="text-xs text-slate-500 mr-auto">
                    عرض {filteredAuditDossiers.length} من أصل {activeDossiers.length} ملفات في المسار
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAuditDossiers.map((d) => (
                    <div
                      key={d.id}
                      className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-400 transition-colors shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {d.referenceNumber}
                        </span>
                        <span className="text-xs text-slate-400">{d.candidate.directionProvinciale}</span>
                      </div>

                      <div>
                        <h2 className="text-sm font-bold text-slate-900">{d.candidate.fullNameAr}</h2>
                        <div className="text-xs text-slate-500">{d.candidate.grade} · {d.candidate.currentEtablissement}</div>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center justify-between pt-1 border-t border-slate-100">
                        <span>نوع السكن: <strong>{d.housingRequest.housingType === 'fonction' ? 'وظيفي' : 'إداري'}</strong></span>
                        {d.housingRequest.housingType === 'administratif' && (
                          <span>مجموع النقط: <strong className="font-mono text-emerald-800">{d.bareme.totalPts}</strong></span>
                        )}
                      </div>

                      <StatusTimeline dossier={d} />

                      <button
                        onClick={() => setAuditDossier(d)}
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        معالجة الإجراء والتدقيق الإداري
                      </button>
                    </div>
                  ))}
                </div>

                {filteredAuditDossiers.length === 0 && (
                  <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                    <p className="text-sm font-bold text-slate-700">لا توجد ملفات بهذا النوع في مسار التدقيق حالياً.</p>
                    <button
                      onClick={() => setAuditHousingFilter('all')}
                      className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      عرض كل الملفات
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && auditDossier && (
              <AuditWorkflowModal
                dossier={auditDossier}
                onClose={() => setAuditDossier(null)}
                onUpdateStatus={handleUpdateStatus}
                onOpenApprovalLetter={(d) => handleOpenPrint(d, 'accord_attribution')}
              />
            )}

            {/* View: Compare candidates on the same establishment */}
            {activeTab === 'compare' && <CompareView dossiers={activeDossiers} />}

            {/* View: Eviction procedures (Note 40 - axis 4) */}
            {activeTab === 'eviction' && <EvictionView dossiers={activeDossiers} />}

            {activeTab === 'registre' && <RegistreLogementsView />}

            {/* View: Archive of closed dossiers */}
            {activeTab === 'archive' && (
              <ArchiveView
                archivedDossiers={archivedDossiers}
                onRestore={handleRestoreDossier}
                onSelectDossier={(d) => setSelectedDossier(d)}
                onDeleteDossier={handleDeleteDossier}
              />
            )}

            {/* View: User Management View (4 Roles & DPs) */}
            {activeTab === 'users' && permissions.canManageUsers && <UserManagementView />}

            {/* View: Auth & Security Log (dev + directeur académique) */}
            {activeTab === 'authlog' && permissions.canViewAuthLog && <AuthLogView />}

            {/* View: Regulations & Circular 40 Guide */}
            {activeTab === 'regulations' && <RegulationsGuide />}

            {/* View: Database & Backup */}
            {activeTab === 'database' && permissions.canAccessDatabaseSettings && (
              <DatabaseBackup
                dossiers={activeDossiers}
                onImportDossiers={(newOnes) => setDossiers(newOnes)}
                onResetDossiers={() => setDossiers(INITIAL_DOSSIERS)}
              />
            )}

            {/* View: Laravel Backend Architecture & Code Hub */}
          </div>
        </main>
      </div>

      {/* Modal: Dossier Inspection & Detail */}
      {selectedDossier && (
        <DossierDetailModal
          dossier={selectedDossier}
          onClose={() => setSelectedDossier(null)}
          onUpdateDossier={(updated) => {
            setDossiers((prev) =>
              prev.map((d) => (d.id === updated.id ? updated : d))
            );
            setSelectedDossier(updated);
          }}
          onOpenAudit={(d) => {
            setSelectedDossier(null);
            setActiveTab('audit');
            setAuditDossier(d);
          }}
          onPrintDocuments={(d) => {
            setSelectedDossier(null);
            handleOpenPrint(d, 'demande');
          }}
          onNavigateToDocumentGenerator={(docType) => {
            setSelectedDossier(null);
            handleOpenPrint(selectedDossier, docType);
          }}
        />
      )}



    </div>
  );
}

function DesktopHousingApp() {
  const { isAuthenticated, authChecked } = useAuth();

  if (!authChecked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100 text-xs text-slate-500" dir="rtl">
        <p>جارٍ التحقق من الجلسة…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInView />;
  }

  return <HousingWorkspace />;
}

export default function App() {
  return (
    <AuthProvider>
      <DesktopHousingApp />
    </AuthProvider>
  );
}
