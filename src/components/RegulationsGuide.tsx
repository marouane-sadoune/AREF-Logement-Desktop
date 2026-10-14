import React, { useState } from 'react';
import { 
  BookOpen, 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  HelpCircle,
  Building,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  FileCheck
} from 'lucide-react';

export const RegulationsGuide: React.FC = () => {
  const [openSection, setOpenSection] = useState<string>('intro');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? '' : id);
  };

  const sections = [
    {
      id: 'intro',
      title: '1. الإطار المرجعي وأهداف المذكرة الوزارية رقم 40',
      icon: BookOpen,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-700">
          <p>
            تعتبر <strong>المذكرة الوزارية رقم 40</strong> الصادرة عن وزارة التربية الوطنية والشباب (قطاع التربية الوطنية) بمثابة الميثاق التنظيمي والمسطري الموحد لتدبير وتوزيع واسترجاع كافة المساكن الإدارية والوظيفية التابعة للوزارة والأكاديميات الجهوية للتربية والتكوين.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-950 space-y-1">
            <div className="font-bold">أهداف المذكرة الأساسية:</div>
            <ul className="list-disc list-inside space-y-0.5">
              <li>ترشيد استغلال الحظيرة السكنية لقطاع التعليم العمومي وضمان تكافؤ الفرص والشفافية.</li>
              <li>تمكين الأطر الإدارية والتربوية الملزمة بالحضور الدائم من أداء واجباتها في أفضل الظروف.</li>
              <li>وضع حد للاستغلال العشوائي أو الاحتلال غير القانوني للمساكن الوظيفية والإدارية بعد انتهاء المهام.</li>
              <li>توحيد مسطرة الإسناد والمصادقة عبر المرور الإلزامي من المديرية الإقليمية (DP) إلى الأكاديمية الجهوية (AREF).</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'distinction',
      title: '2. الفرق بين السكن الوظيفي والسكن الإداري',
      icon: Scale,
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Functional Housing */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
              <div className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                <Building className="w-4 h-4 text-amber-600" />
                <span>السكن الوظيفي (Logement de Fonction)</span>
              </div>
              <p>
                سكن مخصص <strong>بحكم الوظيفة وضرورة المصلحة المطلقة (Nécessité absolue de service)</strong>. يرتبط ارتباطاً وثيقاً بمزاولة مهام محددة بالمؤسسة التعليمية.
              </p>
              <div className="font-semibold text-amber-900">المستفيدون بحكم الوظيفة:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900">
                <li>مديرو المؤسسات التعليمية (ابتدائي، إعدادي، تأهيلي).</li>
                <li>الحراس العامون للداخلية والخارجية.</li>
                <li>النظار ورؤساء الأشغال.</li>
                <li>مسيرو المصالح المادية والمالية (المقتصدون المكلفون بالداخليات).</li>
              </ul>
              <div className="text-[10px] text-amber-800 bg-amber-100/70 p-1.5 rounded">
                <strong>خاصية هامة:</strong> الاستفادة منه تنتهي حكماً وبقوة القانون بمجرد الإعفاء أو الانتقال أو التقاعد.
              </div>
            </div>

            {/* Administrative Housing */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-600" />
                <span>السكن الإداري (Logement Administratif)</span>
              </div>
              <p>
                سكن غير ملزم لمهمة إدارية معينة، متاح <strong>للتنافس الشريف</strong> بين كافة موظفي المؤسسة والقطاع بناءً على <strong>الاستحقاق وشبكة التنقيط المعيارية (Barème)</strong>.
              </p>
              <div className="font-semibold text-blue-900">معايير التنافس المعتمدة:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-900">
                <li>الأقدمية العامة بالوظيفة العمومية وقطاع التعليم.</li>
                <li>الأقدمية بالمؤسسة التعليمية الحالية.</li>
                <li>السلم الإداري والرتبة.</li>
                <li>الوضعية العائلية وعدد الأطفال المعالين.</li>
              </ul>
              <div className="text-[10px] text-blue-800 bg-blue-100/70 p-1.5 rounded">
                <strong>خاصية هامة:</strong> يخضع لدراسة اللجنة الإقليمية وتصديق الأكاديمية حسب الترتيب الاستحقاقي.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'dossier',
      title: '3. تكوين ملف الترشيح والوثائق الست الإلزامية',
      icon: FileText,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-700">
          <p>
            تحدد المذكرة 40 قائمة وثائق ملف الترشيح التي يجب على المترشح إعدادها وإيداعها لدى المديرية الإقليمية (DP) قبل الإحالة على الأكاديمية الجهوية (AREF):
          </p>
          <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="flex items-start gap-2">
              <span className="font-bold font-mono text-emerald-700 shrink-0">1.</span>
              <div>
                <strong>الطلب الخطي (Demande manuscrite):</strong> موجه إلى السيد المدير الإقليمي، يحدد رغبة الموظف مع ذكر إطاره، مهامه، ومقر عمله الحالي.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold font-mono text-emerald-700 shrink-0">2.</span>
              <div>
                <strong>نسخة من بطاقة التعريف الوطنية (Copie de la CIN):</strong> مصادق على مطابقتها للأصل، سارية المفعول.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold font-mono text-emerald-700 shrink-0">3.</span>
              <div>
                <strong>شهادة العمل (Attestation de travail) حديثة:</strong> مسلمة من مصلحة الموارد البشرية تثبت الإطار، السلم، ومقر العمل.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold font-mono text-emerald-700 shrink-0">4.</span>
              <div>
                <strong>وثائق الوضع العائلي (Situation Familiale):</strong> نسخة من عقد الزواج، شهادة عمل الزوج(ة) إن كان موظفاً، وعقود ازدياد الأطفال المعالين.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold font-mono text-emerald-700 shrink-0">5.</span>
              <div>
                <strong>مطبوع الالتزام والتصريح بالشرف مصحح الإمضاء:</strong> التزام رسمي يتعهد فيه الموظف باحترام المذكرة 40 وإفراغ السكن فور انتهاء المهام.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold font-mono text-emerald-700 shrink-0">6.</span>
              <div>
                <strong>محضر الالتحاق بالمؤسسة (PV d'installation):</strong> يثبت تعيين الموظف الفعلي بالمؤسسة التي يوجد بها السكن.
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              <span>مسطرة السكن الوظيفي بحكم المسؤولية والمهام: بدون تباري ولا تنقيط</span>
            </div>
            <p>
              المدير والحارس العام والنظّار والمقتصدون المعينون بحكم المهام لا يشاركون في التباري: لا شبكة تنقيط ولا ترتيب ولا لجنة إسناد، والسكن يُسند بمجرد التعيين في المنصب. يكتفي ملفهم بـ:
            </p>
            <ul className="list-disc pr-5 space-y-1">
              <li>الالتزام والتصريح بالشرف مصحح الإمضاء — <strong>المطبوع رقم 3</strong>;</li>
              <li>بطاقة معاينة السكن — <strong>المطبوع رقم 5</strong>;</li>
              <li>بطاقة مراقبة السكن — <strong>المطبوع رقم 9</strong>، توقيع المستفيد والمكلف بتدبير السكنيات بالنيابة أو المديرية الإقليمية.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'eviction',
      title: "4. الالتزام بالإفراغ وحالات سقوط الحق (Procédure d'Évacuation)",
      icon: AlertTriangle,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-700">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>مقتضيات الإفراغ الصارمة بموجب المذكرة 40:</span>
            </div>
            <p>
              يعد السكن الوظيفي أو الإداري ملكاً عاماً للدولة موضوعاً رهن إشارة المرفق التربوي. يسقط حق الاستفادة فوراً وتلقائياً في الحالات الآتية:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>انتهاء المهام الإدارية:</strong> انتهاء أو إنهاء تكليف المدير، الحارس العام، الناظر أو المقتصد.</li>
              <li><strong>الانتقال:</strong> انتقال الموظف إلى مؤسسة تعليمية أخرى أو مديرية إقليمية أخرى.</li>
              <li><strong>الإحالة على التقاعد:</strong> بلوغ حد السن القانوني للإحالة على المعاش أو التقاعد النسبي.</li>
              <li><strong>الاستيداع أو الانقطاع عن العمل:</strong> الاستيداع الإداري، الإلحاق بإدارة أخرى، أو العزل.</li>
              <li><strong>الكراء من الباطن أو التنازل للغير:</strong> يعتبر جريمة إدارية تستوجب الإفراغ الفوري والمتابعة التأديبية والقضائية.</li>
            </ul>
          </div>
          <p className="text-[11px] text-slate-500">
            تتولى الأكاديمية الجهوية (AREF) والمديرية الإقليمية (DP) توجيه إعذار بالإفراغ، وفي حالة الامتناع يتم رفع دعوى استعجالية أمام المحكمة الإدارية أو الابتدائية المختصة لطرد المحتل بدون سند قانوني واقتطاع تعويض الاحتلال من الأجر.
          </p>
        </div>
      )
    },
    {
      id: 'oriental_network',
      title: '5. التقسيم الإداري لمديريات جهة الشرق الثماني (Région de l\'Oriental)',
      icon: Building,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-700">
          <p>
            تتبع لـ <strong>الأكاديمية الجهوية للتربية والتكوين لجهة الشرق (مقرها وجدة)</strong> ثماني مديريات إقليمية (DP) يتم عبرها إيداع وتدقيق ملفات السكن الإداري والوظيفي:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">1. المديرية الإقليمية بوجدة أنكاد (OUJDA)</div>
              <div className="text-[11px] text-slate-500">Direction Provinciale d'Oujda-Angad · مقر عاصمة الجهة</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">2. المديرية الإقليمية ببركان (BERKANE)</div>
              <div className="text-[11px] text-slate-500">Direction Provinciale de Berkane</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">3. المديرية الإقليمية بالناظور (NADOR)</div>
              <div className="text-[11px] text-slate-500">Direction Provinciale de Nador</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">4. المديرية الإقليمية بالدريوش (DRIOUCH)</div>
              <div className="text-[11px] text-slate-500">Direction Provinciale de Driouch</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">5. المديرية الإقليمية بتاوريرت (TAOURIRT)</div>
              <div className="text-[11px] text-slate-500">Direction Provinciale de Taourirt</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">6. المديرية الإقليمية بجرسيف (GUERCIF)</div>
              <div className="text-[11px] text-slate-500">Direction Provinciale de Guercif</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">7. المديرية الإقليمية بجرادة (JERADA)</div>
              <div className="text-[11px] text-slate-500">Direction Provinciale de Jerada</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">8. المديرية الإقليمية بفكيك (FIGUIG - Bouarfa)</div>
              <div className="text-[11px] text-slate-500">Direction Provinciale de Figuig (Bouarfa)</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              النصوص التنظيمية والمساطر الرسمية
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-500">قطاع التربية الوطنية المغربي</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            الدليل الشامل للمذكرة الوزارية رقم 40 المنظمة للسكن
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            شرح القواعد القانونية، شروط الاستفادة، شبكة التنقيط، ومسطرة الإحالة من المديرية الإقليمية إلى الأكاديمية الجهوية.
          </p>
        </div>

        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
          <BookOpen className="w-6 h-6" />
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const isOpen = openSection === section.id;

          return (
            <div
              key={section.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">{section.title}</h3>
                </div>

                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="p-4 pt-1 border-t border-slate-100 bg-white">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
