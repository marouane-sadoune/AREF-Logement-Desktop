import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  User, 
  Users, 
  Home, 
  FileCheck, 
  Calculator, 
  CheckCircle, 
  AlertCircle,
  Building,
  Calendar,
  Sparkles,
  Upload
} from 'lucide-react';
import { 
  HousingDossier, 
  CandidateInfo, 
  SituationFamilialeInfo, 
  HousingRequestInfo,
  RequiredDocumentsChecklist,
  MOROCCAN_AREFS,
  MOROCCAN_DIRECTORATES,
  MOROCCAN_GRADES,
  PERFORMANCE_RATING_LABELS,
  PerformanceRating,
  RegistreLogement
} from '../types/housing';
import { calculateBareme } from '../utils/bareme';
import { useAuth } from '../context/AuthContext';
import { getDossierDocumentUrl, fetchLogements, createLogement } from '../api/client';
import { DocumentPreviewCard, DocumentPreviewCardData } from './DocumentPreviewCard';

interface DossierFormProps {
  initialDossier?: HousingDossier | null;
  onSave: (dossier: HousingDossier, docFiles?: Record<string, File | undefined>) => void;
  onCancel: () => void;
}

const SITUATION_FAMILIALE_SUB_DOCS = [
  { flagKey: 'marriageCert', fileKey: 'situationFamilialeContratMariage', titleAr: 'أ. نسخة من عقد الزواج (إن وجد)', detailAr: 'نسخة من عقد الزواج الرسمي للمستفيد، إن وجد.' },
  { flagKey: 'spouseAttestation', fileKey: 'situationFamilialeAttestationConjoint', titleAr: 'ب. شهادة إدارية تثبت وضعية عمل الزوج/الزوجة', detailAr: 'تثبت الوضعية الإدارية للزوج أو الزوجة في حالة كونه موظفاً بدوره.' },
  { flagKey: 'childrenCertificates', fileKey: 'situationFamilialeEnfants', titleAr: 'ج. بيان عدد الأطفال المعالين', detailAr: 'بيان أو وثائق تثبت عدد الأطفال المعالين (عقود الأزدياد).' },
] as const;

const DOC_LABELS_AR: Record<string, string> = {
  demandeManuscrite: '1. الطلب الخطي (Demande manuscrite)',
  copieCIN: '2. نسخة من بطاقة التعريف الوطنية (CIN)',
  attestationTravail: '3. شهادة العمل (Attestation de travail)',
  situationFamilialeContratMariage: '4-أ. نسخة من عقد الزواج',
  situationFamilialeAttestationConjoint: '4-ب. شهادة إدارية تثبت وضعية عمل الزوج/الزوجة',
  situationFamilialeEnfants: '4-ج. بيان عدد الأطفال المعالين',
  engagementHonneur: '5. مطبوع الالتزام والتصريح بالشرف (Engagement)',
  pvInstallation: '6. محضر الالتحاق بالمؤسسة (PV d\'installation)',
};

