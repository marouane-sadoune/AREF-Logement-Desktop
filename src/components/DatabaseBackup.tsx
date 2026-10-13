import React, { useRef, useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  FileSpreadsheet, 
  ShieldCheck,
  HardDrive,
  Copy,
  Printer
} from 'lucide-react';
import { HousingDossier } from '../types/housing';
import { INITIAL_DOSSIERS } from '../data/mockDossiers';

interface DatabaseBackupProps {
  dossiers: HousingDossier[];
  onImportDossiers: (newDossiers: HousingDossier[]) => void;
  onResetDossiers: () => void;
}

export const DatabaseBackup: React.FC<DatabaseBackupProps> = ({
  dossiers,
  onImportDossiers,
  onResetDossiers
}) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(dossiers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Logements_Note40_Dossiers_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMsg('تم تصدير قاعدة البيانات بنجاح إلى ملف JSON.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportDossiers(parsed);
          setSuccessMsg(`تم استيراد ${parsed.length} ملف ترشيح بنجاح.`);
          setTimeout(() => setSuccessMsg(null), 3500);
        } else {
          alert('الملف المحدد لا يحتوي على بنية بيانات صحيحة لملفات الترشيح.');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة ملف JSON. تأكد من سلامة الملف.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              إدارة البيانات والنسخ الاحتياطي
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-500">قاعدة بيانات محلية آمنة (Local Desktop Storage)</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            النسخ الاحتياطي وتصدير سجلات السكن الوظيفي
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            إمكانية حفظ نسخة احتياطية محلية، استرجاع السجلات السابقة، وطباعة اللائحة الإجمالية للمترشحين.
          </p>
        </div>

        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
          <Database className="w-6 h-6" />
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid of Backup Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Export JSON */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">تصدير قاعدة البيانات (JSON)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              تحميل كافة ملفات الترشيح والوثائق والتدقيقات في ملف مستقل لحفظها خارجياً أو نقلها لحاسوب آخر.
            </p>
          </div>

          <button
            onClick={handleExportJSON}
            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل ملف النسخ الاحتياطي (.json)</span>
          </button>
        </div>

        {/* Import JSON */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">استيراد سجلات سابقة</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              استرجاع بيانات سابقة تم تصديرها بصيغة JSON ودمجها مباشرة في التطبيق المكتبي.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>استعراض واستيراد ملف JSON</span>
            </button>
          </div>
        </div>

        {/* Reset / Demo Data */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">إعادة ضبط البيانات النموذجية</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              استعادة ملفات الترشيح التوضيحية الجاهزة للمذكرة 40 للتجربة والاستئناس.
            </p>
          </div>

          <button
            onClick={() => {
              if (window.confirm('هل أنت متأكد من رغبتك في استعادة الملفات النموذجية الافتراضية؟')) {
                onResetDossiers();
                setSuccessMsg('تمت استعادة الملفات النموذجية بنجاح.');
                setTimeout(() => setSuccessMsg(null), 3000);
              }
            }}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>استرجاع النماذج الأولية</span>
          </button>
        </div>
      </div>

      {/* Summary Table for Official Archiving & Print */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>لائحة المعاينة الإجمالية لملفات الترشيح المسجلة</span>
            </h3>
            <p className="text-xs text-slate-500">
              ملخص كامل لملفات السكن الوظيفي والإداري، شبكة التنقيط، وحالة البث بالمديرية والأكاديمية.
            </p>
          </div>

          <button
            onClick={handlePrintSummary}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة اللائحة الإجمالية</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-2 border border-slate-200">رقم الملف</th>
                <th className="p-2 border border-slate-200 text-right">المترشح (الاسم والإطار)</th>
                <th className="p-2 border border-slate-200">رقم التأجير</th>
                <th className="p-2 border border-slate-200">المؤسسة والسكن</th>
                <th className="p-2 border border-slate-200">النوع</th>
                <th className="p-2 border border-slate-200">الوثائق</th>
                <th className="p-2 border border-slate-200">نقط الاستحقاق</th>
                <th className="p-2 border border-slate-200">الحالة الإدارية</th>
              </tr>
            </thead>
            <tbody>
              {dossiers.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-200 font-mono text-[11px]">{d.referenceNumber}</td>
                  <td className="p-2 border border-slate-200 text-right">
                    <div className="font-bold text-slate-900">{d.candidate.fullNameAr}</div>
                    <div className="text-[10px] text-slate-500">{d.candidate.grade}</div>
                  </td>
                  <td className="p-2 border border-slate-200 font-mono">{d.candidate.ppr}</td>
                  <td className="p-2 border border-slate-200">
                    <div>{d.candidate.currentEtablissement}</div>
                    <div className="text-[10px] text-slate-400">{d.housingRequest.housingCategory}</div>
                  </td>
                  <td className="p-2 border border-slate-200">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      d.housingRequest.housingType === 'fonction'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-blue-100 text-blue-900'
                    }`}>
                      {d.housingRequest.housingType === 'fonction' ? 'وظيفي' : 'إداري'}
                    </span>
                  </td>
                  <td className="p-2 border border-slate-200 font-mono font-bold text-emerald-800">
                    {Object.values(d.documents).filter(doc => doc.present).length} / 6
                  </td>
                  <td className="p-2 border border-slate-200 font-mono font-bold text-slate-900">
                    {d.bareme.totalPts}
                  </td>
                  <td className="p-2 border border-slate-200 text-[11px]">
                    {d.status === 'approved' && <span className="text-emerald-700 font-semibold">مصادق عليه</span>}
                    {d.status === 'transmitted_aref' && <span className="text-blue-700 font-semibold">محال على الأكاديمية</span>}
                    {d.status === 'under_review_dp' && <span className="text-amber-700 font-semibold">تدقيق بالمديرية</span>}
                    {d.status === 'submitted_dp' && <span className="text-purple-700">مودع</span>}
                    {d.status === 'draft' && <span className="text-slate-500">مسودة</span>}
                    {d.status === 'rejected' && <span className="text-rose-600">مرفوض</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
