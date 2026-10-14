export type MaritalStatus = 'celibataire' | 'marie' | 'divorce' | 'veuf';

export type HousingType = 'fonction' | 'administratif';

// تقييم مردودية الموظف (يُعبَّأ من طرف الرئيس المباشر) - المذكرة 40
export type PerformanceRating = 'excellent' | 'good' | 'satisfactory' | 'below';

export const PERFORMANCE_RATING_LABELS: Record<PerformanceRating, string> = {
  excellent: 'جيد جدا',
  good: 'جيد',
  satisfactory: 'مستحسن',
  below: 'دون المستحسن',
};

export type DossierStatus = 
  | 'draft'              // مسودة
  | 'submitted_dp'        // مودع بالمديرية الإقليمية
  | 'under_review_dp'    // قيد التدقيق بالمديرية الإقليمية
  | 'transmitted_aref'   // محال على الأكاديمية الجهوية
  | 'approved'           // تمت المصادقة ومنح السكن
  | 'rejected';          // مرفوض / غير مستوفي للشروط

export interface RequiredDocumentStatus {
  present: boolean;
  date?: string;
  notes?: string;
  fileName?: string;
  isLegalized?: boolean;
  dateLegalized?: string;
  pvNumber?: string;
  installationDate?: string;
}

export interface SituationFamilialeDocs {
  present: boolean;
  marriageCert: boolean;
  marriageCertFileName?: string;
  spouseAttestation: boolean;
  spouseAttestationFileName?: string;
  childrenCertificates: boolean;
  childrenCertificatesFileName?: string;
  childrenCertificatesFileNames?: string[];
  notes?: string;
  fileName?: string;
}

export interface CandidateInfo {
  fullNameAr: string;
  fullNameFr: string;
  cin: string;
  gender?: 'male' | 'female';
  ppr: string; // Numéro de SOM / رقم التأجير
  phone: string;
  email: string;
  grade: string; // الإطار
  scale: number; // السلم (9, 10, 11, خارج السلم)
  echelon: number; // الرتبة
  seniorityGeneral: number; // الأقدمية العامة (سنوات)
  seniorityEtablissement: number; // الأقدمية بالمؤسسة الحالية (سنوات)
  installationDate: string; // تاريخ التعيين / الالتحاق بالمؤسسة
  currentEtablissement: string; // المؤسسة التعليمية الحالية
  etablissementType: string; // ابتدائي، ثانوي إعدادي، ثانوي تأهيلي، مصلحة إدارية
  commune: string;
  directionProvinciale: string; // المديرية الإقليمية (DP)
  aref: string; // الأكاديمية الجهوية للتربية والتكوين (AREF)
  performanceRating?: PerformanceRating; // المردودية (المعيار 6)
  isRuralArea?: boolean; // المؤسسة بالوسط القروي (المعيار 7)
  isRuralBranch?: boolean; // مدرس بفرعية (المعيار 7)
}

export interface SituationFamilialeInfo {
  maritalStatus: MaritalStatus;
  spouseName?: string;
  spouseIsPublicOfficial: boolean;
  spouseAdministration?: string;
  spousePPR?: string;
  childrenCount: number;
}

export interface HousingRequestInfo {
  housingType: HousingType; // وظيفي أو إداري
  targetEtablissement: string;
  housingCategory: string; // شقة، فيلا، سكن ملحق
  housingAddress: string;
  housingNumber?: string;
  housingStatus: 'vacant' | 'occupied_to_evict' | 'under_maintenance';
  reasons: string; // دواعي الطلب
}

export interface RequiredDocumentsChecklist {
  demandeManuscrite: RequiredDocumentStatus;
  copieCIN: RequiredDocumentStatus;
  attestationTravail: RequiredDocumentStatus;
  situationFamiliale: SituationFamilialeDocs;
  engagementHonneur: RequiredDocumentStatus;
  pvInstallation: RequiredDocumentStatus;
  // مسطرة السكن الوظيفي (المذكرة 40): المطبوع 5 بطاقة المعاينة و المطبوع 9 بطاقة المراقبة.
  ficheVisite?: RequiredDocumentStatus;
  ficheControle?: RequiredDocumentStatus;
}

// الوثائق الإلزامية حسب نوع السكن: الوظيفي بلا تباري ولا تنقيط، الإداري بملف كامل.
export const DOCUMENTS_BY_HOUSING_TYPE: Record<'fonction' | 'administratif', (keyof RequiredDocumentsChecklist)[]> = {
  fonction: ['engagementHonneur', 'ficheVisite', 'ficheControle'],
  administratif: [
    'demandeManuscrite',
    'copieCIN',
    'attestationTravail',
    'situationFamiliale',
    'engagementHonneur',
    'pvInstallation',
  ],
};

