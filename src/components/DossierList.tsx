import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Send, 
  UserCheck, 
  FileCheck, 
  Building, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Printer,
  ChevronLeft,
  FolderKanban,
  Lock,
  Stamp,
  MapPin,
  ShieldAlert,
  ArrowRight,
  SlidersHorizontal,
  X,
  Archive
} from 'lucide-react';
import { HousingDossier, DossierStatus } from '../types/housing';
import { useAuth } from '../context/AuthContext';
import { isArchivable, closureAgeLabel, getClosureDate } from '../utils/archive';

interface DossierListProps {
  dossiers: HousingDossier[];
  onSelectDossier: (dossier: HousingDossier) => void;
  onOpenNewDossier: () => void;
  onEditDossier: (dossier: HousingDossier) => void;
  onOpenAudit: (dossier: HousingDossier) => void;
  onPrintDocuments: (dossier: HousingDossier) => void;
  onDeleteDossier: (id: string) => void;
  onArchiveDossier?: (id: string) => void;
  onArchiveAllArchivable?: () => void;
}

export const DossierList: React.FC<DossierListProps> = ({
  dossiers,
  onSelectDossier,
  onOpenNewDossier,
  onEditDossier,
  onOpenAudit,
  onPrintDocuments,
  onDeleteDossier,
  onArchiveDossier,
  onArchiveAllArchivable
}) => {
  const { currentUser, permissions } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dpFilter, setDpFilter] = useState<string>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [refFilter, setRefFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');

  // Filter dossiers by role: dp_agent sees ONLY their assigned province!
  const isDpAgent = currentUser.role === 'dp_agent';
  const assignedDp = currentUser.dpNameAr;

  const filteredDossiers = dossiers.filter((item) => {
    // 1. Role-based geographic restriction for dp_agent
    if (isDpAgent && assignedDp) {
      if (!item.candidate.directionProvinciale.includes(assignedDp.replace('المديرية الإقليمية ب', '').replace(' (بوعرفة)', '').trim())) {
        return false;
      }
    }

    const matchesSearch =
      item.candidate.fullNameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidate.fullNameFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidate.ppr.includes(searchQuery) ||
      item.candidate.cin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidate.currentEtablissement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidate.directionProvinciale.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.housingRequest.housingType === typeFilter;
    const matchesDp = isDpAgent
      ? true
      : (dpFilter === 'all' || item.candidate.directionProvinciale.includes(dpFilter));

    // Advanced search: دقيقة per-field criteria, combined with AND
    const matchesRef = !refFilter || item.referenceNumber.toLowerCase().includes(refFilter.toLowerCase());
    const matchesName = !nameFilter ||
      item.candidate.fullNameAr.toLowerCase().includes(nameFilter.toLowerCase()) ||
      item.candidate.fullNameFr.toLowerCase().includes(nameFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesType && matchesDp && matchesRef && matchesName;
  });

  const getStatusBadge = (status: DossierStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>تمت المصادقة والترخيص</span>
          </span>
        );
      case 'transmitted_aref':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            <Send className="w-3.5 h-3.5" />
            <span>محال على الأكاديمية الجهوية (AREF)</span>
          </span>
        );
      case 'under_review_dp':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>قيد التدقيق بالمديرية (DP)</span>
          </span>
        );
      case 'submitted_dp':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
            <Clock className="w-3.5 h-3.5" />
            <span>مودع بمكتب الضبط</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>غير مقبول / غير مستوفٍ</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            <FileText className="w-3.5 h-3.5" />
            <span>مسودة قيد الاستكمال</span>
          </span>
        );
    }
  };

  const countPresentDocuments = (dossier: HousingDossier) => {
    let count = 0;
    if (dossier.documents.demandeManuscrite.present) count++;
    if (dossier.documents.copieCIN.present) count++;
    if (dossier.documents.attestationTravail.present) count++;
    if (dossier.documents.situationFamiliale.present) count++;
    if (dossier.documents.engagementHonneur.present) count++;
    if (dossier.documents.pvInstallation.present) count++;
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Role-Specific Context Notification Banner */}
      {isDpAgent ? (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-blue-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded">
                  1. ممثل المديرية الإقليمية (dp_agent)
                </span>
                <span className="text-xs font-bold text-blue-900">
                  {currentUser.dpNameAr}
                </span>
              </div>
              <p className="text-xs text-blue-800 mt-0.5">
                وفقاً للصلاحيات الممنوحة: يتم عرض وتدبير ملفات وطلبات <strong>{currentUser.dpNameAr}</strong> فقط، مع صلاحية قفل الملفات وإرسالها (Submit) للأكاديمية.
              </p>
            </div>
          </div>
          {permissions.canCreateDossier && (
            <button
              onClick={onOpenNewDossier}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة ملف للإقليم</span>
            </button>
          )}
        </div>
      ) : currentUser.role === 'aref_validator' ? (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  2. مسؤول الأكاديمية الجهوية (aref_validator)
                </span>
                <span className="text-xs font-bold text-emerald-900">
                  المراقب والمدقق الجهوي لملفات السكنيات
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                الاطلاع على الملفات الواردة من المديريات الإقليمية الثمانية للجهة، تدقيق المعطيات والنقط بالمذكرة 40، ومنح الموافقة المبدئية أو الإرجاع للتصحيح.
              </p>
            </div>
          </div>
        </div>
      ) : currentUser.role === 'aref_director' ? (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-amber-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-xs">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  3. مدير الأكاديمية الجهوية (aref_director)
                </span>
                <span className="text-xs font-bold text-amber-900">
                  صاحب القرار النهائي والتوقيعات الرسمية
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                المصادقة النهائية على قوائم الإسناد وملفات المترشحين، وتوليد وطباعة وثائق وعقود الإسناد الرسمية (Arrêté d'attribution PDF).
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-purple-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded">
                  4. المطور / المشرف التقني (dev)
                </span>
                <span className="text-xs font-bold text-purple-900">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-purple-800 mt-0.5">
                صلاحيات كاملة لإدارة المستخدمين، قاعدة البيانات aref_oriental، وإعدادات النظام.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner and Quick Highlights */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              أكاديمية جهة الشرق (AREF Oriental)
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              8 مديريات إقليمية (DPs)
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-500">المذكرة 40</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            سجل طلبات الاستفادة من السكن الوظيفي والإداري - جهة الشرق
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            تدقيق ومتابعة ملفات الترشيح بالمديريات الثماني: وجدة أنكاد، بركان، الناظور، الدريوش، تاوريرت، جرسيف، جرادة، وفكيك بوعرفة.
          </p>
        </div>

        {permissions.canCreateDossier && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenNewDossier}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء ملف ترشيح جديد</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="البحث بالاسم، رقم التأجير (PPR)، بطاقة التعريف (CIN)، المؤسسة، أو رقم الملف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Advanced Search Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer border ${
              showAdvanced
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>بحث متقدم</span>
          </button>

          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            
            {/* DP Directorate Filter (visible if not restricted to single DP) */}
            {!isDpAgent && (
              <select
                value={dpFilter}
                onChange={(e) => setDpFilter(e.target.value)}
                className="py-2 px-3 bg-emerald-50 text-emerald-950 font-semibold border border-emerald-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="all">جميع المديريات الإقليمية (8 DPs)</option>
                <option value="وجدة">وجدة أنكاد (Oujda)</option>
                <option value="بركان">بركان (Berkane)</option>
                <option value="الناظور">الناظور (Nador)</option>
                <option value="الدريوش">الدريوش (Driouch)</option>
                <option value="تاوريرت">تاوريرت (Taourirt)</option>
                <option value="جرسيف">جرسيف (Guercif)</option>
                <option value="جرادة">جرادة (Jerada)</option>
                <option value="فكيك">فكيك - بوعرفة (Figuig)</option>
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option value="all">جميع الحالات الإدارية</option>
              <option value="draft">مسودة</option>
              <option value="under_review_dp">قيد التدقيق بالمديرية (DP)</option>
              <option value="transmitted_aref">محال على الأكاديمية (AREF)</option>
              <option value="approved">مصادق عليه (مرخص)</option>
              <option value="rejected">مرفوض</option>
            </select>

            {/* Housing Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option value="all">جميع أنواع السكن</option>
              <option value="fonction">سكن وظيفي (بحكم الوظيفة)</option>
              <option value="administratif">سكن إداري (حسب الاستحقاق)</option>
            </select>
          </div>
        </div>

        {/* Advanced Search Fields: dispatch number & employee name, DP/type reuse the selects above */}
        {showAdvanced && (
          <div className="flex flex-col md:flex-row gap-3 pt-3 border-t border-slate-100">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="رقم الملف / الإرسال (Référence)..."
                value={refFilter}
                onChange={(e) => setRefFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="اسم الموظف (عربي أو فرنسي)..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
            </div>
            {(refFilter || nameFilter) && (
              <button
                type="button"
                onClick={() => { setRefFilter(''); setNameFilter(''); }}
                className="py-2 px-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>مسح</span>
              </button>
            )}
          </div>
        )}

        {/* 8 DPs Quick Chips (Only shown for Regional and Dev users) */}
        {!isDpAgent && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 ml-1">مديريات الشرق:</span>
            {[
              { key: 'all', label: 'الكل (8)' },
              { key: 'وجدة', label: 'وجدة أنكاد' },
              { key: 'بركان', label: 'بركان' },
              { key: 'الناظور', label: 'الناظور' },
              { key: 'الدريوش', label: 'الدريوش' },
              { key: 'تاوريرت', label: 'تاوريرت' },
              { key: 'جرسيف', label: 'جرسيف' },
              { key: 'جرادة', label: 'جرادة' },
              { key: 'فكيك', label: 'فكيك' },
            ].map((chip) => {
              const isSelected = dpFilter === chip.key;
              const count = chip.key === 'all' 
                ? dossiers.length 
                : dossiers.filter(d => d.candidate.directionProvinciale.includes(chip.key)).length;

              return (
                <button
                  key={chip.key}
                  onClick={() => setDpFilter(chip.key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{chip.label}</span>
                  <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick summary line */}
        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
          <span>
            عرض <span className="font-bold text-slate-800">{filteredDossiers.length}</span> من أصل{' '}
            <span className="font-bold text-slate-800">{dossiers.length}</span> ملفات ترشيح
            {isDpAgent && <span className="text-blue-700 font-bold mr-1">({currentUser.dpNameAr})</span>}
          </span>
          <span className="text-slate-400">
            الوثائق المطلوبة: 6 وثائق إلزامية حسب المذكرة 40
          </span>
        </div>
      </div>

      {/* Suggestion banner: dossiers that can be archived (closed > 1 year) */}
      {(() => {
        const archivableCount = dossiers.filter((d) => isArchivable(d)).length;
        if (archivableCount === 0 || !onArchiveDossier) return null;
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3 text-amber-900">
            <div className="flex items-center gap-3">
              <Archive className="w-5 h-5 text-amber-600" />
              <p className="text-xs font-semibold">
                يوجد {archivableCount} ملف(ات) أُغلقت منذ أكثر من سنة ويمكن نقلها للأرشيف لتخفيف القائمة النشطة.
              </p>
            </div>
            {onArchiveAllArchivable && (
              <button
                onClick={onArchiveAllArchivable}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                أرشفة الكل
              </button>
            )}
          </div>
        );
      })()}

      {/* Dossiers Grid / Table */}
      {filteredDossiers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {isDpAgent 
              ? `لا توجد ملفات مسجلة حالياً لـ ${currentUser.dpNameAr}`
              : 'لا توجد ملفات مطابقة لمعايير البحث'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isDpAgent 
              ? 'يمكنك الشروع في إدخال ملفات موظفي إقليمك وتدبير طلباتهم وفق المذكرة 40.'
              : 'يمكنك تعديل كلمات البحث أو الفلاتر.'}
          </p>
          {permissions.canCreateDossier && (
            <button
              onClick={onOpenNewDossier}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة ملف الآن</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDossiers.map((dossier) => {
            const docsCount = countPresentDocuments(dossier);
            const isComplete = docsCount === 6;

            return (
              <div
                key={dossier.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs hover:shadow-xs p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left (RTL Start): Candidate and Request Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {dossier.referenceNumber}
                      </span>
                      {getStatusBadge(dossier.status)}
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        dossier.housingRequest.housingType === 'fonction'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}>
                        {dossier.housingRequest.housingType === 'fonction'
                          ? 'سكن وظيفي (ضرورة المصلحة)'
                          : 'سكن إداري (شبكة التنقيط)'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        تاريخ الإنشاء: {dossier.creationDate}
                      </span>
                    </div>

                    {/* Candidate Name & Position */}
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {dossier.candidate.fullNameAr}
                      </h2>
                      <span className="text-xs text-slate-500 font-sans" dir="ltr">
                        ({dossier.candidate.fullNameFr})
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {dossier.candidate.grade}
                      </span>
                      <span className="text-xs text-slate-600">
                        السلم: <strong className="text-slate-900">{dossier.candidate.scale}</strong> · الرتبة: {dossier.candidate.echelon}
                      </span>
                    </div>

                    {/* School & Geographic Info */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>مقر العمل: <strong>{dossier.candidate.currentEtablissement}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">PPR:</span>
                        <span className="font-mono font-semibold text-slate-800">{dossier.candidate.ppr}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">CIN:</span>
                        <span className="font-mono font-semibold text-slate-800">{dossier.candidate.cin}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold text-slate-800">{dossier.candidate.directionProvinciale}</span>
                      </div>
                    </div>

                    {/* Documents Readiness & Barème Points */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {/* Documents counter */}
                      <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${
                        isComplete 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>الوثائق المطلوبة: <strong>{docsCount} / 6</strong></span>
                        {isComplete ? (
                          <span className="text-[10px] text-emerald-600 font-normal">(الملف مكتمل)</span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-normal">({6 - docsCount} وثائق متبقية)</span>
                        )}
                      </div>

                      {/* Barème points badge */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                        {dossier.housingRequest.housingType === 'fonction' ? (
                          <>
                            <span className="font-bold text-slate-900 text-sm">بدون تنقيط</span>
                            <span className="text-[10px] text-slate-500">(يُسند بحكم المسؤولية)</span>
                          </>
                        ) : (
                          <>
                            <span>مجموع النقط:</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {dossier.bareme.totalPts}
                            </span>
                            <span className="text-[10px] text-slate-500">نقطة بالشبكة المعيارية</span>
                          </>
                        )}
                      </div>

                      {/* Housing Spec */}
                      <div className="text-xs text-slate-500">
                        السكن المطلوب: <span className="font-medium text-slate-700">{dossier.housingRequest.housingCategory}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right (RTL End): Action Buttons adapted to User Role */}
                  <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      onClick={() => onSelectDossier(dossier)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>معاينة الملف والوثائق</span>
                    </button>

                    {/* Role 1 Action: Submit / Lock Dossier to AREF */}
                    {isDpAgent && (dossier.status === 'draft' || dossier.status === 'under_review_dp') && (
                      <button
                        onClick={() => onOpenAudit(dossier)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        title="قفل الملف وإرساله رسمياً إلى الأكاديمية الجهوية (AREF)"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>قفل وإرسال إلى AREF</span>
                      </button>
                    )}

                    {/* Role 2 Action: AREF Validator Audit */}
                    {currentUser.role === 'aref_validator' && (
                      <button
                        onClick={() => onOpenAudit(dossier)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>تدقيق وفحص النقط (AREF)</span>
                      </button>
                    )}

                    {/* Role 3 Action: AREF Director Signature / Official Attribution Decree */}
                    {currentUser.role === 'aref_director' && (
                      <button
                        onClick={() => {
                          if (dossier.status === 'approved') {
                            onPrintDocuments(dossier);
                          } else {
                            onOpenAudit(dossier);
                          }
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <Stamp className="w-3.5 h-3.5" />
                        <span>{dossier.status === 'approved' ? 'طباعة قرار الإسناد (PDF)' : 'المصادقة والتوقيع الرسمي'}</span>
                      </button>
                    )}

                    {/* General Print button */}
                    <button
                      onClick={() => onPrintDocuments(dossier)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{currentUser.role === 'aref_director' ? 'عقد الإسناد الرسمي' : 'طباعة الوثائق الرسمية'}</span>
                    </button>

                    {/* Audit Trail Button for other roles */}
                    {!isDpAgent && currentUser.role !== 'aref_validator' && currentUser.role !== 'aref_director' && (
                      <button
                        onClick={() => onOpenAudit(dossier)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-blue-600" />
                        <span>تدقيق ومسار DP/AREF</span>
                      </button>
                    )}

                    {/* Edit and Delete if allowed */}
                    <div className="flex items-center gap-2 justify-end pt-1">
                      {onArchiveDossier && isArchivable(dossier) && (
                        <button
                          onClick={() => onArchiveDossier(dossier.id)}
                          title={`أرشفة الملف (مغلق منذ ${closureAgeLabel(dossier)})`}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {permissions.canEditDossier && (
                        <button
                          onClick={() => onEditDossier(dossier)}
                          title="تعديل بيانات الملف"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {permissions.canDeleteDossier && (
                        <button
                          onClick={() => onDeleteDossier(dossier.id)}
                          title="حذف الملف"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

