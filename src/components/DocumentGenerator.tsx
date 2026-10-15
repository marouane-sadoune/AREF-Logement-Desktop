import React, { useEffect, useRef, useState } from 'react';
import { 
  Printer, 
  Download, 
  FileText, 
  CheckCircle, 
  Stamp, 
  Share2, 
  Building, 
  User, 
  Calendar,
  AlertCircle,
  PencilLine,
  RotateCcw
} from 'lucide-react';
import { HousingDossier } from '../types/housing';
import { PERFORMANCE_RATING_LABELS } from '../types/housing';
import { ArefOfficialHeader } from './ArefOfficialHeader';
import { OfficialFormSheet } from './OfficialFormSheets';

interface DocumentGeneratorProps {
  dossiers: HousingDossier[];
  selectedDossierId?: string;
  defaultDocType?: string;
}

const OVERRIDE_PREFIX = 'aref-doc-text:';

function readDocOverrides(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(OVERRIDE_PREFIX)) {
      out[key.slice(OVERRIDE_PREFIX.length)] = localStorage.getItem(key) || '';
    }
  }
  return out;
}

// النص محرَّر محلياً من طرف المستخدم: نُجرِّده من السكربتات ومعالِجات الأحداث قبل إعادة إدراجه.
function sanitizeDocHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  dossiers,
  selectedDossierId,
  defaultDocType = 'accord_attribution'
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    selectedDossierId || (dossiers.length > 0 ? dossiers[0].id : '')
  );
  const [activeDocType, setActiveDocType] = useState<string>(
    defaultDocType === 'all' ? 'accord_attribution' : defaultDocType
  );

  const activeDossier = dossiers.find((d) => d.id === selectedId) || dossiers[0];

  // تحرير نص الوثيقة: كل تعديل يُخزَّن لملف+نموذج بعينه ويُطبع بدل النص المولَّد.
  const [overrides, setOverrides] = useState<Record<string, string>>(readDocOverrides);
  const [editing, setEditing] = useState(false);
  const [bodyToken, setBodyToken] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const overrideKey = activeDossier ? `${activeDossier.id}:${activeDocType}` : '';

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || editing) return;
    const stored = overrideKey ? overrides[overrideKey] : undefined;
    if (stored !== undefined && el.innerHTML !== stored) el.innerHTML = stored;
  }, [overrideKey, overrides, editing, activeDossier, activeDocType]);

  const handlePrint = () => {
    window.print();
  };

  if (!activeDossier) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
        <p className="text-slate-500 text-xs">لا يوجد ملف ترشيح محدد لإنشاء الوثائق.</p>
      </div>
    );
  }

  const candidate = activeDossier.candidate;
  const family = activeDossier.situationFamiliale;
  const housing = activeDossier.housingRequest;
  const bareme = activeDossier.bareme;

  const commitEdit = () => {
    const el = bodyRef.current;
    if (!el || !editing) return;
    const html = sanitizeDocHtml(el.innerHTML);
    localStorage.setItem(OVERRIDE_PREFIX + overrideKey, html);
    setOverrides((prev) => ({ ...prev, [overrideKey]: html }));
  };

  const restoreOriginal = () => {
    localStorage.removeItem(OVERRIDE_PREFIX + overrideKey);
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[overrideKey];
      return next;
    });
    setBodyToken((t) => t + 1);
  };

  const switchTo = (select: () => void) => {
    commitEdit();
    setEditing(false);
    select();
  };

  const hasOverride = overrides[overrideKey] !== undefined;

  const docTypes = [
    { 
      id: 'accord_attribution', 
      label: 'رسالة الموافقة على إسناد سكن وظيفي (نموذج الأكاديمية)', 
      sub: 'Lettre d\'accord (Envoyée à la DP)',
      isHighlight: true
    },
    { id: 'demande', label: 'الطلب الخطي الموجه للمدير الإقليمي', sub: 'Demande Manuscrite' },
    { id: 'engagement', label: 'مطبوع الالتزام والتصريح بالشرف', sub: "Engagement (Note 40)" },
    { id: 'fiche_bareme', label: 'بطاقة المعلومات وشبكة التنقيط', sub: 'Fiche & Barème' },
    { id: 'recepisse', label: 'وصل إيداع الملف بالمديرية (DP)', sub: 'Récépissé de Dépôt' },
    { id: 'bordereau', label: 'جدول الإرسال إلى الأكاديمية (AREF)', sub: 'Bordereau d\'Envoi' },
    { id: 'pv_possession', label: 'محضر تسلّم السكن ومعاينة الأماكن', sub: 'PV Prise de Possession' },
    { id: 'official_1', label: 'المطبوع 1: طلب المشاركة في التباري', sub: 'Demande de participation' },
    { id: 'official_2', label: 'المطبوع 2: محضر لجنة الإسناد', sub: 'PV commission d\'attribution' },
    { id: 'official_3', label: 'المطبوع 3: التزام (وجوبا/مجانا/قانون)', sub: 'Engagement (obligatoire)' },
    { id: 'official_4', label: 'المطبوع 4: التزام (المسكنون بالفعل)', sub: 'Engagement (de facto)' },
    { id: 'official_5', label: 'المطبوع 5: بطاقة معاينة السكن', sub: 'Fiche d\'inspection' },
    { id: 'official_6', label: 'المطبوع 6: البطاقة رقم 1', sub: 'Fiche n°1 (logement créé)' },
    { id: 'official_7', label: 'المطبوع 7: البطاقة رقم 2', sub: 'Fiche n°2 (modifications)' },
    { id: 'official_8', label: 'المطبوع 8: بطاقة إشعار', sub: 'Fiche de notification' },
    { id: 'official_9', label: 'المطبوع 9: بطاقة مراقبة السكن', sub: 'Fiche de contrôle' }
  ];

  return (
    <div className="space-y-6">
      {/* Controls & Selector (Hidden on Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs no-print space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>مولد ومحرر الوثائق والمطبوعات الرسمية (المذكرة 40)</span>
            </h2>
            <p className="text-xs text-slate-500">
              وثائق مطابقة للضوابط الإدارية المغربية وجاهزة للطباعة الرسمية والمصادقة على الإمضاء.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasOverride && (
              <button
                onClick={restoreOriginal}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>استرجاع النص الأصلي</span>
              </button>
            )}

            <button
              onClick={() => {
                if (editing) commitEdit();
                setEditing((prev) => !prev);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
                editing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <PencilLine className="w-4 h-4" />
              <span>{editing ? 'إنهاء التحرير وحفظ التعديل' : 'تحرير نص الوثيقة'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة هذه الوثيقة (A4)</span>
            </button>
          </div>
        </div>

        {editing && (
          <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            وضع التحرير مُفعَّل: انقر داخل الوثيقة (الفقرة، الجدول أو التاريخ) وعدّل النص مباشرة. يُحفظ التعديل لهذا الملف وهذا النموذج عند إنهاء التحرير، ولا يظهر أي أثر للتحرير في الطباعة.
          </p>
        )}

        {/* Dossier Selection & Doc Tabs */}
        <div className="flex flex-col md:flex-row gap-3 pt-2 border-t border-slate-100">
          <div className="w-full md:w-72 shrink-0">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              اختر ملف المترشح:
            </label>
            <select
              value={selectedId}
              onChange={(e) => switchTo(() => setSelectedId(e.target.value))}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
            >
              {dossiers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.candidate.fullNameAr} ({d.candidate.grade}) - {d.referenceNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Doc Type Selector */}
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              اختر النموذج الإداري المطلوب:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {docTypes.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => switchTo(() => setActiveDocType(tab.id))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeDocType === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <div>{tab.label}</div>
                  <div className="text-[10px] opacity-70">{tab.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Document Sheet Container (A4 layout simulation) */}
      <div className="max-w-4xl mx-auto bg-white p-10 md:p-14 rounded-xl border border-slate-200 shadow-sm printable-document font-serif text-slate-900 space-y-6">
        {/* Official Header Image for ALL documents (Moroccan Royal Crest + AREF Oriental) */}
        <ArefOfficialHeader 
          className="border-b-2 border-slate-900 pb-3 mb-6" 
          subDepartment={activeDocType !== 'accord_attribution' ? `${candidate.directionProvinciale} · مصلحة الموارد البشرية والشؤون الإدارية · مكتب تدبير السكنيات` : undefined}
        />

        {/* Editable document body: النص المولَّد قابل للتعديل اليدوي ويُخزَّن لكل ملف+نموذج */}
        <div
          key={`${overrideKey}#${bodyToken}`}
          ref={bodyRef}
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={commitEdit}
          className={`space-y-6 ${editing ? 'doc-editing outline-none' : ''}`}
        >
        {/* 0. رسالة الموافقة الرسمية الصادرة عند المصادقة على الطلب (Modèle Officiel AREF) */}
        {activeDocType === 'accord_attribution' && (
          <div className="space-y-6 text-[15px] font-serif leading-[1.8] text-slate-950 relative min-h-[700px] flex flex-col justify-between">
            <div>
              {/* Destinataire */}
              <div className="text-center font-bold text-[17px] my-6 leading-relaxed">
                مديرة الأكاديمية<br />
                إلى السيد المدير الإقليمي<br />
                المديرية الإقليمية - {candidate.directionProvinciale}
              </div>

              {/* الموضوع والمراجع */}
              <div className="my-5 text-[15px] space-y-1 bg-slate-50/60 p-3 rounded-lg border border-slate-200">
                <p><strong><u>الموضوع:</u></strong> الموافقة على إسناد سكن وظيفي.</p>
                <p className="leading-relaxed">
                  <strong><u>المرجع:</u></strong> إرساليتكم عدد <span className="font-mono font-bold text-slate-900">{activeDossier.dpAudit?.bordereauNumber || '24/1109'}</span> بتاريخ <span className="font-mono">{String(activeDossier.dpAudit?.transmissionDate || activeDossier.creationDate || '').slice(0, 10)}</span><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;المذكرة الوزارية رقم 40 بتاريخ 10 ماي 2004
                </p>
              </div>

              {/* سلام تام */}
              <p className="text-center font-bold my-6 text-[16px]">سلام تام بوجود مولانا الإمام</p>

              {/* نص الرسالة */}
              <div className="content-body mt-6 text-justify text-[15px] leading-loose">
                <p>
                  وبعد، فجوابا على إرساليتكم المشار إليها في المرجع أعلاه، والمتضمنة لطلب السيد(ة){' '}
                  <strong>{candidate.fullNameAr}</strong>{' '}
                  رقم التأجير <strong>{candidate.ppr}</strong>{' '}
                  في شأن الموافقة على إسناد السكن الوظيفي المخصص للإدارة التربوية بـ{' '}
                  <strong>{housing.housingAddress || housing.targetEtablissement}</strong>{' '}
                  التابعة للمديرية الإقليمية <strong>{candidate.directionProvinciale}</strong>،{' '}
                  وتبعا للمذكرة الوزارية المذكورة أعلاه، يشرفني إخباركم أن الأكاديمية توافق على إسناد هذا السكن للمكلف بالأمر بصفته{' '}
                  <strong>{candidate.grade}</strong>.
                </p>
              </div>

              <p className="text-center font-bold mt-12 text-[16px]">وتقبلوا أزكى التحيات والسلام.</p>

              {/* Cachet et Signature */}
              <div className="flex justify-end pt-8 pb-10">
                <div className="text-center space-y-2">
                  <div className="text-xs text-slate-600 font-sans">
                    وجدة في: {String(activeDossier.arefDecision?.commissionDate || activeDossier.arefDecision?.pvDecisionDate || new Date().toISOString().split('T')[0]).slice(0, 10)}
                  </div>
                  <div className="font-bold text-sm">عن مديرة الأكاديمية الجهوية للتربية والتكوين</div>
                  <div className="text-xs text-slate-700">جهة الشرق</div>
                  {/* Blank space reserved for handwritten signature & stamp after printing */}
                  <div className="w-40 h-28 mx-auto" />
                </div>
              </div>
            </div>

            {/* أسفل الصفحة (Footer) */}
            <div className="footer pt-4 border-t-[1.5px] border-black text-center text-[13px] font-bold text-slate-900 mt-auto">
              قسم الشؤون الإدارية والمالية<br />
              الهاتف: 05-36-50-32-00 &nbsp;&nbsp;-&nbsp;&nbsp; الفاكس: 05-36-68-55-17
            </div>
          </div>
        )}

        {/* 1. الطلب الخطي (Demande Manuscrite) */}
        {activeDocType === 'demande' && (
          <div className="space-y-6 text-sm leading-relaxed">
            {/* Top Right: Candidate Sender info */}
            <div className="flex justify-between items-start text-xs font-sans border-b border-slate-200 pb-3">
              <div className="space-y-1">
                <div><strong>الاسم والنسب:</strong> {candidate.fullNameAr}</div>
                <div><strong>الإطار:</strong> {candidate.grade}</div>
                <div><strong>السلم:</strong> {candidate.scale} · <strong>الرتبة:</strong> {candidate.echelon}</div>
                <div><strong>رقم التأجير (PPR):</strong> {candidate.ppr}</div>
                <div><strong>رقم ب.ت.و (CIN):</strong> {candidate.cin}</div>
                <div><strong>مقر العمل:</strong> {candidate.currentEtablissement}</div>
                <div><strong>الهاتف:</strong> {candidate.phone}</div>
              </div>

              <div className="text-left space-y-1" dir="rtl">
                <div>{candidate.commune} في: {new Date().toLocaleDateString('ar-MA')}</div>
                <div className="font-bold text-slate-800 pt-2">
                  إلـى السيـد:<br />
                  المدير الإقليمي لوزارة التربية الوطنية والتعليم الأولي والرياضة<br />
                  بـ {candidate.directionProvinciale}
                </div>
                <div className="text-[11px] text-slate-500">
                  (تحت إشراف السيد رئيس المؤسسة)
                </div>
              </div>
            </div>

            {/* Subject and Reference */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1 font-sans">
              <div>
                <strong>الموضوع:</strong> طلب الاستفادة من {housing.housingType === 'fonction' ? 'سكن وظيفي' : 'سكن إداري'} بمؤسسة {housing.targetEtablissement}.
              </div>
              <div>
                <strong>المرجع:</strong> المذكرة الوزارية رقم 40 المنظمة للمساكن الإدارية والوظيفية لقطاع التربية الوطنية.
              </div>
            </div>

            {/* Body */}
            <div className="text-justify space-y-4 pt-2">
              <p>
                <strong>سلام تام بوجود مولانا الإمام، دام له النصر والتأييد.</strong>
              </p>

              <p>
                وبعد، يشرفني بكل احترام وتقدير أن ألتمس من سيادتكم التفضل بالموافقة على طلبي الرامي إلى الاستفادة من{' '}
                <strong>{housing.housingType === 'fonction' ? 'السكن الوظيفي' : 'السكن الإداري'}</strong> الكائن بـ:{' '}
                <strong>{housing.targetEtablissement}</strong> ({housing.housingCategory} - {housing.housingAddress}).
              </p>

              <p>
                وأحيطكم علماً، سيدي المدير الإقليمي، أنني أمارس مهامي حالياً بصفة{' '}
                <strong>{candidate.grade}</strong> بمقر العمل المذكور، بأقدمية عامة تبلغ{' '}
                <strong>{candidate.seniorityGeneral}</strong> سنة في قطاع التربية الوطنية، و{' '}
                <strong>{candidate.seniorityEtablissement}</strong> سنوات بهذه المؤسسة، وأن وضعي العائلي هو:{' '}
                <strong>{family.maritalStatus === 'marie' ? 'متزوج' : 'عازب/أرمل'}</strong> مع إعالة{' '}
                <strong>{family.childrenCount}</strong> أطفال.
              </p>

              <p>
                {housing.housingType === 'fonction' ? (
                  <span>
                    وحيث إن مهامي تتطلب التواجد المستمر لمراقبة مرافق المؤسسة وضمان السير العادي للمرفق التربوي والإداري
                    وفق مقتضيات المذكرة الوزارية رقم 40، فإن الاستفادة من هذا السكن الوظيفي تعد ضرورة ملحة لحسن سير المصلحة.
                  </span>
                ) : (
                  <span>
                    وأود الاستفادة من هذا السكن الإداري الشاغر طبقاً لقواعد الاستحقاق وشبكة التنقيط المنصوص عليها بالمذكرة الوزارية رقم 40.
                  </span>
                )}
              </p>

              <p>
                وتجدون رفقة هذا الطلب كافة الوثائق المكونة لملف الترشيح القانوني والمطلوبة في المذكرة المشار إليها في المرجع أعلاه:
              </p>

              <ul className="list-disc list-inside text-xs font-sans space-y-1 bg-slate-50/80 p-3 rounded">
                <li>نسخة مصادق عليها من بطاقة التعريف الوطنية الإلكترونية (CIN).</li>
                <li>شهادة العمل حديثة تثبت الوضعية الإدارية والإطار والسلم.</li>
                <li>وثائق الوضع العائلي (عقد الزواج، شهادة عمل الزوج/الزوجة، عقود ازدياد الأبناء).</li>
                <li>مطبوع الالتزام والتصريح بالشرف مصحح الإمضاء وفق المذكرة 40.</li>
                <li>نسخة من محضر الالتحاق بالعمل (PV d'installation).</li>
              </ul>

              <p>
                وفي انتظار ردكم الكريم، تفضلوا، سيدي المدير الإقليمي المحترم، بقبول أسمى عبارات التقدير والاحترام.
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs font-sans">
              <div>
                <div className="font-bold text-slate-800">تأشيرة وموافقة رئيس المؤسسة</div>
                <div className="text-[10px] text-slate-500">(الرأي، التاريخ والخاتم)</div>
                <div className="h-20 mt-2" />
              </div>

              <div>
                <div className="font-bold text-slate-800">توقيع المعني بالأمر</div>
                <div className="text-[10px] text-slate-500">{candidate.fullNameAr}</div>
                <div className="h-20 mt-2" />
              </div>
            </div>
          </div>
        )}

        {/* 2. مطبوع الالتزام والتصريح بالشرف (Engagement & Déclaration sur l'honneur) */}
        {activeDocType === 'engagement' && (
          <div className="space-y-5 text-sm leading-relaxed">
            <div className="text-center space-y-1 pb-2">
              <h3 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 inline-block pb-1">
                مطبوع الالتزام والتصريح بالشرف
              </h3>
              <div className="text-xs font-sans font-bold text-emerald-800">
                (وفقاً لمقتضيات المذكرة الوزارية رقم 40 الخاصة بالسكن الإداري والوظيفي)
              </div>
            </div>

            {/* Identification block */}
            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs font-sans space-y-2">
              <div className="font-bold text-slate-800 border-b border-slate-200 pb-1">أنا الموقع أسفله:</div>
              <div className="grid grid-cols-2 gap-3">
                <div><strong>الاسم والنسب:</strong> {candidate.fullNameAr}{candidate.fullNameFr ? ` (${candidate.fullNameFr})` : ''}</div>
                <div><strong>رقم بطاقة التعريف الوطنية:</strong> {candidate.cin}</div>
                <div><strong>رقم التأجير (PPR):</strong> {candidate.ppr}</div>
                <div><strong>الإطار:</strong> {candidate.grade}</div>
                <div><strong>السلم:</strong> {candidate.scale} · <strong>الرتبة:</strong> {candidate.echelon}</div>
                <div><strong>مقر العمل الحالي:</strong> {candidate.currentEtablissement}</div>
                <div><strong>المديرية الإقليمية:</strong> {candidate.directionProvinciale}</div>
                <div><strong>السكن المطلوب:</strong> {housing.targetEtablissement} ({housing.housingCategory})</div>
              </div>
            </div>

            {/* Clauses */}
            <div className="space-y-3 text-justify text-xs font-sans">
              <div className="font-bold text-slate-900 text-sm">أصرح بشرفي وألتزم بما يلي:</div>

              <div className="flex gap-2">
                <span className="font-bold text-slate-800">أولاً:</span>
                <p>
                  أنني اطلعت اطلاعاً تاماً وكاملاً على مقتضيات المذكرة الوزارية رقم 40 المنظمة للمساكن الإدارية والوظيفية بقطاع التربية الوطنية، وألتزم التزاماً مطلقاً بجميع بنودها وضوابطها.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="font-bold text-slate-800">ثانياً:</span>
                <p>
                  <strong>التعهد بالإفراغ الفوري:</strong> ألتزم وأتعهد التزاماً لا رجعة فيه بإفراغ السكن موضوع الطلب فور انتهاء أو زوال المهام الإدارية التي خولت لي حق الاستفادة منه، أو في حالة انتقالي إلى مؤسسة أخرى، أو إحالتي على التقاعد، أو الاستيداع، أو الإعفاء، أو مغادرتي لأسلاك الوظيفة العمومية لأي سبب من الأسباب، وذلك فور التوصل بقرار الإفراغ ودون المطالبة بأي مهلة إضافية أو أي تعويض مالي أو عيني.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="font-bold text-slate-800">ثالثاً:</span>
                <p>
                  <strong>منع التنازل أو الكراء من الباطن:</strong> ألتزم بعدم التنازل عن السكن لأي شخص آخر، أو كرائه للغير كلياً أو جزئياً، أو استعماله لأي غرض غير سكني الشخصي ولأفراد عائلتي المصرح بهم قانوناً، تحت طائلة المتابعة القضائية والإدارية.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="font-bold text-slate-800">رابعاً:</span>
                <p>
                  <strong>التحملات والصيانة:</strong> ألتزم بأداء واجبات استهلاك الماء والكهرباء بانتظام، والحفاظ على السكن ومرافقه وإجراء كافة الإصلاحات الترميمية اللازمة، وإرجاعه للإدارة بنفس الحالة التي تسلمته بها والمثبتة بمحضر المعاينة.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="font-bold text-slate-800">خامساً:</span>
                <p>
                  أقر بأن هذا التصريح والالتزام مصحح الإمضاء يعتبر سنداً تنفيذياً يخول للإدارة والأكاديمية الجهوية استرجاع السكن وسلوك كافة المساطر القانونية والمتابعات المعمول بها عند الإخلال بأحد بنوده.
                </p>
              </div>
            </div>

            {/* Legalization block */}
            <div className="grid grid-cols-2 gap-6 pt-6 text-center text-xs font-sans">
              <div className="border border-slate-300 p-4 rounded bg-slate-50/50">
                <div className="font-bold text-slate-800">إمضاء المعني بالأمر</div>
                <div className="text-[11px] text-slate-600">
                  (مصحوب بعبارة "قرئ وصودق عليه ويلتزم به")
                </div>
                <div className="h-24" />
              </div>

              <div className="border-2 border-slate-400 p-4 rounded bg-white">
                <div className="font-bold text-slate-900">خانة تصحيح الإمضاء (Légalisation)</div>
                <div className="text-[10px] text-slate-500">
                  المصادقة بمصلحة تصحيح الإمضاءات بالجماعة الحضرية / القروية
                </div>
                <div className="h-24 flex flex-col items-center justify-center text-slate-400 text-[11px] space-y-1">
                  <span>تاريخ المصادقة: .......................................</span>
                  <span>رقم التسجيل بالسجل: ..................................</span>
                  <span>خاتم وتوقيع ضابط الحالة المدنية</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. بطاقة المعلومات وشبكة التنقيط (Fiche & Barème) */}
        {activeDocType === 'fiche_bareme' && (
          <div className="space-y-5 text-xs font-sans leading-relaxed">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 border-b-2 border-slate-900 inline-block pb-1">
                استمارة الترشيح وشبكة التنقيط المعيارية للاستفادة من السكن
              </h3>
              <div className="text-[11px] text-slate-600">
                الملف رقم: <strong className="font-mono">{activeDossier.referenceNumber}</strong> · المرجع: المذكرة الوزارية رقم 40
              </div>
            </div>

            {/* Candidate & Family Specs */}
            <div className="grid grid-cols-2 gap-4 border border-slate-200 p-3 rounded bg-slate-50">
              <div>
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">1. هوية المترشح(ة)</div>
                <div className="space-y-1">
                  <div><strong>الاسم الكامل:</strong> {candidate.fullNameAr}{candidate.fullNameFr ? ` (${candidate.fullNameFr})` : ''}</div>
                  <div><strong>رقم التأجير (PPR):</strong> {candidate.ppr}</div>
                  <div><strong>رقم ب.ت.و (CIN):</strong> {candidate.cin}</div>
                  <div><strong>الإطار الحالي:</strong> {candidate.grade}</div>
                  <div><strong>السلم:</strong> {candidate.scale} · <strong>الرتبة:</strong> {candidate.echelon}</div>
                  <div><strong>مقر العمل:</strong> {candidate.currentEtablissement}</div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">2. الوضع العائلي والسكن</div>
                <div className="space-y-1">
                  <div><strong>الحالة العائلية:</strong> {family.maritalStatus === 'marie' ? 'متزوج(ة)' : 'عازب(ة) / مطلق(ة) / أرمل(ة)'}</div>
                  {family.maritalStatus === 'marie' && (
                    <div><strong>{candidate.gender === 'female' ? 'مزاولة الزوج لوظيفة عمومية:' : 'مزاولة الزوجة لوظيفة عمومية:'}</strong> {family.spouseIsPublicOfficial ? 'نعم' : 'لا'}</div>
                  )}
                  <div><strong>عدد الأطفال المعالين:</strong> {family.childrenCount}</div>
                  <div><strong>نوع السكن المطلوب:</strong> {housing.housingType === 'fonction' ? 'سكن وظيفي' : 'سكن إداري'}</div>
                  <div><strong>المؤسسة المستهدفة:</strong> {housing.targetEtablissement}</div>
                </div>
              </div>
            </div>

            {/* Official Scoring Table (Grille de barème) */}
            <div className="space-y-2">
              <div className="font-bold text-slate-900 text-sm">3. تفصيل شبكة التنقيط المعيارية (المذكرة الوزارية 40)</div>
              
              <table className="w-full border-collapse border border-slate-300 text-center">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 p-2 text-right">معيار التنقيط (Critère de notation)</th>
                    <th className="border border-slate-300 p-2">القاعدة المعتمدة</th>
                    <th className="border border-slate-300 p-2">بيانات المترشح</th>
                    <th className="border border-slate-300 p-2">النقط الممنوحة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 text-right font-medium">1. الإطار (السلم الإداري)</td>
                    <td className="border border-slate-300 p-2 text-[11px]">سلم 1-6 (1) · سلم 7-9 (2) · سلم 10+ وخارج السلم (3)</td>
                    <td className="border border-slate-300 p-2 font-mono">السلم {candidate.scale}</td>
                    <td className="border border-slate-300 p-2 font-bold font-mono">{bareme.scalePts}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-right font-medium">2. الأقدمية العامة</td>
                    <td className="border border-slate-300 p-2 text-[11px]">5 أشطر: 1-5 (1) · 6-10 (2) · 11-15 (3) · 16-20 (4) · +20 (5)</td>
                    <td className="border border-slate-300 p-2 font-mono">{candidate.seniorityGeneral} سنة</td>
                    <td className="border border-slate-300 p-2 font-bold font-mono">{bareme.seniorityGeneralPts}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-right font-medium">3. الأقدمية بنفس المدينة</td>
                    <td className="border border-slate-300 p-2 text-[11px]">من 2 إلى 5 سنوات (1) / 6 سنوات فأكثر (2)</td>
                    <td className="border border-slate-300 p-2 font-mono">{candidate.seniorityEtablissement} سنوات</td>
                    <td className="border border-slate-300 p-2 font-bold font-mono">{bareme.seniorityEtablissementPts}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-right font-medium">4. التحملات العائلية - الأبناء</td>
                    <td className="border border-slate-300 p-2 text-[11px]">نقطة عن كل طفل في حدود 3 أطفال</td>
                    <td className="border border-slate-300 p-2 font-mono">{family.childrenCount} أطفال</td>
                    <td className="border border-slate-300 p-2 font-bold font-mono">{bareme.childrenPts}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-right font-medium">4. التحملات العائلية - الزوج(ة) غير العامل(ة)</td>
                    <td className="border border-slate-300 p-2 text-[11px]">نقطتان عن الزوج(ة) غير العامل(ة)</td>
                    <td className="border border-slate-300 p-2">{family.maritalStatus === 'marie' ? (family.spouseIsPublicOfficial ? 'زوج(ة) عامل(ة)' : 'زوج(ة) غير عامل(ة)') : family.maritalStatus}</td>
                    <td className="border border-slate-300 p-2 font-bold font-mono">{bareme.maritalPts}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-right font-medium">5. المسؤولية الإدارية</td>
                    <td className="border border-slate-300 p-2 text-[11px]">رئيس قسم / مؤسسة (3) · رئيس مصلحة (2)</td>
                    <td className="border border-slate-300 p-2">{candidate.grade}</td>
                    <td className="border border-slate-300 p-2 font-bold font-mono">{bareme.responsibilityBonus}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-right font-medium">6. المردودية</td>
                    <td className="border border-slate-300 p-2 text-[11px]">جيد جدا (3) · جيد (2) · مستحسن (1) · دون المستحسن (0)</td>
                    <td className="border border-slate-300 p-2">{PERFORMANCE_RATING_LABELS[candidate.performanceRating ?? 'satisfactory']}</td>
                    <td className="border border-slate-300 p-2 font-bold font-mono">{bareme.performancePts ?? 0}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-right font-medium">7. الوسط القروي</td>
                    <td className="border border-slate-300 p-2 text-[11px]">معلمة غير متزوجة (3) · مدرس بفرعية (2)</td>
                    <td className="border border-slate-300 p-2">{candidate.isRuralBranch ? 'مدرس بفرعية' : candidate.isRuralArea ? 'وسط قروي' : '—'}</td>
                    <td className="border border-slate-300 p-2 font-bold font-mono">{bareme.ruralBonusPts ?? 0}</td>
                  </tr>
                  <tr className="bg-slate-200 font-bold">
                    <td colSpan={3} className="border border-slate-300 p-2 text-right">المجموع الإجمالي للنقط (Total du Barème) — التعادل: الأقدمية العامة ثم القرعة</td>
                    <td className="border border-slate-300 p-2 font-mono text-base text-emerald-900">{bareme.totalPts} نقطة</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Checklist of attachments */}
            <div className="border border-slate-200 p-3 rounded space-y-1">
              <div className="font-bold text-slate-800">4. شهادة استيفاء الوثائق الـ 6 الإلزامية:</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>[ {activeDossier.documents.demandeManuscrite.present ? '✓' : ' '} ] 1. الطلب الخطي موجه للمدير الإقليمي</div>
                <div>[ {activeDossier.documents.copieCIN.present ? '✓' : ' '} ] 2. نسخة مصادق عليها من بطاقة التعريف (CIN)</div>
                <div>[ {activeDossier.documents.attestationTravail.present ? '✓' : ' '} ] 3. شهادة العمل حديثة</div>
                <div>[ {activeDossier.documents.situationFamiliale.present ? '✓' : ' '} ] 4. وثائق الوضع العائلي والأطفال</div>
                <div>[ {activeDossier.documents.engagementHonneur.present ? '✓' : ' '} ] 5. مطبوع الالتزام مصحح الإمضاء (Note 40)</div>
                <div>[ {activeDossier.documents.pvInstallation.present ? '✓' : ' '} ] 6. محضر الالتحاق بالمؤسسة (PV)</div>
              </div>
            </div>

            {/* Committee Verification Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[11px]">
              <div className="border border-slate-300 p-2 rounded">
                <div className="font-bold text-slate-800">توقيع المترشح(ة)</div>
                <div className="h-16" />
              </div>
              <div className="border border-slate-300 p-2 rounded">
                <div className="font-bold text-slate-800">رئيس المؤسسة التعليمية</div>
                <div className="h-16" />
              </div>
              <div className="border border-slate-300 p-2 rounded">
                <div className="font-bold text-slate-800">رئيس مصلحة الموارد البشرية بالـ DP</div>
                <div className="h-16" />
              </div>
            </div>
          </div>
        )}

        {/* 4. وصل إيداع الملف بالمديرية (Récépissé de Dépôt) */}
        {activeDocType === 'recepisse' && (
          <div className="space-y-6 text-xs font-sans leading-relaxed">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 border-b-2 border-slate-900 inline-block pb-1">
                وصل إيداع ملف طلب الاستفادة من السكن الوظيفي أو الإداري
              </h3>
              <div className="text-[11px] text-slate-600">
                Récépissé de Dépôt de Dossier de Demande de Logement
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div>
                  <strong>رقم التسجيل بمكتب الضبط:</strong>{' '}
                  <span className="font-mono font-bold text-slate-900">{activeDossier.referenceNumber}</span>
                </div>
                <div>
                  <strong>تاريخ وساعة الإيداع:</strong>{' '}
                  <span className="font-mono">{activeDossier.creationDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><strong>اسم المترشح(ة):</strong> {candidate.fullNameAr}</div>
                <div><strong>رقم التأجير (PPR):</strong> {candidate.ppr}</div>
                <div><strong>رقم ب.ت.و:</strong> {candidate.cin}</div>
                <div><strong>الإطار:</strong> {candidate.grade}</div>
                <div><strong>مقر العمل:</strong> {candidate.currentEtablissement}</div>
                <div><strong>السكن المطلوب:</strong> {housing.targetEtablissement}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-800">قائمة الوثائق المودعة والمؤشر عليها:</div>
              <ul className="space-y-1.5 border border-slate-200 p-3 rounded bg-white">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الطلب الخطي موجه للسيد المدير الإقليمي ومؤشر من رئيس المؤسسة.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>نسخة طبق الأصل من بطاقة التعريف الوطنية الإلكترونية (CIN).</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>شهادة العمل حديثة تثبت الإطار والسلم ومقر التعيين.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>وثائق الوضع العائلي (عقد الزواج، شهادة عمل القرين، عقود ازدياد الأبناء).</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>مطبوع الالتزام والتصريح بالشرف مصحح الإمضاء طبقاً للمذكرة 40.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>نسخة من محضر الالتحاق بالعمل (PV d'installation).</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded text-[11px] text-amber-900">
              <strong>تنبيه هام للمترشح:</strong> هذا الوصل يثبت فقط استلام الوثائق، ولا يخول بأي حال من الأحوال حق شغل السكن إلا بعد دراسة الملف من طرف اللجنة الإقليمية المختصة، ورفعه إلى الأكاديمية الجهوية للتربية والتكوين لإصدار قرار الترخيص النهائي بتوقيع السيد مدير الأكاديمية.
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 text-center">
              <div>
                <div className="font-bold">توقيع المودع (المترشح)</div>
                <div className="h-16" />
              </div>
              <div>
                <div className="font-bold">مكتب الضبط والسكنيات بالمديرية الإقليمية</div>
                <div className="h-16 flex items-center justify-center text-slate-400">طابع مكتب الضبط والتاريخ</div>
              </div>
            </div>
          </div>
        )}

        {/* 5. جدول الإرسال الإداري (Bordereau d'Envoi DP ➔ AREF) */}
        {activeDocType === 'bordereau' && (
          <div className="space-y-6 text-xs font-sans leading-relaxed">
            <div className="flex justify-between items-start border-b border-slate-300 pb-3">
              <div>
                <div><strong>المديرية الإقليمية:</strong> {candidate.directionProvinciale}</div>
                <div><strong>مصلحة الموارد البشرية والشؤون الإدارية</strong></div>
                <div><strong>رقم الإرسال:</strong> {activeDossier.dpAudit?.bordereauNumber || 'BORD/2026/089'}</div>
              </div>

              <div className="text-left">
                <div>في: {new Date().toLocaleDateString('ar-MA')}</div>
                <div className="font-bold text-slate-900 pt-2">
                  إلـى السيـد:<br />
                  مدير الأكاديمية الجهوية للتربية والتكوين<br />
                  {candidate.aref}
                </div>
                <div className="text-[10px] text-slate-500">
                  (قسم الشؤون الإدارية والمالية - مصلحة الممتلكات والسكنيات)
                </div>
              </div>
            </div>

            <div className="text-center font-bold text-base text-slate-900 border-b border-t border-slate-300 py-1.5">
              جدول إرسال ملفات طلب الاستفادة من السكن الوظيفي / الإداري
            </div>

            <div>
              <strong>الموضوع:</strong> إحالة ملف طلب الاستفادة من السكن وفق المذكرة الوزارية رقم 40.
            </div>

            <table className="w-full border-collapse border border-slate-300 text-center">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="border border-slate-300 p-2">رقم الملف</th>
                  <th className="border border-slate-300 p-2 text-right">الاسم والنسب والإطار</th>
                  <th className="border border-slate-300 p-2">السكن المطلوب ومقر العمل</th>
                  <th className="border border-slate-300 p-2">عدد الوثائق المرفقة</th>
                  <th className="border border-slate-300 p-2">ملاحظات ورأي المدير الإقليمي</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 font-mono">{activeDossier.referenceNumber}</td>
                  <td className="border border-slate-300 p-2 text-right">
                    <div className="font-bold">{candidate.fullNameAr}</div>
                    <div className="text-[10px] text-slate-500">PPR: {candidate.ppr} · {candidate.grade}</div>
                  </td>
                  <td className="border border-slate-300 p-2">
                    <div>{housing.targetEtablissement}</div>
                    <div className="text-[10px] text-emerald-800">({housing.housingType === 'fonction' ? 'سكن وظيفي' : 'سكن إداري'})</div>
                  </td>
                  <td className="border border-slate-300 p-2 font-mono font-bold">
                    {housing.housingType === 'fonction'
                      ? '3 وثائق (الالتزام + بطاقتا المعاينة والمراقبة)'
                      : '6 وثائق (ملف كامل مع الالتزام المصادق عليه)'}
                  </td>
                  <td className="border border-slate-300 p-2 text-[11px] text-right">
                    ملف مستوفٍ لجميع المعايير المنصوص عليها بالمذكرة 40. نلتمس التفضل بالمصادقة على منح الترخيص باستغلال السكن.
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-8 pt-8 text-center">
              <div>
                <div className="font-bold">رئيس مصلحة الموارد البشرية</div>
                <div className="h-20 flex items-center justify-center text-slate-400">التأشيرة الإدارية</div>
              </div>
              <div>
                <div className="font-bold">المدير الإقليمي لوزارة التربية الوطنية</div>
                <div className="h-20" />
              </div>
            </div>
          </div>
        )}

        {/* 6. محضر تسلّم السكن (PV de Prise de Possession) */}
        {activeDocType === 'pv_possession' && (
          <div className="space-y-6 text-xs font-sans leading-relaxed">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 border-b-2 border-slate-900 inline-block pb-1">
                محضر تسليم وتسلّم السكن الإداري / الوظيفي وحالة الأماكن
              </h3>
              <div className="text-[11px] text-slate-600">
                Procès-Verbal de Prise de Possession et État des Lieux
              </div>
            </div>

            <p className="text-justify">
              بناءً على قرار الترخيص بالاستفادة من السكن الصادر عن السيد مدير الأكاديمية الجهوية للتربية والتكوين لجهة {candidate.aref}،
              انتقلت اللجنة المشكلة من السادة:
            </p>

            <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
              <li>ممثل المديرية الإقليمية بـ {candidate.directionProvinciale}.</li>
              <li>السيد رئيس المؤسسة التعليمية {housing.targetEtablissement}.</li>
              <li>السيد(ة) المستفيد(ة): <strong>{candidate.fullNameAr}</strong> ({candidate.grade}).</li>
            </ul>

            <div className="space-y-2">
              <div className="font-bold text-slate-800">بيانات السكن الممنوح:</div>
              <div className="grid grid-cols-2 gap-3 border border-slate-200 p-3 rounded">
                <div><strong>المؤسسة:</strong> {housing.targetEtablissement}</div>
                <div><strong>موقع السكن:</strong> {housing.housingAddress}</div>
                <div><strong>الصنف:</strong> {housing.housingCategory}</div>
                <div><strong>رقم السكن:</strong> {housing.housingNumber || 'سكن رقم 01'}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-800">معاينة العدادات والحالة العامة (État des lieux):</div>
              <table className="w-full border-collapse border border-slate-300 text-center">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-1.5">البيان</th>
                    <th className="border border-slate-300 p-1.5">رقم العداد</th>
                    <th className="border border-slate-300 p-1.5">الرقم المسجل عند الدخول (Index)</th>
                    <th className="border border-slate-300 p-1.5">الحالة والصيانة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-1.5 text-right font-medium">عداد الماء الصالح للشرب</td>
                    <td className="border border-slate-300 p-1.5 font-mono">W-84920</td>
                    <td className="border border-slate-300 p-1.5 font-mono">0142 m³</td>
                    <td className="border border-slate-300 p-1.5 text-emerald-700">جيدة وتعمل بانتظام</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1.5 text-right font-medium">عداد الكهرباء</td>
                    <td className="border border-slate-300 p-1.5 font-mono">E-59124</td>
                    <td className="border border-slate-300 p-1.5 font-mono">4981 kWh</td>
                    <td className="border border-slate-300 p-1.5 text-emerald-700">جيدة وتعمل بانتظام</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1.5 text-right font-medium">الأبواب والنوافذ والطلاء</td>
                    <td colSpan={2} className="border border-slate-300 p-1.5">مفاتيح السكن (3 نسخ مسلمة للمستفيد)</td>
                    <td className="border border-slate-300 p-1.5">حالة جيدة صالحة للسكن</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-justify text-[11px] text-slate-600">
              يقر المستفيد أنه تسلم السكن موضوع هذا المحضر والمفاتيح الخاصة به بحالة جيدة، ويلتزم بصيانته وتفريغه فور انتهاء المهام وفق المذكرة 40. حرر هذا المحضر في ثلاثة نظائر.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[11px]">
              <div>
                <div className="font-bold">المستفيد(ة)</div>
                <div className="h-16" />
              </div>
              <div>
                <div className="font-bold">رئيس المؤسسة</div>
                <div className="h-16" />
              </div>
              <div>
                <div className="font-bold">ممثل المديرية الإقليمية</div>
                <div className="h-16" />
              </div>
            </div>
          </div>
        )}

        {/* 7-15. المطبوعات الرسمية التسعة للمذكرة 40 (Official Note 40 forms) */}
        {activeDocType.startsWith('official_') && (
          <OfficialFormSheet dossier={activeDossier} dossiers={dossiers} formId={activeDocType} />
        )}
        </div>
      </div>

    </div>
  );
};