// العازب(ة) لا يُطلب منه(ها) وثيقة الوضع العائلي: تُحذف من اللازمة.
export const requiredDocumentKeys = (
  housingType: HousingType,
  maritalStatus?: MaritalStatus
): (keyof RequiredDocumentsChecklist)[] => {
  const keys = DOCUMENTS_BY_HOUSING_TYPE[housingType === 'fonction' ? 'fonction' : 'administratif'];
  if (housingType !== 'fonction' && maritalStatus === 'celibataire') {
    return keys.filter((k) => k !== 'situationFamiliale');
  }
  return keys;
};

export interface BaremePoints {
  seniorityGeneralPts: number;
  seniorityEtablissementPts: number;
  scalePts: number;
  maritalPts: number;
  childrenPts: number;
  responsibilityBonus: number;
  performancePts?: number;   // المردودية (المعيار 6)
  ruralBonusPts?: number;    // الوسط القروي (المعيار 7)
  totalPts: number;
}

export interface AuditHistoryEntry {
  stage: 'creation' | 'submission_dp' | 'audit_dp' | 'transmission_aref' | 'commission_aref' | 'final_decision';
  date: string;
  actor: string;
  decision: string;
  comment: string;
}

export interface HousingDossier {
  id: string;
  referenceNumber: string;
  creationDate: string;
  status: DossierStatus;
  candidate: CandidateInfo;
  situationFamiliale: SituationFamilialeInfo;
  housingRequest: HousingRequestInfo;
  documents: RequiredDocumentsChecklist;
  bareme: BaremePoints;
  auditHistory: AuditHistoryEntry[];
  registreLogementId?: number | null;
  logement?: RegistreLogement | null;
  dpAudit?: {
    auditedBy?: string;
    auditDate?: string;
    isComplete: boolean;
    dpNotes?: string;
    bordereauNumber?: string;
    transmissionDate?: string;
  };
  arefDecision?: {
    commissionDate?: string;
    commissionDecision?: 'accord' | 'refus' | 'en_attente';
    decisionNumber?: string;
    pvDecisionDate?: string;
    arefNotes?: string;
  };
}

export const MOROCCAN_AREFS = [
  'الأكاديمية الجهوية للتربية والتكوين - جهة الشرق (AREF Oriental)'
];

export interface DirectorateMeta {
  code: string;
  nameAr: string;
  nameFr: string;
  chiefTown: string;
}

export const ORIENTAL_DIRECTORATES: DirectorateMeta[] = [
  { code: 'OUJ', nameAr: 'المديرية الإقليمية بوجدة أنكاد', nameFr: 'Direction Provinciale d\'Oujda-Angad', chiefTown: 'وجدة (Oujda)' },
  { code: 'BRK', nameAr: 'المديرية الإقليمية ببركان', nameFr: 'Direction Provinciale de Berkane', chiefTown: 'بركان (Berkane)' },
  { code: 'NAD', nameAr: 'المديرية الإقليمية بالناظور', nameFr: 'Direction Provinciale de Nador', chiefTown: 'الناظور (Nador)' },
  { code: 'DRI', nameAr: 'المديرية الإقليمية بالدريوش', nameFr: 'Direction Provinciale de Driouch', chiefTown: 'الدريوش (Driouch)' },
  { code: 'TAO', nameAr: 'المديرية الإقليمية بتاوريرت', nameFr: 'Direction Provinciale de Taourirt', chiefTown: 'تاوريرت (Taourirt)' },
  { code: 'GUE', nameAr: 'المديرية الإقليمية بجرسيف', nameFr: 'Direction Provinciale de Guercif', chiefTown: 'جرسيف (Guercif)' },
  { code: 'JER', nameAr: 'المديرية الإقليمية بجرادة', nameFr: 'Direction Provinciale de Jerada', chiefTown: 'جرادة (Jerada)' },
  { code: 'FIG', nameAr: 'المديرية الإقليمية بفكيك (بوعرفة)', nameFr: 'Direction Provinciale de Figuig (Bouarfa)', chiefTown: 'فكيك / بوعرفة (Figuig)' }
];

export const MOROCCAN_DIRECTORATES = ORIENTAL_DIRECTORATES.map(d => d.nameAr);


