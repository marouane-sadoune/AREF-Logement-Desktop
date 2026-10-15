import {
  AdministrativeResponsibility,
  CandidateInfo,
  SituationFamilialeInfo,
  HousingRequestInfo,
  BaremePoints,
  PerformanceRating,
} from '../types/housing';

// ====== شبكة التنقيط الرسمية - المذكرة الوزارية رقم 40 ======
// سبعة معايير، كل معيار يُنقّط وفق سلّم رسمي ثابت.
// عند التعادل: تُرجَّح الأقدمية العامة، ثم يُلجأ إلى القرعة.

// 1. الإطار (حسب السلم الإداري)
const SCALE_PTS: Record<string, number> = {
  low: 1,   // السلم 1-6
  mid: 2,   // السلم 7-8-9
  high: 3,  // السلم 10 فما فوق وخارج السلم
};

// 6. المردودية (تقييم الرئيس المباشر): جيد جدا 4 / جيد 2 / مستحسن 1 / دون المستحسن 0
const PERFORMANCE_PTS: Record<PerformanceRating, number> = {
  excellent: 4,    // جيد جدا
  good: 2,         // جيد
  satisfactory: 1, // مستحسن
  below: 0,        // دون المستحسن
};

// 5. المسؤولية الإدارية: رئيس قسم 3 / رئيس مصلحة 2
const RESPONSIBILITY_PTS: Record<AdministrativeResponsibility, number> = {
  none: 0,
  chef_service: 2,
  chef_division: 3,
};

// التحملات العائلية: الزوج(ة) بدون عمل 3 نقط، الراتب الوحيد 2 نقط، نقطة عن كل طفل في حدود 3
const SPOUSE_NO_WORK_PTS = 3;
const SOLE_INCOME_PTS = 2;
const CHILD_PTS = 1;
const CHILDREN_CAP = 3;

function scalePoints(scale: number): number {
  const s = Number(scale) || 0;
  if (s >= 10 || s === 99) return SCALE_PTS.high; // سلم 10-11 + خارج السلم = 3
  if (s >= 7) return SCALE_PTS.mid;              // سلم 7-8-9 = 2
  return SCALE_PTS.low;                           // سلم 1-6 = 1
}

// 2. الأقدمية العامة: سلّم من 6 أشطر (من 1 سنة إلى 25 سنة فأكثر)
function generalSeniorityPoints(years: number): number {
  const y = Number(years) || 0;
  if (y >= 25) return 6;
  if (y >= 20) return 5;
  if (y >= 15) return 4;
  if (y >= 10) return 3;
  if (y >= 5) return 2;
  if (y >= 1) return 1;
  return 0;
}

// 3. الأقدمية بنفس المدينة: من سنة إلى 5 = 1، من 6 سنوات فما فوق = 2
function localitySeniorityPoints(years: number): number {
  const y = Number(years) || 0;
  if (y >= 6) return 2;
  if (y >= 1) return 1;
  return 0;
}

// 5. المسؤولية: تُقرأ من الجواب الصريح في الملف، لا من عنوان المهمة.
function responsibilityPoints(responsibility?: AdministrativeResponsibility): number {
  return RESPONSIBILITY_PTS[responsibility ?? 'none'] ?? 0;
}

// 7. الوسط القروي: معلمة غير متزوجة = 3، مدرس بفرعية = 2
function ruralPoints(
  candidate: Partial<CandidateInfo>,
  family: Partial<SituationFamilialeInfo>
): number {
  const branchTeacher = candidate.isRuralBranch === true;
  const unmarriedFemaleRural =
    candidate.isRuralArea === true &&
    candidate.gender === 'female' &&
    family.maritalStatus === 'celibataire';
  // يُمنح الأعلى فقط (لا يُجمع الامتيازان)
  if (unmarriedFemaleRural) return 3;
  if (branchTeacher) return 2;
  return 0;
}

