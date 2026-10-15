import React, { useState } from 'react';
import { 
  FileCheck, 
  FileText,
  CheckCircle2,
  XCircle, 
  Eye, 
  Stamp, 
  Paperclip, 
  AlertTriangle,
  Info,
  Calendar,
  Building,
  Printer
} from 'lucide-react';
import { DocumentPreviewCard, DocumentPreviewCardData } from './DocumentPreviewCard';
import { HousingDossier, requiredDocumentKeys, isNonOwnershipCertificateExpired } from '../types/housing';
import { getDossierDocumentUrl } from '../api/client';

interface DocumentChecklistViewProps {
  dossier: HousingDossier;
  onUpdateDossier: (updated: HousingDossier) => void;
  onNavigateToDocumentGenerator: (docType: string) => void;
}

export const DocumentChecklistView: React.FC<DocumentChecklistViewProps> = ({
  dossier,
  onUpdateDossier,
  onNavigateToDocumentGenerator
}) => {
  const [previewDoc, setPreviewDoc] = useState<DocumentPreviewCardData | null>(null);

  const toggleDocPresence = (docKey: keyof typeof dossier.documents) => {
    if (docKey === 'situationFamiliale') {
      const updated = {
        ...dossier,
        documents: {
          ...dossier.documents,
          situationFamiliale: {
            ...dossier.documents.situationFamiliale,
            present: !dossier.documents.situationFamiliale.present
          }
        }
      };
      onUpdateDossier(updated);
    } else {
      const currentDoc = dossier.documents[docKey] ?? { present: false };
      const updated = {
        ...dossier,
        documents: {
          ...dossier.documents,
          [docKey]: {
            ...currentDoc,
            present: !currentDoc.present
          }
        }
      };
      onUpdateDossier(updated);
    }
  };

  // مسطرة السكن الوظيفي أخف: المطبوع 3 + بطاقتا المعاينة والمراقبة (5 و9)،
  // بدون ملف تباري ولا شبكة تنقيط.
  const isFonction = dossier.housingRequest.housingType === 'fonction';

  const requiredDocumentsMeta = ([
    {
      id: 'demandeManuscrite',
      titleAr: '1. الطلب الخطي (Demande manuscrite)',
      descAr: 'طلب موجه إلى السيد المدير الإقليمي، يحدد فيه الموظف رغبته في الاستفادة من السكن الوظيفي أو الإداري مع ذكر إطاره، مهامه، ومقر عمله الحالي.',
      isMandatory: true,
      data: dossier.documents.demandeManuscrite,
      canGenerate: true,
      generatorKey: 'demande',
      legalizationNeeded: false
    },
    {
      id: 'copieCIN',
      titleAr: '2. نسخة من بطاقة التعريف الوطنية (Copie de la CIN)',
      descAr: 'نسخة طبق الأصل من بطاقة التعريف الوطنية الإلكترونية للمستفيد سارية الصلاحية.',
      isMandatory: true,
      data: dossier.documents.copieCIN,
      canGenerate: false,
      legalizationNeeded: true
    },
    {
      id: 'attestationTravail',
      titleAr: '3. شهادة العمل (Attestation de travail) حديثة',
      descAr: 'تثبت وضعية الموظف الإدارية، إطاره، سلمه، مقر عمله الحالي، وتاريخ تعيينه وتكليفه بالمهام.',
      isMandatory: true,
      data: dossier.documents.attestationTravail,
      canGenerate: false,
      legalizationNeeded: false
    },
    {
      id: 'situationFamiliale',
      titleAr: '4. الوضع العائلي (Situation Familiale)',
      descAr: 'نسخة من عقد الزواج (إن وجد) + شهادة إدارية تثبت وضعية عمل الزوج/الزوجة (إذا كان موظفاً) + بيان عدد الأطفال المعالين (عقود ازدياد).',
      isMandatory: true,
      data: dossier.documents.situationFamiliale,
      canGenerate: true,
      generatorKey: 'situation',
      legalizationNeeded: false
    },
    {
      id: 'engagementHonneur',
      titleAr: "5. مطبوع الالتزام والتصريح بالشرف (Engagement & Déclaration sur l'honneur)",
      descAr: "التزام مصحح الإمضاء يقر فيه المستفيد باحترام بنود المذكرة الوزارية رقم 40 والتعهد بإفراغ السكن فور انتهاء المهام الموجبة للاستفادة.",
      isMandatory: true,
      data: dossier.documents.engagementHonneur,
      canGenerate: true,
      generatorKey: 'engagement',
      legalizationNeeded: true
    },
    {
      id: 'pvInstallation',
      titleAr: "6. محضر الالتحاق بالمؤسسة (PV d'installation)",
      descAr: 'يثبت تعيين الموظف الفعلي بالمؤسسة التعليمية التي يوجد بها السكن المطلوب واستلام المهام التربوية أو الإدارية.',
      isMandatory: true,
      data: dossier.documents.pvInstallation,
      canGenerate: true,
      generatorKey: 'pv_installation',
      legalizationNeeded: false
    },
    {
      id: 'attestationNonPropriete',
      titleAr: "7. شهادة عدم امتلاك السكن (مصالح الضريبة)",
      descAr: 'شهادة إدارية من مصالح الضريبة تثبت أن المترشح لا يتوفر على سكن في ملكيته؛ لا يتجاوز عمرها شهرين (2) عند إيداع الملف.',
      isMandatory: true,
      data: dossier.documents.attestationNonPropriete ?? { present: false },
      canGenerate: false,
      legalizationNeeded: false
    },
    {
      id: 'ficheVisite',
      titleAr: "2. بطاقة معاينة السكن (المطبوع رقم 5)",
      descAr: 'بطاقة معاينة السكن الوظيفي تُوقَّع من طرف المستفيد والمكلف(ة) بتدبير السكنيات، وتضم ضمن الوثائق المكونة للملف.',
      isMandatory: true,
      data: dossier.documents.ficheVisite ?? { present: false },
      canGenerate: true,
      generatorKey: 'official_5',
      legalizationNeeded: false
    },
    {
      id: 'ficheControle',
      titleAr: "3. بطاقة مراقبة السكن (المطبوع رقم 9)",
      descAr: 'بطاقة مراقبة السكن توقع من طرف المستفيد والمكلف بتدبير السكن على صعيد النيابة أو المديرية الإقليمية.',
      isMandatory: true,
      data: dossier.documents.ficheControle ?? { present: false },
      canGenerate: true,
      generatorKey: 'official_9',
      legalizationNeeded: false
    }
  ] as any[]).filter((doc) =>
    (requiredDocumentKeys(dossier.housingRequest.housingType, dossier.situationFamiliale.maritalStatus) as string[]).includes(doc.id)
  ).map((doc, idx) => ({ ...doc, titleAr: doc.titleAr.replace(/^\s*\d+\.\s*/, `${idx + 1}. `) }));

  const presentCount = requiredDocumentsMeta.filter(doc => doc.data.present).length;
  const totalDocs = requiredDocumentsMeta.length;
  // شهادة عدم امتلاك السكن لا تُحتسب ضمن اللازمة إن كان عمرها أكثر من شهرين.
  const certificateExpired = isNonOwnershipCertificateExpired(dossier.documents.attestationNonPropriete?.date);
  const isComplete = presentCount === totalDocs && !certificateExpired;

  return (
    <>
    <div className="space-y-6">
      {/* Overview status box */}
      <div className={`p-4 rounded-xl border ${
        isComplete 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
          : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
              <h3 className="font-bold text-sm">
                {isComplete
                  ? isFonction
                    ? 'ملف السكن الوظيفي مكتمل الوثائق'
                    : 'الملف الإداري مكتمل بجميع الوثائق المطلوبة'
                  : 'ملف الترشيح غير مكتمل'}
              </h3>
            </div>
            <p className="text-xs opacity-90">
              {isComplete 
                ? isFonction
                  ? 'تم استيفاء وثائق مسطرة السكن الوظيفي (الالتزام + بطاقتا المعاينة والمراقبة). لا تباري ولا شبكة تنقيط: الملف يُحال للتأشير ثم الترخيص بالسكن.'
                  : 'تم استيفاء جميع الوثائق المنصوص عليها بالمذكرة الوزارية رقم 40. الملف مؤهل للإحالة على اللجنة الإقليمية بالمديرية (DP).' 
                : certificateExpired && presentCount === totalDocs
                  ? 'كل الوثائق مرفقة، لكن شهادة عدم امتلاك السكن انتهت صلاحيتها (أكثر من شهرين): يجب تجديد الوثيقة قبل الإحالة على اللجنة.' 
                  : `تم التحقق من ${presentCount} وثائق من أصل ${totalDocs}. يرجى توفير الوثائق الناقصة قبل إرسال الملف للأكاديمية.`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center bg-white/70 py-1.5 px-3 rounded-lg border border-slate-200">
              <div className="text-lg font-mono font-bold leading-tight">{presentCount} / {totalDocs}</div>
              <div className="text-[10px] text-slate-600">وثائق جاهزة</div>
            </div>

            <button
              onClick={() => onNavigateToDocumentGenerator('all')}
              className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة حزمة الملف كاملة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Documents List (المذكرة 40) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <span>قائمة الوثائق الإلزامية لتكوين ملف الترشيح (المذكرة الوزارية 40)</span>
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {requiredDocumentsMeta.map((doc, idx) => {
            const isPresent = doc.data.present;

            return (
              <div
                key={doc.id}
                className={`p-4 rounded-xl border transition-all ${
                  isPresent
                    ? 'bg-white border-slate-200'
                    : 'bg-white border-amber-200 bg-amber-50/20'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left (RTL Start): Document details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{doc.titleAr}</span>
                      
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>متوفر بالملف</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <XCircle className="w-3 h-3" />
                          <span>وثيقة ناقصة / مطلوبة</span>
                        </span>
                      )}

                      {doc.legalizationNeeded && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          <Stamp className="w-2.5 h-2.5" />
                          <span>يلزم تصحيح الإمضاء (Légalisation)</span>
                        </span>
                      )}

                      {doc.id === 'attestationNonPropriete' && (() => {
                        const issuedAt = (doc.data as any).date as string | undefined;
                        const expired = isNonOwnershipCertificateExpired(issuedAt);
                        return (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            expired
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : issuedAt
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <Calendar className="w-2.5 h-2.5" />
                            <span>
                              {expired
                                ? 'انتهت صلاحيتها: عمرها أكثر من شهرين'
                                : issuedAt
                                  ? `صادرة بتاريخ ${issuedAt} (صالحة)`
                                  : 'تاريخ الإصدار غير محدد'}
                            </span>
                          </span>
                        );
                      })()}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {doc.descAr}
                    </p>

                    {/* Sub-details for specific document types */}
                    {doc.id === 'situationFamiliale' && (
                      <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                        <span className={`px-2 py-0.5 rounded ${
                          dossier.documents.situationFamiliale.marriageCert ? 'bg-slate-100 text-slate-800' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {dossier.documents.situationFamiliale.marriageCert ? '✓ عقد الزواج مرفق' : '✗ عقد الزواج مفقود'}
                        </span>
                        <span className={`px-2 py-0.5 rounded ${
                          dossier.documents.situationFamiliale.spouseAttestation ? 'bg-slate-100 text-slate-800' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {dossier.documents.situationFamiliale.spouseAttestation ? '✓ شهادة عمل الزوج(ة) مرفقة' : '✗ شهادة عمل الزوج(ة) مفقودة'}
                        </span>
                        <span className={`px-2 py-0.5 rounded ${
                          dossier.documents.situationFamiliale.childrenCertificates ? 'bg-slate-100 text-slate-800' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {dossier.documents.situationFamiliale.childrenCertificates ? '✓ بيان الأطفال المعالين مرفق' : '✗ بيان الأطفال المعالين مفقود'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          عدد الأطفال المعالين: {dossier.situationFamiliale.childrenCount}
                        </span>
                        {dossier.situationFamiliale.spouseIsPublicOfficial && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                            {dossier.candidate.gender === 'female' ? 'الزوج موظف:' : 'الزوجة موظفة:'} {dossier.situationFamiliale.spouseAdministration || 'قطاع عام'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Attached sub-file names for situation familiale */}
                    {doc.id === 'situationFamiliale' && (
                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        {dossier.documents.situationFamiliale.marriageCertFileName && (
                          <div>📄 عقد الزواج: <span className="font-mono text-emerald-700">{dossier.documents.situationFamiliale.marriageCertFileName}</span></div>
                        )}
                        {dossier.documents.situationFamiliale.spouseAttestationFileName && (
                          <div>📄 شهادة عمل الزوج(ة): <span className="font-mono text-emerald-700">{dossier.documents.situationFamiliale.spouseAttestationFileName}</span></div>
                        )}
                        {dossier.documents.situationFamiliale.childrenCertificatesFileName && (
                          <div>📄 بيان الأطفال المعالين: <span className="font-mono text-emerald-700">{dossier.documents.situationFamiliale.childrenCertificatesFileName}</span></div>
                        )}
                      </div>
                    )}

                    {/* Attached file badge */}
                    {'fileName' in doc.data && doc.data.fileName && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        <span>الملف الرقمي المرفق:</span>
                        <span className="font-mono text-emerald-700 font-medium">{doc.data.fileName}</span>
                      </div>
                    )}

                    {/* Notes if any */}
                    {'notes' in doc.data && doc.data.notes && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                        <strong>ملاحظة التدقيق:</strong> {doc.data.notes}
                      </div>
                    )}
                  </div>

                  {/* Right (RTL End): Actions */}
                  <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                    {/* ── معاينة button ── */}
                    <button
                      onClick={() => {
                        const sf = dossier.documents.situationFamiliale;
                        setPreviewDoc({
                          id: doc.id,
                          titleAr: doc.titleAr,
                          descAr: doc.descAr,
                          isPresent,
                          legalizationNeeded: doc.legalizationNeeded,
                          isLegalized: ('isLegalized' in doc.data ? (doc.data as any).isLegalized : undefined),
                          fileName: ('fileName' in doc.data ? doc.data.fileName : undefined),
                          date: ('date' in doc.data ? doc.data.date : undefined),
                          notes: ('notes' in doc.data ? doc.data.notes : undefined),
                          fileUrl: ('fileName' in doc.data && doc.data.fileName)
                            ? getDossierDocumentUrl(dossier.id, doc.id)
                            : undefined,
                          files: doc.id === 'situationFamiliale' ? [
                            sf.marriageCertFileName && { name: 'أ. عقد الزواج', fileName: sf.marriageCertFileName, url: getDossierDocumentUrl(dossier.id, 'situationFamilialeContratMariage') },
                            sf.spouseAttestationFileName && { name: 'ب. شهادة عمل الزوج(ة)', fileName: sf.spouseAttestationFileName, url: getDossierDocumentUrl(dossier.id, 'situationFamilialeAttestationConjoint') },
                            ...(sf.childrenCertificatesFileNames && sf.childrenCertificatesFileNames.length > 1
                              ? sf.childrenCertificatesFileNames.map((fn, i) => ({ name: `ج. عقد الازدياد ${i + 1}`, fileName: fn, url: getDossierDocumentUrl(dossier.id, 'situationFamilialeEnfants', i) }))
                              : sf.childrenCertificatesFileName ? [{ name: 'ج. بيان عدد الأطفال المعالين', fileName: sf.childrenCertificatesFileName, url: getDossierDocumentUrl(dossier.id, 'situationFamilialeEnfants') }] : []),
                          ].filter(Boolean) as { name: string; fileName?: string; url?: string }[] : undefined,
                        });
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>معاينة</span>
                    </button>

                    <button
                      onClick={() => toggleDocPresence(doc.id as any)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        isPresent
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {isPresent ? 'إلغاء التأشير (غير متوفر)' : 'تأشير كـ متوفر بالملف'}
                    </button>

                    {doc.canGenerate && (
                      <button
                        onClick={() => onNavigateToDocumentGenerator(doc.generatorKey || '')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>تحرير وتوليد النموذج</span>
                      </button>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* ── Document Preview Card Modal ── */}
    {previewDoc && (
      <DocumentPreviewCard
        data={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    )}
  </>
  );
};