export const DossierForm: React.FC<DossierFormProps> = ({
  initialDossier,
  onSave,
  onCancel
}) => {
  const { currentUser } = useAuth();
  const isDpAgent = currentUser.role === 'dp_agent';

  const [activeStep, setActiveStep] = useState<number>(1);

  // Candidate State
  const [candidate, setCandidate] = useState<CandidateInfo>(
    initialDossier?.candidate || {
      gender: undefined,
      fullNameAr: '',
      fullNameFr: '',
      cin: '',
      ppr: '',
      phone: '',
      email: '',
      grade: 'أستاذ التعليم الثانوي التأهيلي',
      scale: 11,
      echelon: 5,
      seniorityGeneral: 10,
      seniorityEtablissement: 3,
      installationDate: '2023-09-01',
      currentEtablissement: '',
      etablissementType: 'ثانوي تأهيلي',
      commune: isDpAgent && currentUser.dpNameAr ? currentUser.dpNameAr.replace('المديرية الإقليمية ب', '').replace(' (بوعرفة)', '').trim() : 'وجدة',
      directionProvinciale: (isDpAgent && currentUser.dpNameAr) ? currentUser.dpNameAr : MOROCCAN_DIRECTORATES[0],
      aref: MOROCCAN_AREFS[0] // الأكاديمية الجهوية للتربية والتكوين - جهة الشرق
    }
  );

  // Situation Familiale State
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamilialeInfo>(
    initialDossier?.situationFamiliale || {
      maritalStatus: 'marie',
      spouseName: '',
      spouseIsPublicOfficial: false,
      spouseAdministration: '',
      spousePPR: '',
      childrenCount: 2
    }
  );

  // Housing Request State
  const [housingRequest, setHousingRequest] = useState<HousingRequestInfo>(
    initialDossier?.housingRequest || {
      housingType: 'fonction',
      targetEtablissement: '',
      housingCategory: 'شقة وظيفية',
      housingAddress: 'داخل الحرم المدرسي',
      housingNumber: 'شقة 01',
      housingStatus: 'vacant',
      reasons: 'ضرورة التواجد الدائم وحسن سير المرفق الإداري والتربوي وفق المذكرة 40'
    }
  );

  // Documents Checklist State
  const [documents, setDocuments] = useState(
    initialDossier?.documents || {
      demandeManuscrite: { present: true, isLegalized: false },
      copieCIN: { present: true, isLegalized: true },
      attestationTravail: { present: true },
      situationFamiliale: { present: true, marriageCert: true, spouseAttestation: false, childrenCertificates: true },
      engagementHonneur: { present: true, isLegalized: true },
      pvInstallation: { present: true }
    }
  );

  // Auto calculate bareme
  const bareme = calculateBareme(candidate, situationFamiliale, housingRequest);

  // Files staged for the 6 mandatory supporting documents (step 4). They are
  // uploaded to the backend once the dossier itself has been saved -- a new
  // dossier only gets a real id at that point -- so the DP agent can inspect
  // them afterwards (view link next to each document).
  const [docFiles, setDocFiles] = useState<Record<string, File | undefined>>({});
  const [previewDocData, setPreviewDocData] = useState<DocumentPreviewCardData | null>(null);
  const [availableLogements, setAvailableLogements] = useState<RegistreLogement[]>([]);

  useEffect(() => {
    fetchLogements({ statut: 'vacant' }).then(res => setAvailableLogements(res.data)).catch(() => {});
  }, []);

  // The dossier links itself to the central housing register automatically:
  // the candidate applies for a dwelling located in their own workplace
  // (step 1), so the vacant register entry of that établissement is the link.
  const autoMatchedLogement = availableLogements.find(
    (l) => l.etablissement.trim() === candidate.currentEtablissement.trim() && l.etablissement.trim() !== ''
  );

  const handleDocFileChange = (key: keyof RequiredDocumentsChecklist, file: File | null) => {
    setDocFiles(prev => ({ ...prev, [key]: file || undefined }));
    if (file) {
      setDocuments(prev => ({
        ...prev,
        [key]: { ...(prev[key] as any), present: true, fileName: file.name }
      } as RequiredDocumentsChecklist));
    }
  };

  const handleSituationFamilialeFileChange = (
    subDoc: (typeof SITUATION_FAMILIALE_SUB_DOCS)[number],
    file: File | null
  ) => {
    setDocFiles(prev => ({ ...prev, [subDoc.fileKey]: file || undefined }));
    setDocuments(prev => {
      const sf = prev.situationFamiliale;
      const next: any = {
        ...sf,
        [subDoc.flagKey]: file ? true : sf[subDoc.flagKey],
        present: true,
      };
      if (file) next[`${subDoc.flagKey}FileName`] = file.name;
      return { ...prev, situationFamiliale: next };
    });
  };

  const toggleSituationFamilialeFlag = (
    flagKey: 'marriageCert' | 'spouseAttestation' | 'childrenCertificates',
    checked: boolean
  ) => {
    setDocuments(prev => {
      const sf = { ...prev.situationFamiliale, [flagKey]: checked };
      sf.present = sf.marriageCert || sf.spouseAttestation || sf.childrenCertificates;
      return { ...prev, situationFamiliale: sf };
    });
  };

  // Preview card for one document. Situation-familiale sub-docs are passed as
  // a group (groupKeys) so arrows switch between the 3 sub-files; every other
  // document previews on its own.
  const openDocPreview = (clickedKey: string, groupKeys?: string[]) => {
    if (!initialDossier?.id) return;
    const dossierId = initialDossier.id;
    const nameOf = (k: string): string | undefined => {
      const sub = SITUATION_FAMILIALE_SUB_DOCS.find((s) => s.fileKey === k);
      if (sub) return ((documents.situationFamiliale as any)[`${sub.flagKey}FileName`] as string | undefined);
      return (documents[k as keyof RequiredDocumentsChecklist] as { fileName?: string }).fileName;
    };
    const files = (groupKeys ?? [])
      .filter((k) => nameOf(k))
      .map((k) => ({ key: k, name: DOC_LABELS_AR[k] ?? nameOf(k)!, fileName: nameOf(k), url: getDossierDocumentUrl(dossierId, k) }));
    const idx = Math.max(0, files.findIndex((e) => e.key === clickedKey));
    setPreviewDocData({
      id: clickedKey,
      titleAr: DOC_LABELS_AR[clickedKey] ?? clickedKey,
      descAr: '',
      isPresent: true,
      legalizationNeeded: false,
      fileName: nameOf(clickedKey),
      fileUrl: getDossierDocumentUrl(dossierId, clickedKey),
      files: files.length > 1 ? files : undefined,
      initialIndex: idx,
    });
  };

  // File input + inspect link for one of the 6 mandatory documents.
  // Only dossiers that already have a real backend id (editing an existing
  // dossier) can be inspected immediately; a brand new dossier is not saved
  // to the server until the final submit, so newly staged files only show
  // their local file name until then.
  const renderDocFileControl = (key: keyof RequiredDocumentsChecklist) => {
    const staged = docFiles[key];
    const uploadedName = (documents[key] as { fileName?: string }).fileName;

    return (
      <div className="flex w-full flex-col gap-2 sm:w-52">
        <label className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-700">
          <span className="text-[11px] font-medium">الوثيقة متوفرة</span>
        <input
          type="checkbox"
          checked={documents[key].present}
          onChange={(e) => setDocuments({
            ...documents,
            [key]: { ...(documents[key] as any), present: e.target.checked }
          } as RequiredDocumentsChecklist)}
            className="h-4 w-4 shrink-0 cursor-pointer rounded accent-emerald-600"
        />
        </label>
        <div className="min-w-0">
        <input
          type="file"
            id={`dossier-file-${key}`}
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => handleDocFileChange(key, e.target.files?.[0] || null)}
            className="peer sr-only"
        />
          <label
            htmlFor={`dossier-file-${key}`}
            className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-600"
          >
            <Upload className="h-4 w-4 text-emerald-700" />
            <span>اختيار ملف</span>
          </label>
        </div>
        {staged && (
          <span className="w-full truncate text-left text-[10px] text-emerald-700" title={staged.name}>{staged.name}</span>
        )}
        {!staged && uploadedName && initialDossier?.id && (
          <button
            type="button"
            onClick={() => openDocPreview(key as string)}
            className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            <span>&#128270;</span> معاينة الملف
          </button>
        )}
      </div>
    );
  };

  // The requested housing must be located in the candidate's workplace.
  useEffect(() => {
    if (housingRequest.targetEtablissement !== candidate.currentEtablissement) {
      setHousingRequest(prev => ({ ...prev, targetEtablissement: candidate.currentEtablissement }));
    }
  }, [candidate.currentEtablissement, housingRequest.targetEtablissement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!candidate.fullNameAr.trim() || !candidate.ppr.trim()) {
      alert('يرجى ملء الحقول الإلزامية: الاسم الكامل ورقم التأجير (PPR)');
      setActiveStep(1);
      return;
    }

    if (!candidate.currentEtablissement.trim()) {
      alert('يرجى تحديد مقر العمل الحالي (المؤسسة التعليمية)');
      setActiveStep(1);
      return;
    }

    if (!candidate.commune.trim()) {
      alert('يرجى تحديد المدينة \\ القرية التي تتواجد بها المؤسسة');
      setActiveStep(1);
      return;
    }

    if (housingRequest.targetEtablissement.trim() !== candidate.currentEtablissement.trim()) {
      alert('يجب أن يكون السكن المطلوب داخل نفس المؤسسة التي يعمل بها الموظف');
      setActiveStep(3);
      return;
    }

    if (
      !candidate.currentEtablissement.trim() ||
      candidate.currentEtablissement.trim() === candidate.fullNameAr.trim()
    ) {
      alert('المؤسسة التعليمية التي يوجد بها السكن يجب أن تكون اسم المؤسسة، وليس اسم المترشح. يرجى تصحيح حقل "مقر العمل الحالي" في الخطوة 1.');
      setActiveStep(1);
      return;
    }

    // Central register link is automatic: reuse the vacant entry of the
    // candidate's établissement, or register one on the fly if none exists yet.
    let registreLogementId: number | null = autoMatchedLogement?.id ?? null;
    if (!registreLogementId) {
      const logementPayload = (numero: string): Partial<RegistreLogement> => ({
        numero_logement: numero,
        etablissement: candidate.currentEtablissement.trim(),
        direction_provinciale: candidate.directionProvinciale || '',
        type_logement: housingRequest.housingType,
        categorie: housingRequest.housingCategory?.trim() || 'غير محدد',
        adresse: housingRequest.housingAddress?.trim() || null,
        statut: 'vacant',
        etat_batiment: 'bon',
        observations: 'تمت إضافته تلقائياً عند إيداع ملف الترشيح',
      });
      const manualNumero = housingRequest.housingNumber?.trim();
      try {
        const created = await createLogement(logementPayload(manualNumero || `AUTO-${Date.now()}`));
        registreLogementId = created.id;
      } catch {
        // A duplicate housing number must not block the dossier: retry once
        // with a generated unique reference.
        try {
          const created = await createLogement(logementPayload(`AUTO-${Date.now()}`));
          registreLogementId = created.id;
        } catch {
          registreLogementId = null;
        }
      }
    }

    const newId = initialDossier ? initialDossier.id : `dos-${Date.now()}`;
    const refNum = initialDossier 
      ? initialDossier.referenceNumber 
      : `DP-LOG/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;

    const savedDossier: HousingDossier = {
      id: newId,
      referenceNumber: refNum,
      creationDate: initialDossier ? initialDossier.creationDate : new Date().toISOString().split('T')[0],
      status: initialDossier ? initialDossier.status : 'submitted_dp',
      candidate,
      situationFamiliale,
      housingRequest,
      documents,
      bareme,
      registreLogementId,
      auditHistory: initialDossier ? initialDossier.auditHistory : [
        {
          stage: 'creation',
          date: new Date().toLocaleString('ar-MA'),
          actor: candidate.fullNameAr,
          decision: 'إيداع الملف بالمديرية الإقليمية',
          comment: 'تم إعداد وتدقيق ملف الترشيح وتضمين الوثائق القانونية طبقاً للمذكرة 40'
        }
      ],
      dpAudit: initialDossier?.dpAudit || {
        auditedBy: 'مكتب السكنيات - DP',
        auditDate: new Date().toISOString().split('T')[0],
        isComplete: Object.values(documents).every(d => d.present),
        bordereauNumber: `BORD/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`
      }
    };

    onSave(savedDossier, docFiles);
  };

  const steps = [
    { number: 1, label: 'معلومات المترشح', icon: User },
    { number: 2, label: 'الوضع العائلي', icon: Users },
    { number: 3, label: 'السكن المطلوب', icon: Home },
    { number: 4, label: 'الوثائق الست المطلوبة', icon: FileCheck },
    { number: 5, label: 'احتساب شبكة التنقيط', icon: Calculator }
  ];

  return (
    <>
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Form Header */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-emerald-600 px-2 py-0.5 rounded text-white">
              المذكرة الوزارية رقم 40
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-300">مسطرة إعداد ملف الترشيح للاستفادة</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            {initialDossier ? 'تعديل بيانات ملف الترشيح' : 'تكوين ملف طلب جديد للاستفادة من السكن'}
          </h2>
        </div>

        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step Indicators */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.number;
            const isCompleted = activeStep > step.number;

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(step.number)}
                className={`flex items-center gap-2 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{step.number}. {step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* STEP 1: معلومات المترشح */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>1. البيانات الشخصية والإدارية للموظف(ة)</span>
              </h3>
              <span className="text-xs text-slate-500">* الحقول إلزامية للتدقيق الإداري</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">الاسم والنسب بالعربية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ذ. عبد السلام بنجلون"
                  value={candidate.fullNameAr}
                  onChange={(e) => setCandidate({ ...candidate, fullNameAr: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الجنس *</label>
                <select
                  value={candidate.gender || 'male'}
                  onChange={(e) => setCandidate({ ...candidate, gender: e.target.value as 'male' | 'female' })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم التأجير (PPR / Somme de paiement) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 1459021"
                  value={candidate.ppr}
                  onChange={(e) => setCandidate({ ...candidate, ppr: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الإطار / المهمة الإدارية *</label>
                <select
                  value={candidate.grade}
                  onChange={(e) => setCandidate({ ...candidate, grade: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  {MOROCCAN_GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">السلم الإداري</label>
                  <select
                    value={candidate.scale}
                    onChange={(e) => setCandidate({ ...candidate, scale: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                  >
                    <option value={9}>السلم 9</option>
                    <option value={10}>السلم 10</option>
                    <option value={11}>السلم 11</option>
                    <option value={12}>خارج السلم (Hors échelle)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الرتبة</label>
                  <input
                    type="number"
                    min={1}
                    max={13}
                    value={candidate.echelon}
                    onChange={(e) => setCandidate({ ...candidate, echelon: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الأقدمية العامة بالتعليم (سنوات)</label>
                <input
                  type="number"
                  min={0}
                  max={45}
                  value={candidate.seniorityGeneral}
                  onChange={(e) => setCandidate({ ...candidate, seniorityGeneral: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400">تمنح 1 نقطة عن كل سنة في شبكة التنقيط</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الأقدمية في المؤسسة الحالية (سنوات)</label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={candidate.seniorityEtablissement}
                  onChange={(e) => setCandidate({ ...candidate, seniorityEtablissement: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400">تمنح 2 نقط عن كل سنة استقرار بالمؤسسة</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">مقر العمل الحالي (المؤسسة التعليمية) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الثانوية التأهيلية ابن عباد"
                  value={candidate.currentEtablissement}
                  onChange={(e) => setCandidate({ ...candidate, currentEtablissement: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المدينة \ القرية التي تتواجد بها المؤسسة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: وجدة، الناظور، بركان..."
                  value={candidate.commune}
                  onChange={(e) => setCandidate({ ...candidate, commune: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">المديرية الإقليمية (DP) *</label>
                  {isDpAgent && currentUser.dpNameAr && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.2 rounded">
                      حساب المديرية: {currentUser.dpNameAr}
                    </span>
                  )}
                </div>
                <select
                  value={candidate.directionProvinciale}
                  onChange={(e) => setCandidate({ ...candidate, directionProvinciale: e.target.value })}
                  disabled={isDpAgent && !!currentUser.dpNameAr}
                  className={`w-full p-2.5 border rounded-lg focus:outline-none ${
                    isDpAgent && currentUser.dpNameAr
                      ? 'bg-blue-50/60 border-blue-300 text-blue-900 font-bold cursor-not-allowed'
                      : 'bg-slate-50 border-slate-200 focus:border-emerald-500 focus:bg-white'
                  }`}
                >
                  {MOROCCAN_DIRECTORATES.map((dp) => (
                    <option key={dp} value={dp}>{dp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الأكاديمية الجهوية (AREF) *</label>
                <select
                  value={candidate.aref}
                  onChange={(e) => setCandidate({ ...candidate, aref: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  {MOROCCAN_AREFS.map((ar) => (
                    <option key={ar} value={ar}>{ar}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="0661xxxxxx"
                    value={candidate.phone}
                    onChange={(e) => setCandidate({ ...candidate, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">البريد الإلكتروني المهني</label>
                  <input
                    type="email"
                    placeholder="@taalim.ma"
                    value={candidate.email}
                    onChange={(e) => setCandidate({ ...candidate, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: الوضع العائلي */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{candidate.gender === 'female' ? '2. الوضع العائلي للمترشحة (Situation Familiale) والوثائق المثبتة' : '2. الوضع العائلي للمترشح (Situation Familiale) والوثائق المثبتة'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                حسب المذكرة 40: أعزب = 0 نقطة، نقطتان عن الزوج(ة) غير العامل(ة)، ونقطة عن كل طفل في حدود 3 أطفال.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">الحالة العائلية للمترشح(ة)</label>
                <select
                  value={situationFamiliale.maritalStatus}
                  onChange={(e) => {
                    const ms = e.target.value as any;
                    setSituationFamiliale({ ...situationFamiliale, maritalStatus: ms });
                    setDocuments(prev => ({
                      ...prev,
                      situationFamiliale: { ...prev.situationFamiliale, present: ms === 'celibataire' ? true : prev.situationFamiliale.present },
                    }));
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="marie">متزوج(ة) - 2 نقط (زوج غير عامل)</option>
                  <option value="celibataire">عازب(ة) - 0 نقطة</option>
                  <option value="divorce">مطلق(ة) - 0 نقطة</option>
                  <option value="veuf">أرمل(ة) - 0 نقطة</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">عدد الأطفال المعالين (تحت سن الرشد)</label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={situationFamiliale.childrenCount}
                  onChange={(e) => setSituationFamiliale({ ...situationFamiliale, childrenCount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">نقطة عن كل طفل في حدود 3 أطفال (أقصاه 3 نقط)</span>
              </div>

              {situationFamiliale.maritalStatus === 'marie' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{candidate.gender === 'female' ? 'اسم ونسب الزوج' : 'اسم ونسب الزوجة'}</label>
                    <input
                      type="text"
                      placeholder={candidate.gender === 'female' ? 'الاسم الكامل للزوج' : 'الاسم الكامل للزوجة'}
                      value={situationFamiliale.spouseName}
                      onChange={(e) => setSituationFamiliale({ ...situationFamiliale, spouseName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-slate-700">{candidate.gender === 'female' ? 'هل الزوج موظف عمومي؟' : 'هل الزوجة موظفة عمومية؟'}</label>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="spouseOfficial"
                          checked={situationFamiliale.spouseIsPublicOfficial}
                          onChange={() => setSituationFamiliale({ ...situationFamiliale, spouseIsPublicOfficial: true })}
                        />
                        <span>نعم ({candidate.gender === 'female' ? 'موظف بالقطاع العام' : 'موظفة بالقطاع العام'})</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="spouseOfficial"
                          checked={!situationFamiliale.spouseIsPublicOfficial}
                          onChange={() => setSituationFamiliale({ ...situationFamiliale, spouseIsPublicOfficial: false })}
                        />
                        <span>لا (قطاع خاص / لا يعمل)</span>
                      </label>
                    </div>
                  </div>

                  {situationFamiliale.spouseIsPublicOfficial && (
                    <>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">الإدارة المشغلة للزوج(ة)</label>
                        <input
                          type="text"
                          placeholder="مثال: وزارة التربية الوطنية أو وزارة الصحة"
                          value={situationFamiliale.spouseAdministration}
                          onChange={(e) => setSituationFamiliale({ ...situationFamiliale, spouseAdministration: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">رقم تأجير الزوج(ة) (PPR)</label>
                        <input
                          type="text"
                          placeholder="رقم التأجير إن وجد"
                          value={situationFamiliale.spousePPR}
                          onChange={(e) => setSituationFamiliale({ ...situationFamiliale, spousePPR: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: مواصفات السكن المطلوب */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" />
                <span>3. مواصفات السكن الإداري أو الوظيفي المطلوب</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تحديد طبيعة السكن طبقاً للمذكرة 40 (وظيفي بحكم ضرورة المهام أم إداري حسب الاستحقاق).
              </p>
            </div>

            {/* Auto link with the central housing register (by candidate's établissement) */}
            {autoMatchedLogement && (
              <div className="p-3 rounded-lg border bg-emerald-50 border-emerald-200">
                <label className="block text-[11px] font-semibold text-emerald-800 mb-0.5">
                  الربط التلقائي بالسجل المركزي للمساكن
                </label>
                <p className="text-[11px] text-emerald-800">
                  سيرتبط الملف تلقائياً بالسكن الشاغر <strong>{autoMatchedLogement.numero_logement}</strong>
                  {' · '}{autoMatchedLogement.categorie} ({autoMatchedLogement.direction_provinciale})
                  حسب مؤسسة عمل المترشح(ة).
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">نوع السكن *</label>
                <select
                  value={housingRequest.housingType}
                  onChange={(e) => setHousingRequest({ ...housingRequest, housingType: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                >
                  <option value="fonction">سكن وظيفي (Logement de fonction - بحكم المسؤولية والمهام)</option>
                  <option value="administratif">سكن إداري (Logement administratif - حسب شبكة التنقيط)</option>
                </select>
                <span className="text-[10px] text-slate-400">
                  {housingRequest.housingType === 'fonction'
                    ? 'يخصص للمدير، الحراس العامين، النظار، والمقتصدين لضرورة المصلحة المطلقة.'
                    : 'يمنح لباقي الأطر التعليمية والإدارية بناءً على التنافس وشبكة التنقيط.'}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المؤسسة التعليمية التي يوجد بها السكن *</label>
                <input
                  type="text"
                  required
                  readOnly
                  value={housingRequest.targetEtablissement}
                  className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-semibold cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500">يجب أن يطابق مقر العمل الحالي للموظف.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">صنف ونوع السكن</label>
                <input
                  type="text"
                  placeholder="مثال: فيلا وظيفية، شقة ملحقة، جناح إداري"
                  value={housingRequest.housingCategory}
                  onChange={(e) => setHousingRequest({ ...housingRequest, housingCategory: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم السكن أو رمزه الإداري</label>
                <input
                  type="text"
                  placeholder="مثال: سكن رقم 01، جناح A"
                  value={housingRequest.housingNumber}
                  onChange={(e) => setHousingRequest({ ...housingRequest, housingNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">موقع وعنوان السكن بدقة</label>
                <input
                  type="text"
                  placeholder="مثال: داخل المؤسسة التعليمية، الجناح الإداري، قرب الباب الرئيسي"
                  value={housingRequest.housingAddress}
                  onChange={(e) => setHousingRequest({ ...housingRequest, housingAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">دواعي وأسباب الطلب</label>
                <textarea
                  rows={3}
                  value={housingRequest.reasons}
                  onChange={(e) => setHousingRequest({ ...housingRequest, reasons: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: التحقق من الوثائق الـ 6 الإلزامية */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>4. التحقق من الوثائق {situationFamiliale.maritalStatus === 'celibataire' ? 'الخمس' : 'الست'} الإلزامية المكونة للملف (Dossier de Demande)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {situationFamiliale.maritalStatus === 'celibataire'
                  ? 'المترشح(ة) عازب(ة): لا تُطلب وثائق الوضع العائلي. يكفي 5 وثائق إلزامية.'
                  : 'هذه الوثائق تدقق بمصلحة الموارد البشرية بالمديرية الإقليمية (DP) قبل الإحالة على الأكاديمية الجهوية (AREF).'}
              </p>
            </div>

            <div className="space-y-3">
              {/* Doc 1 */}
              <div className="grid grid-cols-1 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_13rem]">
                <div className="min-w-0 space-y-1">
                  <div className="font-bold text-slate-900">1. الطلب الخطي (Demande manuscrite)</div>
                  <div className="text-slate-500 text-[11px]">
                    طلب موجه إلى السيد المدير الإقليمي، يحدد فيه الموظف رغبته مع ذكر إطاره، مهامه، ومقر عمله.
                  </div>
                </div>
                {renderDocFileControl('demandeManuscrite')}
              </div>

              {/* Doc 2 */}
              <div className="grid grid-cols-1 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_13rem]">
                <div className="min-w-0 space-y-1">
                  <div className="font-bold text-slate-900">2. نسخة من بطاقة التعريف الوطنية (Copie de la CIN)</div>
                  <div className="text-slate-500 text-[11px]">
                    بطاقة التعريف الوطنية الإلكترونية للمستفيد سارية الصلاحية.
                  </div>
                </div>
                {renderDocFileControl('copieCIN')}
              </div>

              {/* Doc 3 */}
              <div className="grid grid-cols-1 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_13rem]">
                <div className="min-w-0 space-y-1">
                  <div className="font-bold text-slate-900">3. شهادة العمل (Attestation de travail) حديثة</div>
                  <div className="text-slate-500 text-[11px]">
                    تثبت وضعية الموظف الإدارية، إطاره، سلمه، وتاريخ تعيينه بمقر العمل.
                  </div>
                </div>
                {renderDocFileControl('attestationTravail')}
              </div>

              {/* Doc 4 — only required for non-célibataire candidates */}
              {situationFamiliale.maritalStatus !== 'celibataire' && (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="min-w-0 space-y-1">
                  <div className="font-bold text-slate-900">4. الوضع العائلي (Situation Familiale)</div>
                  <div className="text-slate-500 text-[11px]">
                    ثلاث وثائق: عقد الزواج (إن وجد)، شهادة إدارية تثبت عمل الزوج/الزوجة، وبيان عدد الأطفال المعالين.
                  </div>
                </div>
                {SITUATION_FAMILIALE_SUB_DOCS.map((sub) => {
                  const staged = docFiles[sub.fileKey];
                  const uploadedName = (documents.situationFamiliale as any)[`${sub.flagKey}FileName`] as string | undefined;
                  return (
                    <div key={sub.fileKey} className="grid grid-cols-1 items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs sm:grid-cols-[minmax(0,1fr)_13rem]">
                      <div className="min-w-0 space-y-1">
                        <div className="font-semibold text-slate-800">{sub.titleAr}</div>
                        <div className="text-slate-500 text-[11px]">{sub.detailAr}</div>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:w-52">
                        <label className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                          <span className="text-[11px] font-medium">الوثيقة متوفرة</span>
                          <input
                            type="checkbox"
                            checked={documents.situationFamiliale[sub.flagKey]}
                            onChange={(e) => toggleSituationFamilialeFlag(sub.flagKey, e.target.checked)}
                            className="h-4 w-4 shrink-0 cursor-pointer rounded accent-emerald-600"
                          />
                        </label>
                        <div className="min-w-0">
                          <input
                            type="file"
                            id={`dossier-file-${sub.fileKey}`}
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => handleSituationFamilialeFileChange(sub, e.target.files?.[0] || null)}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={`dossier-file-${sub.fileKey}`}
                            className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-600"
                          >
                            <Upload className="h-4 w-4 text-emerald-700" />
                            <span>اختيار ملف</span>
                          </label>
                        </div>
                        {staged && (
                          <span className="w-full truncate text-left text-[10px] text-emerald-700" title={staged.name}>{staged.name}</span>
                        )}
                        {!staged && uploadedName && initialDossier?.id && (
                          <button
                            type="button"
                            onClick={() => openDocPreview(sub.fileKey, SITUATION_FAMILIALE_SUB_DOCS.map((s) => s.fileKey))}
                            className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                          >
                            <span>&#128270;</span> معاينة الملف
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}

              {/* Doc 5 */}
              <div className="grid grid-cols-1 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_13rem]">
                <div className="min-w-0 space-y-1">
                  <div className="font-bold text-slate-900">5. مطبوع الالتزام والتصريح بالشرف (Engagement)</div>
                  <div className="text-slate-500 text-[11px]">
                    التزام مصحح الإمضاء يقر فيه باحترام بنود المذكرة 40 والتعهد بإفراغ السكن فور انتهاء المهام.
                  </div>
                </div>
                {renderDocFileControl('engagementHonneur')}
              </div>

              {/* Doc 6 */}
              <div className="grid grid-cols-1 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_13rem]">
                <div className="min-w-0 space-y-1">
                  <div className="font-bold text-slate-900">6. محضر الالتحاق بالمؤسسة (PV d'installation)</div>
                  <div className="text-slate-500 text-[11px]">
                    يثبت تعيين الموظف الفعلي بالمؤسسة التعليمية التي يوجد بها السكن المطلوب.
                  </div>
                </div>
                {renderDocFileControl('pvInstallation')}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: احتساب شبكة التنقيط */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>5. شبكة التنقيط المعيارية للمترشح (Calcul du Barème)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                محسوبة تلقائياً وفق المعايير الإدارية المنصوص عليها في المذكرة الوزارية 40.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              {/* Official Note 40 criteria inputs (not auto-derived) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    المردودية (المعيار 6)
                  </label>
                  <select
                    value={candidate.performanceRating ?? 'satisfactory'}
                    onChange={(e) => setCandidate({ ...candidate, performanceRating: e.target.value as PerformanceRating })}
                    className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {(Object.keys(PERFORMANCE_RATING_LABELS) as PerformanceRating[]).map((k) => (
                      <option key={k} value={k}>{PERFORMANCE_RATING_LABELS[k]}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 pt-5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!candidate.isRuralArea}
                    onChange={(e) => setCandidate({ ...candidate, isRuralArea: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span>المؤسسة بالوسط القروي</span>
                </label>

                <label className="flex items-center gap-2 pt-5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!candidate.isRuralBranch}
                    onChange={(e) => setCandidate({ ...candidate, isRuralBranch: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span>مدرس بفرعية (الوسط القروي)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">الإطار (السلم {candidate.scale})</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">{bareme.scalePts}</div>
                  <div className="text-[10px] text-slate-400">1-6 (1) · 7-9 (2) · 10+ (3)</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">الأقدمية العامة</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">{bareme.seniorityGeneralPts}</div>
                  <div className="text-[10px] text-slate-400">5 أشطر (1 إلى 5 نقط)</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">الأقدمية بنفس المدينة</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">{bareme.seniorityEtablissementPts}</div>
                  <div className="text-[10px] text-slate-400">شطران (1 أو 2 نقط)</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">التحملات العائلية</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">{bareme.maritalPts + bareme.childrenPts}</div>
                  <div className="text-[10px] text-slate-400">{bareme.childrenPts} أبناء + {bareme.maritalPts} زوج(ة)</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">المسؤولية</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">{bareme.responsibilityBonus}</div>
                  <div className="text-[10px] text-slate-400">رئيس قسم 3 / مصلحة 2</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">المردودية</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">{bareme.performancePts ?? 0}</div>
                  <div className="text-[10px] text-slate-400">
                    {PERFORMANCE_RATING_LABELS[candidate.performanceRating ?? 'satisfactory']}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">الوسط القروي</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">{bareme.ruralBonusPts ?? 0}</div>
                  <div className="text-[10px] text-slate-400">معلمة 3 / فرعية 2</div>
                </div>
              </div>

              <div className="bg-emerald-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-200 font-medium">المجموع الإجمالي لنقط الاستحقاق</div>
                  <div className="text-sm font-bold mt-0.5">
                    عند التعادل: تُرجَّح الأقدمية العامة ثم يُلجأ إلى القرعة
                  </div>
                </div>
                <div className="text-3xl font-mono font-bold text-emerald-300">
                  {bareme.totalPts} <span className="text-sm font-normal text-emerald-100">نقطة</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation & Submit Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div>
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep - 1)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                السابق
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
            >
              إلغاء
            </button>

            {activeStep < 5 ? (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep + 1)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                المتابعة إلى الخطوة {activeStep + 1}
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتسجيل ملف الترشيح</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>

    {/* Document Preview Card Modal */}
    {previewDocData && (
      <DocumentPreviewCard
        data={previewDocData}
        onClose={() => setPreviewDocData(null)}
      />
    )}
  </>
  );
};
