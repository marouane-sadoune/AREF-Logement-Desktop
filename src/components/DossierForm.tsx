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
  AlertTriangle,
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
  requiredDocumentKeys,
  meetsEligibilityConditions,
  isNonOwnershipCertificateExpired,
  ELIGIBILITY_QUESTIONS,
  MOROCCAN_AREFS,
  MOROCCAN_DIRECTORATES,
  MOROCCAN_GRADES,
  PERFORMANCE_RATING_LABELS,
  PerformanceRating,
  SPOUSE_OCCUPATION_LABELS,
  SpouseOccupation,
  RESPONSIBILITY_LABELS,
  AdministrativeResponsibility,
  RegistreLogement
} from '../types/housing';
import { calculateBareme } from '../utils/bareme';
import { useAuth } from '../context/AuthContext';
import { getDossierDocumentUrl, fetchLogements, createLogement } from '../api/client';
import Swal from 'sweetalert2';
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
  attestationNonPropriete: '7. شهادة عدم امتلاك السكن (مصلحة الضريبة)',
  ficheVisite: 'بطاقة معاينة السكن (المطبوع 5)',
  ficheControle: 'بطاقة مراقبة السكن (المطبوع 9)',
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
      aref: MOROCCAN_AREFS[0], // الأكاديمية الجهوية للتربية والتكوين - جهة الشرق
      responsibility: 'none'
    }
  );

  // Situation Familiale State
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamilialeInfo>(() => {
    const stored = initialDossier?.situationFamiliale;
    if (stored) {
      // الملفات المحفوظة سابقا لا تعرف إلا "موظف(ة) أم لا": تُحوَّل مرة واحدة إلى مهنة صريحة.
      return {
        ...stored,
        spouseOccupation:
          stored.spouseOccupation ??
          (stored.maritalStatus === 'marie'
            ? stored.spouseIsPublicOfficial
              ? 'public_sector'
              : 'no_work'
            : undefined),
        soleFamilyIncome: stored.soleFamilyIncome ?? false,
      };
    }
    return {
      maritalStatus: 'marie',
      spouseName: '',
      spouseIsPublicOfficial: false,
      spouseOccupation: 'no_work',
      soleFamilyIncome: false,
      spouseAdministration: '',
      spousePPR: '',
      childrenCount: 2
    };
  });

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
      pvInstallation: { present: true },
      attestationNonPropriete: { present: false },
      ficheVisite: { present: false },
      ficheControle: { present: false }
    }
  );

  // Auto calculate bareme
  const bareme = calculateBareme(candidate, situationFamiliale, housingRequest);

  // المذكرة 40: السكن الوظيفي يُسند بحكم المسؤولية والمهام، بدون شبكة تنقيط ولا ترتيب.
  const isFonction = housingRequest.housingType === 'fonction';

  const conditionsAnswered = ELIGIBILITY_QUESTIONS.every((q) => candidate[q.key] !== undefined);
  const conditionsMet = meetsEligibilityConditions(candidate);
  const failedConditions = ELIGIBILITY_QUESTIONS.filter((q) =>
    q.key === 'worksInSameCity' ? candidate[q.key] === false : candidate[q.key] === true
  ).map((q) => q.failLabel);

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
  // (step 2), so the vacant register entry of that établissement is the link.
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

  // One birth certificate (عقد ازدياد) per child, staged under
  // `situationFamilialeEnfants_N` and uploaded together on save.
  const handleChildCertFileChange = (childNumber: number, file: File | null) => {
    setDocFiles(prev => ({ ...prev, [`situationFamilialeEnfants_${childNumber}`]: file || undefined }));
    if (file) {
      setDocuments(prev => ({
        ...prev,
        situationFamiliale: { ...prev.situationFamiliale, childrenCertificates: true, present: true },
      }));
    }
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
    const childCertNames = (documents.situationFamiliale.childrenCertificatesFileNames || []).filter(Boolean);
    const files = (groupKeys ?? [])
      .filter((k) => nameOf(k))
      .flatMap((k) => {
        // Multiple birth certificates: expand into one carousel entry per child.
        if (k === 'situationFamilialeEnfants' && childCertNames.length > 1) {
          return childCertNames.map((nm, i) => ({
            key: `${k}_${i + 1}`,
            name: `ج. عقد الازدياد ${i + 1}`,
            fileName: nm,
            url: getDossierDocumentUrl(dossierId, k, i),
          }));
        }
        return [{ key: k, name: DOC_LABELS_AR[k] ?? nameOf(k)!, fileName: nameOf(k), url: getDossierDocumentUrl(dossierId, k) }];
      });
    const clickedEntry = files.find((e) => e.key === clickedKey)
      ?? (/^situationFamilialeEnfants_\d+$/.test(clickedKey) && childCertNames.length <= 1
        ? files.find((e) => e.key === 'situationFamilialeEnfants')
        : undefined);
    const idx = Math.max(0, files.findIndex((e) => e.key === clickedEntry?.key));
    setPreviewDocData({
      id: clickedKey,
      titleAr: clickedEntry?.name ?? DOC_LABELS_AR[clickedKey] ?? clickedKey,
      descAr: '',
      isPresent: true,
      legalizationNeeded: false,
      fileName: clickedEntry?.fileName ?? nameOf(clickedKey),
      fileUrl: clickedEntry?.url ?? getDossierDocumentUrl(dossierId, clickedKey),
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
    const status = (documents[key] ?? { present: false }) as { present: boolean; fileName?: string };
    const uploadedName = status.fileName;

    return (
      <div className="flex w-full flex-col gap-2 sm:w-52">
        <label className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-700">
          <span className="text-[11px] font-medium">الوثيقة متوفرة</span>
        <input
          type="checkbox"
          checked={status.present}
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

  const warnField = (message: string) =>
    Swal.fire({
      icon: 'warning',
      title: 'تحقق من المعطيات',
      text: message,
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#059669',
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!candidate.fullNameAr.trim() || !candidate.ppr.trim()) {
      warnField('يرجى ملء الحقول الإلزامية: الاسم الكامل ورقم التأجير (PPR)');
      setActiveStep(2);
      return;
    }

    if (!candidate.currentEtablissement.trim()) {
      warnField('يرجى تحديد مقر العمل الحالي (المؤسسة التعليمية)');
      setActiveStep(2);
      return;
    }

    if (!candidate.commune.trim()) {
      warnField('يرجى تحديد المدينة \\ القرية التي تتواجد بها المؤسسة');
      setActiveStep(2);
      return;
    }

    if (housingRequest.targetEtablissement.trim() !== candidate.currentEtablissement.trim()) {
      warnField('يجب أن يكون السكن المطلوب داخل نفس المؤسسة التي يعمل بها الموظف');
      setActiveStep(2);
      return;
    }

    if (
      !candidate.currentEtablissement.trim() ||
      candidate.currentEtablissement.trim() === candidate.fullNameAr.trim()
    ) {
      warnField('المؤسسة التعليمية التي يوجد بها السكن يجب أن تكون اسم المؤسسة، وليس اسم المترشح. يرجى تصحيح حقل "مقر العمل الحالي" في الخطوة 2.');
      setActiveStep(2);
      return;
    }

    // المرحلة أ من المذكرة 40: ملف السكن الإداري لا يُقبل بدون شروط الترشح
    // وبدون شهادة عدم امتلاك السكن السارية الصلاحية (شهران من تاريخها).
    if (!isFonction) {
      if (!conditionsAnswered) {
        warnField('يرجى الإجابة على أسئلة شروط الترشح الثلاثة (الخطوة 2) قبل إيداع الملف.');
        setActiveStep(2);
        return;
      }
      if (!documents.attestationNonPropriete?.present) {
        warnField('شهادة عدم امتلاك السكن (مصالح الضريبة) وثيقة إلزامية في ملف الترشح: يرجى ضمّها في الخطوة 4.');
        setActiveStep(4);
        return;
      }
      if (isNonOwnershipCertificateExpired(documents.attestationNonPropriete?.date)) {
        warnField('انتهت صلاحية شهادة عدم امتلاك السكن: عمرها أكثر من شهرين. يجب تجديد الوثيقة قبل إيداع الملف.');
        setActiveStep(4);
        return;
      }
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
      bareme: isFonction
        ? {
            seniorityGeneralPts: 0,
            seniorityEtablissementPts: 0,
            scalePts: 0,
            maritalPts: 0,
            soleIncomePts: 0,
            childrenPts: 0,
            responsibilityBonus: 0,
            performancePts: 0,
            ruralBonusPts: 0,
            totalPts: 0
          }
        : bareme,
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
        isComplete: requiredDocumentKeys(housingRequest.housingType, situationFamiliale.maritalStatus).every(
          (k) => (documents[k] as { present: boolean } | undefined)?.present
        ),
        bordereauNumber: `BORD/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`
      }
    };

    onSave(savedDossier, docFiles);
  };

  const steps = [
    { number: 1, label: 'السكن المطلوب', icon: Home },
    { number: 2, label: 'معلومات المترشح', icon: User },
    { number: 3, label: 'الوضع العائلي', icon: Users },
    { number: 4, label: isFonction ? 'الوثائق المطلوبة' : situationFamiliale.maritalStatus === 'celibataire' ? 'الوثائق الست المطلوبة' : 'الوثائق السبع المطلوبة', icon: FileCheck },
    ...(isFonction
      ? []
      : [{ number: 5, label: 'احتساب شبكة التنقيط', icon: Calculator }])
  ];

  useEffect(() => {
    if (isFonction && activeStep === 5) setActiveStep(4);
  }, [isFonction, activeStep]);

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
      <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-6">
        {/* STEP 2: معلومات المترشح */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>2. البيانات الشخصية والإدارية للموظف(ة)</span>
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
                    <option value={7}>السلم 7</option>
                    <option value={8}>السلم 8</option>
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
                <span className="text-[10px] text-slate-400">6 أشطر: 1-4 (1) · 5-9 (2) · 10-14 (3) · 15-19 (4) · 20-24 (5) · 25 فأكثر (6)</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الأقدمية بنفس المدينة (سنوات)</label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={candidate.seniorityEtablissement}
                  onChange={(e) => setCandidate({ ...candidate, seniorityEtablissement: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400">من سنة إلى 5 (1 نقطة) · 6 سنوات فأكثر (2 نقط)</span>
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

              {/* المرحلة أ من المذكرة 40: شروط الترشح الثلاثة */}
              {!isFonction && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
                  <div>
                    <div className="font-bold text-slate-900">شروط الترشح (المرحلة أ)</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      يجب أن تجيب عنها مصلحة الموارد البشرية قبل إدراج اسم المترشح(ة) في لائحة المتبارين.
                    </p>
                  </div>

                  {ELIGIBILITY_QUESTIONS.map((q) => (
                    <div key={q.key} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[11px] text-slate-700">{q.label}</span>
                      <div className="flex items-center gap-4 shrink-0">
                        {[true, false].map((answer) => (
                          <label key={String(answer)} className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                            <input
                              type="radio"
                              name={q.key}
                              checked={candidate[q.key] === answer}
                              onChange={() => setCandidate({ ...candidate, [q.key]: answer } as CandidateInfo)}
                            />
                            <span>{answer ? 'نعم' : 'لا'}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {!conditionsAnswered ? (
                    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                      لم تُجب بعد عن شروط الترشح الثلاثة: لا يمكن اعتبار الملف مستوفياً للشروط.
                    </div>
                  ) : !conditionsMet ? (
                    <div className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2">
                      الملف غير مستوفٍ لشروط الترشح: {failedConditions.join(' · ')}
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                      المترشح(ة) مستوف(ة) لشروط الترشح المنصوص عليها في المذكرة 40.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: الوضع العائلي */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{candidate.gender === 'female' ? '3. الوضع العائلي للمترشحة (Situation Familiale)' : '3. الوضع العائلي للمترشح (Situation Familiale)'}{!isFonction && ' والوثائق المثبتة'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isFonction
                  ? 'في مسطرة السكن الوظيفي تُكتفى بالحالة العائلية (متزوج(ة) أو أعزب) للمعلومة: لا نقطة عن الزوج(ة) ولا عن الأطفال، ولا تُطلب وثائق الوضع العائلي.'
                  : 'حسب المذكرة 40: أعزب = 0 نقطة، 3 نقط عن الزوج(ة) الذي(ة) لا يمارس(ت) مهنة، نقطتان عن الراتب الوحيد، ونقطة عن كل طفل في حدود 3 أطفال.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">الحالة العائلية للمترشح(ة)</label>
                <select
                  value={situationFamiliale.maritalStatus}
                  onChange={(e) => {
                    const ms = e.target.value as any;
                    // الوظيفي لا يُنقَّط: تُكتفى بالحالة العائلية بدون معطيات الزوج(ة) والأطفال.
                    setSituationFamiliale({
                      ...situationFamiliale,
                      maritalStatus: ms,
                      ...(ms === 'celibataire'
                        ? { spouseIsPublicOfficial: false, spouseOccupation: undefined, childrenCount: 0 }
                        : {}),
                    });
                    setDocuments(prev => ({
                      ...prev,
                      situationFamiliale: { ...prev.situationFamiliale, present: ms === 'celibataire' ? true : prev.situationFamiliale.present },
                    }));
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="marie">{isFonction ? 'متزوج(ة)' : 'متزوج(ة)'}</option>
                  <option value="celibataire">{isFonction ? 'عازب(ة)' : 'عازب(ة) - 0 نقطة'}</option>
                  <option value="divorce">{isFonction ? 'مطلق(ة)' : 'مطلق(ة) - 0 نقطة'}</option>
                  <option value="veuf">{isFonction ? 'أرمل(ة)' : 'أرمل(ة) - 0 نقطة'}</option>
                </select>
              </div>

              {!isFonction && (
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
              )}

              {!isFonction && situationFamiliale.maritalStatus === 'marie' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      الوضعية المهنية لل{candidate.gender === 'female' ? 'زوج' : 'زوجة'}
                    </label>
                    <select
                      value={situationFamiliale.spouseOccupation ?? 'no_work'}
                      onChange={(e) => {
                        const occupation = e.target.value as SpouseOccupation;
                        setSituationFamiliale({
                          ...situationFamiliale,
                          spouseOccupation: occupation,
                          spouseIsPublicOfficial: occupation === 'public_sector',
                        });
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      {(Object.keys(SPOUSE_OCCUPATION_LABELS) as SpouseOccupation[]).map((k) => (
                        <option key={k} value={k}>{SPOUSE_OCCUPATION_LABELS[k]}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400">
                      3 نقط للزوج(ة) الذي(ة) لا يمارس(ت) مهنة · نقطتان إضافيتان عند الراتب الوحيد
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!situationFamiliale.soleFamilyIncome}
                      onChange={(e) => setSituationFamiliale({ ...situationFamiliale, soleFamilyIncome: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600"
                    />
                    <span>الأسرة لا تعتمد إلا على راتب وحيد (المعيار: الراتب الوحيد - 2 نقط)</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: مواصفات السكن المطلوب */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" />
                <span>1. مواصفات السكن الإداري أو الوظيفي المطلوب</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تحديد طبيعة السكن طبقاً للمذكرة 40 (وظيفي بحكم ضرورة المهام أم إداري حسب الاستحقاق).
              </p>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[11px] leading-relaxed text-emerald-900">
              <span className="font-bold">نوع السكن يحدد المسطرة:</span>
              <ul className="mt-1 list-disc space-y-0.5 pr-4">
                <li>
                  <strong>السكن الوظيفي</strong>: لا تباري ولا لجنة إسناد ولا شبكة تنقيط — يُسند تلقائياً بمجرد التعيين في المنصب، ويكتفي الملف بالمطبوع 3 (الالتزام والتصريح بالشرف) وببطاقتي المعاينة والمراقبة (المطبوعان 5 و9).
                </li>
                <li>
                  <strong>السكن الإداري</strong>: ملف ترشيح كامل من ست وثائق، مرتَّب فيه المترشح بشبكة التنقيط المعيارية أمام لجنة الإسناد.
                </li>
              </ul>
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
                    ? 'يُسند بحكم المسؤولية والمهام للمدير والحارس العام والنظّار والمقتصدين: معفى من شبكة التنقيط ومن الترتيب.'
                    : 'يمنح لباقي الأطر التعليمية والإدارية بناءً على التنافس وشبكة التنقيط.'}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المؤسسة التعليمية التي يوجد بها السكن *</label>
                <input
                  type="text"
                  required
                  readOnly
                  placeholder="يُحدَّد تلقائياً بعد إدخال مقر العمل الحالي في الخطوة 2"
                  value={housingRequest.targetEtablissement}
                  className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-semibold cursor-not-allowed placeholder:font-normal placeholder:text-blue-400"
                />
                <span className="text-[10px] text-slate-500">
                  {housingRequest.targetEtablissement
                    ? 'يجب أن يطابق مقر العمل الحالي للموظف.'
                    : 'ينتقل السكن تلقائياً إلى مؤسسة عمل المترشح(ة) كما تُدخلها في الخطوة 2.'}
                </span>
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

        {/* STEP 4: الوثائق الإلزامية (مختلفة حسب نوع السكن) */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {isFonction
                    ? '4. الوثائق الثلاث المطلوبة في مسطرة السكن الوظيفي'
                    : `4. التحقق من الوثائق ${situationFamiliale.maritalStatus === 'celibataire' ? 'الست' : 'السبع'} الإلزامية المكونة للملف (Dossier de Demande)`}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isFonction
                  ? 'لا تباري ولا لجنة إسناد ولا شبكة تنقيط: يُكتفى بالالتزام (المطبوع 3) وباستكمال بطاقتي المعاينة والمراقبة (المطبوعان 5 و9) بعد الترخيص بالسكن.'
                  : situationFamiliale.maritalStatus === 'celibataire'
                  ? 'المترشح(ة) عازب(ة): لا تُطلب وثائق الوضع العائلي. يكفي 6 وثائق إلزامية.'
                  : '6 وثائق إلزامية مضافاً إليها شهادة عدم امتلاك السكن. تدقق بمصلحة الموارد البشرية بالمديرية الإقليمية (DP) قبل الإحالة على الأكاديمية الجهوية (AREF).'}
              </p>
            </div>

            {isFonction && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_13rem]">
                  <div className="min-w-0 space-y-1">
                    <div className="font-bold text-slate-900">1. مطبوع الالتزام والتصريح بالشرف (المطبوع رقم 3)</div>
                    <div className="text-slate-500 text-[11px]">
                      التزام مصحح الإمضاء يُقر فيه المستفيد باحترام بنود المذكرة 40 والتعهد بإفراغ السكن فور انتهاء المهام الموجبة للاستفادة.
                    </div>
                  </div>
                  {renderDocFileControl('engagementHonneur')}
                </div>

                <div className="grid grid-cols-1 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_13rem]">
                  <div className="min-w-0 space-y-1">
                    <div className="font-bold text-slate-900">2. بطاقة معاينة السكن (المطبوع رقم 5)</div>
                    <div className="text-slate-500 text-[11px]">
                      معاينة سكنية للمترشح(ة) تُرفق بالملف وتُوقَّع من طرف المعني(ة) والمكلف(ة) بتدبير السكنيات.
                    </div>
                  </div>
                  {renderDocFileControl('ficheVisite')}
                </div>

                <div className="grid grid-cols-1 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_13rem]">
                  <div className="min-w-0 space-y-1">
                    <div className="font-bold text-slate-900">3. بطاقة مراقبة السكن (المطبوع رقم 9)</div>
                    <div className="text-slate-500 text-[11px]">
                      بطاقة مراقبة للسكن الوظيفي توقع من طرف المستفيد والمكلف بتدبير السكن على صعيد النيابة أو المديرية الإقليمية.
                    </div>
                  </div>
                  {renderDocFileControl('ficheControle')}
                </div>
              </div>
            )}

            {!isFonction && (
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
                  // عقود الازدياد: خانة رفع مستقلة لكل طفل (عدد الأطفال > 0).
                  const isChildrenRow = sub.flagKey === 'childrenCertificates' && situationFamiliale.childrenCount > 0;
                  const uploadedChildNames = documents.situationFamiliale.childrenCertificatesFileNames || [];
                  return (
                    <div key={sub.fileKey} className="grid grid-cols-1 items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs sm:grid-cols-[minmax(0,1fr)_13rem]">
                      <div className="min-w-0 space-y-1">
                        <div className="font-semibold text-slate-800">{sub.titleAr}</div>
                        <div className="text-slate-500 text-[11px]">
                          {isChildrenRow
                            ? `عقد ازدياد لكل طفل معال: ${situationFamiliale.childrenCount} عقود.`
                            : sub.detailAr}
                        </div>
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
                        {isChildrenRow ? (
                          <div className="space-y-2">
                            {Array.from({ length: situationFamiliale.childrenCount }, (_, i) => i + 1).map((n) => {
                              const stageKey = `situationFamilialeEnfants_${n}`;
                              const stagedChild = docFiles[stageKey];
                              const uploadedChild = uploadedChildNames[n - 1];
                              return (
                                <div key={stageKey} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                                  <div className="mb-1.5 text-[11px] font-bold text-slate-700">عقد الازدياد رقم {n}</div>
                                  <input
                                    type="file"
                                    id={`dossier-file-${stageKey}`}
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={(e) => handleChildCertFileChange(n, e.target.files?.[0] || null)}
                                    className="peer sr-only"
                                  />
                                  <label
                                    htmlFor={`dossier-file-${stageKey}`}
                                    className="flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50"
                                  >
                                    <Upload className="h-3.5 w-3.5 text-emerald-700" />
                                    <span>اختيار عقد الازدياد</span>
                                  </label>
                                  {stagedChild ? (
                                    <span className="mt-1 block truncate text-left text-[10px] text-emerald-700" title={stagedChild.name}>{stagedChild.name}</span>
                                  ) : uploadedChild && initialDossier?.id ? (
                                    <button
                                      type="button"
                                      onClick={() => openDocPreview(stageKey, SITUATION_FAMILIALE_SUB_DOCS.map((s) => s.fileKey))}
                                      className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                                    >
                                      <span>&#128270;</span> معاينة العقد
                                    </button>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <>
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
                          </>
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

              {/* Doc 7: شهادة عدم امتلاك السكن (المرحلة أ من المذكرة 40)، صالحة شهرين من تاريخها */}
              <div className="grid grid-cols-1 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_13rem]">
                <div className="min-w-0 space-y-1">
                  <div className="font-bold text-slate-900">7. شهادة عدم امتلاك السكن (مصالح الضريبة)</div>
                  <div className="text-slate-500 text-[11px]">
                    شهادة إدارية من مصالح الضريبة تثبت أن المترشح لا يتوفر على سكن في ملكيته،
                    لا يتجاوز عمرها شهرين (2) عند إيداع الملف.
                  </div>
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">تاريخ الشهادة</label>
                    <input
                      type="date"
                      value={documents.attestationNonPropriete?.date || ''}
                      onChange={(e) => setDocuments({
                        ...documents,
                        attestationNonPropriete: {
                          ...(documents.attestationNonPropriete as any),
                          present: documents.attestationNonPropriete?.present ?? false,
                          date: e.target.value,
                        }
                      } as RequiredDocumentsChecklist)}
                      className="w-full sm:w-40 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  {documents.attestationNonPropriete?.present && !documents.attestationNonPropriete?.date && (
                    <div className="text-[10px] font-semibold text-amber-700">
                      حدد تاريخ الشهادة للتحقق من صلاحيتها.
                    </div>
                  )}
                  {isNonOwnershipCertificateExpired(documents.attestationNonPropriete?.date) && (
                    <div className="flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1.5 text-[10px] font-semibold text-rose-700">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      انتهت صلاحية الشهادة: عمرها أكثر من شهرين، يجب تجديد قبل إيداع الملف.
                    </div>
                  )}
                </div>
                {renderDocFileControl('attestationNonPropriete')}
              </div>
            </div>
            )}
          </div>
        )}

        {/* STEP 5: احتساب شبكة التنقيط */}
        {activeStep === 5 && !isFonction && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  <span className="text-[10px] text-slate-400">جيد جدا 4 · جيد 2 · مستحسن 1 · دون المستحسن 0</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    المسؤولية الإدارية (المعيار 5)
                  </label>
                  <select
                    value={candidate.responsibility ?? 'none'}
                    onChange={(e) => setCandidate({ ...candidate, responsibility: e.target.value as AdministrativeResponsibility })}
                    className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {(Object.keys(RESPONSIBILITY_LABELS) as AdministrativeResponsibility[]).map((k) => (
                      <option key={k} value={k}>{RESPONSIBILITY_LABELS[k]}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400">رئيس قسم 3 نقط · رئيس مصلحة 2 نقط</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!candidate.isRuralArea}
                    onChange={(e) => setCandidate({ ...candidate, isRuralArea: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span>المؤسسة بالوسط القروي</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
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
                  <div className="text-[10px] text-slate-400">6 أشطر (1 إلى 6 نقط)</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">الأقدمية بنفس المدينة</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">{bareme.seniorityEtablissementPts}</div>
                  <div className="text-[10px] text-slate-400">1-5 (1) · 6 فأكثر (2)</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">التحملات العائلية</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">
                    {bareme.maritalPts + bareme.soleIncomePts + bareme.childrenPts}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {bareme.childrenPts} أبناء · {bareme.maritalPts} زوج(ة) · {bareme.soleIncomePts} راتب وحيد
                  </div>
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

            {activeStep < (isFonction ? 4 : 5) ? (
              <button
                key="next-step"
                type="button"
                onClick={() => setActiveStep(activeStep + 1)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                المتابعة إلى الخطوة {activeStep + 1}
              </button>
            ) : (
              // type="button" : تفادي حفظ تلقائي عند إعادة استخدام نفس العقدة من زر «المتابعة»
              <button
                key="save-dossier"
                type="button"
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
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