export const MOROCCAN_GRADES = [
  'مدير ثانوية تأهيلية',
  'مدير ثانوية إعدادية',
  'مدير مدرسة ابتدائية',
  'ناظر الدروس',
  'رئيس أشغال',
  'حارس عام للخارجية',
  'حارس عام للداخلية',
  'مسير المصالح المادية والمالية (مقتصد)',
  'أستاذ التعليم الثانوي التأهيلي',
  'أستاذ التعليم الثانوي الإعدادي',
  'أستاذ التعليم الابتدائي',
  'ملحق تربوي',
  'ملحق الإدارة والاقتصاد',
  'ملحق اجتماعي',
  'مفتش تربوي للتعليم الثانوي',
  'مفتش المصالح المادية والمالية',
  'متصرف تربوي'
];

// ===== المحور 4 من المذكرة 40: إفراغ المساكن الإدارية والوظيفية =====

export type EvictionCaseType =
  | 'cessation_travail'          // الانقطاع عن العمل (أجل شهران)
  | 'retraite'                   // الإحالة على التقاعد (يمدد إلى تسلم المعاش)
  | 'fin_mission'                // إنهاء المهام التي من أجلها أسند السكن
  | 'occupation_non_personnelle' // عدم شغل السكن بصفة شخصية وفعلية (فوري)
  | 'logement_personnel';        // المسكن بالفعل توفر على مسكن شخصي (أجل سنة)

export type EvictionStatus =
  | 'notified'     // تم إشعار المعني بالأمر
  | 'vacated'      // تم الإفراغ
  | 'refused'      // امتناع عن الإفراغ
  | 'rent_applied' // فرض سومة كرائية حقيقية
  | 'disciplinary' // متابعة تأديبية
  | 'judicial';    // متابعة قضائية

export interface EvictionProcedure {
  id: number;
  numero_dossier: string;
  case_type: EvictionCaseType;
  trigger_date: string;
  deadline_months: number;
  deadline_date: string | null;
  deadline_extended: boolean;
  status: EvictionStatus;
  notice_sent_date?: string | null;
  vacate_date?: string | null;
  rent_amount?: number | null;
  notes?: string | null;
}

export const EVICTION_CASE_LABELS: Record<EvictionCaseType, string> = {
  cessation_travail: 'الانقطاع عن العمل (أجل شهران)',
  retraite: 'الإحالة على التقاعد (يمدد إلى تسلم المعاش)',
  fin_mission: 'إنهاء المهام التي من أجلها أسند السكن',
  occupation_non_personnelle: 'عدم شغل السكن بصفة شخصية وفعلية (فوري)',
  logement_personnel: 'التوفر على مسكن شخصي بنفس المدينة (أجل سنة)',
};

export const EVICTION_STATUS_LABELS: Record<EvictionStatus, string> = {
  notified: 'تم الإشعار بالإفراغ',
  vacated: 'تم الإفراغ',
  refused: 'امتناع عن الإفراغ',
  rent_applied: 'فرض سومة كرائية حقيقية',
  disciplinary: 'متابعة تأديبية',
  judicial: 'متابعة قضائية',
};

// ===== المسجل المركزي للمساكن (Registre des Logements — المذكرة 40) =====

export type LogementStatut = 'vacant' | 'occupe' | 'en_maintenance' | 'reserve' | 'desaffecte';
export type EtatBatiment = 'bon' | 'moyen' | 'mauvais' | 'ruine';

export interface RegistreLogement {
  id: number;
  numero_logement: string;
  etablissement: string;
  direction_provinciale: string;
  type_logement: HousingType;
  categorie: string;
  adresse: string | null;
  nombre_pieces: number;
  capacite_personnes: number;
  statut: LogementStatut;
  occupant_ppr: string | null;
  date_attribution: string | null;
  date_liberation: string | null;
  motif_vacance: string | null;
  etat_batiment: EtatBatiment;
  observations: string | null;
  updated_at?: string;
}

export const LOGEMENT_STATUT_LABELS: Record<LogementStatut, string> = {
  vacant: 'شاغر',
  occupe: 'مشغول',
  en_maintenance: 'قيد الصيانة',
  reserve: 'محجوز',
  desaffecte: 'غير صالح',
};

export const ETAT_BATIMENT_LABELS: Record<EtatBatiment, string> = {
  bon: 'جيد',
  moyen: 'متوسط',
  mauvais: 'سيئ',
  ruine: 'آيل للسقوط',
};