export function calculateBareme(
  candidate: Partial<CandidateInfo>,
  family: Partial<SituationFamilialeInfo>,
  housing: Partial<HousingRequestInfo>
): BaremePoints {
  // 1. الإطار
  const scalePts = scalePoints(Number(candidate.scale));

  // 2. الأقدمية العامة
  const seniorityGeneralPts = generalSeniorityPoints(Number(candidate.seniorityGeneral));

  // 3. الأقدمية بنفس المدينة / المؤسسة
  const seniorityEtablissementPts = localitySeniorityPoints(Number(candidate.seniorityEtablissement));

  // 4. التحملات العائلية
  //    - نقطة عن كل طفل في حدود 3 أطفال
  const childrenCount = Number(family.childrenCount) || 0;
  const childrenPts = Math.min(childrenCount, CHILDREN_CAP) * CHILD_PTS;
  //    - 3 نقط عن الزوج(ة) الذي(ة) لا يمارس(ت) أي مهنة
  const spousePts =
    family.maritalStatus === 'marie' && family.spouseOccupation === 'no_work'
      ? SPOUSE_NO_WORK_PTS
      : 0;
  const maritalPts = spousePts;
  //    - نقطتان عن الراتب الوحيد (أسرة لا معيل لها إلا براتب واحد)
  const soleIncomePts = family.soleFamilyIncome ? SOLE_INCOME_PTS : 0;

  // 5. المسؤولية
  const responsibilityBonus = responsibilityPoints(candidate.responsibility);

  // 6. المردودية
  const performancePts = PERFORMANCE_PTS[candidate.performanceRating ?? 'satisfactory'];

  // 7. الوسط القروي
  const ruralBonusPts = ruralPoints(candidate, family);

  const totalPts =
    scalePts +
    seniorityGeneralPts +
    seniorityEtablissementPts +
    maritalPts +
    soleIncomePts +
    childrenPts +
    responsibilityBonus +
    performancePts +
    ruralBonusPts;

  // `housing` is part of the official signature (context of the request) but the
  // Note 40 grid does not score it directly; referenced to keep callers stable.
  void housing;

  return {
    seniorityGeneralPts,
    seniorityEtablissementPts,
    scalePts,
    maritalPts,
    soleIncomePts,
    childrenPts,
    responsibilityBonus,
    performancePts,
    ruralBonusPts,
    totalPts,
  };
}

/**
 * ترتيب المترشحين وفق المذكرة 40:
 * المجموع تنازليا، ثم الأقدمية العامة تنازليا عند التعادل.
 * يبقى التساوي تاما بعد الأقدمية: الفصل بالقرعة داخل لجنة الإسناد،
 * والترتيب الأبجدي هنا يثبت فقط ترتيب العرض على الورق.
 */
export function compareBareme(
  a: { bareme: BaremePoints; candidate: CandidateInfo },
  b: { bareme: BaremePoints; candidate: CandidateInfo }
): number {
  if (b.bareme.totalPts !== a.bareme.totalPts) return b.bareme.totalPts - a.bareme.totalPts;
  const sa = Number(a.candidate.seniorityGeneral) || 0;
  const sb = Number(b.candidate.seniorityGeneral) || 0;
  if (sb !== sa) return sb - sa;
  return a.candidate.fullNameAr.localeCompare(b.candidate.fullNameAr, 'ar');
}

// هل تساوى مرشحان في النقط والأقدمية؟ عندئذ لا يقرر الورق الترتيب: القرعة.
export function isTiedWith(
  a: { bareme: BaremePoints; candidate: CandidateInfo },
  b: { bareme: BaremePoints; candidate: CandidateInfo }
): boolean {
  return (
    a.bareme.totalPts === b.bareme.totalPts &&
    (Number(a.candidate.seniorityGeneral) || 0) === (Number(b.candidate.seniorityGeneral) || 0)
  );
}
