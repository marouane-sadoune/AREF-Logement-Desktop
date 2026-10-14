import React from 'react';
import { HousingDossier } from '../types/housing';

interface OfficialFormSheetProps {
  dossier: HousingDossier;
  dossiers: HousingDossier[];
  formId: string; // official_1 .. official_9
}

// خانة فارغة تُملأ يدويا بعد الطبع (نقطة منقطة)
const Blank: React.FC<{ w?: string }> = ({ w = '90px' }) => (
  <span className="inline-block align-bottom border-b border-dotted border-slate-600" style={{ minWidth: w }}>
    &nbsp;
  </span>
);

const cell = 'border border-slate-400 p-1.5 align-top';
const th = 'border border-slate-400 p-1.5 bg-slate-100 font-bold';

export const OfficialFormSheet: React.FC<OfficialFormSheetProps> = ({ dossier, dossiers, formId }) => {
  const c = dossier.candidate;
  const f = dossier.situationFamiliale;
  const h = dossier.housingRequest;

  const maritalLabel =
    f.maritalStatus === 'marie' ? 'متزوج(ة)' : f.maritalStatus === 'divorce' ? 'مطلق(ة)' : f.maritalStatus === 'veuf' ? 'أرمل(ة)' : 'أعزب';

  /* ============ المطبوع 1: طلب المشاركة في التباري ============ */
  if (formId === 'official_1') {
    return (
      <div className="space-y-5 text-xs font-sans leading-relaxed">
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold border-b-2 border-slate-900 inline-block pb-1">طلب المشاركة في التباري للحصول على سكن إداري</h3>
          <div className="text-[11px] text-slate-600">(المطبوع رقم 1 - المذكرة الوزارية 40)</div>
        </div>

        <div className="flex justify-between text-[11px]">
          <div>الرقم المخزني للمسكن (يعبأ من طرف الإدارة): <Blank /></div>
          <div>عنوانه: <Blank w="160px" /></div>
        </div>

        <div className="space-y-2 border border-slate-300 p-3 rounded">
          <div className="font-bold">أنا الموقع(ة) أسفله:</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <div>الاسم والنسب: <strong>{c.fullNameAr}</strong></div>
            <div>تاريخ التوظيف: <Blank /></div>
            <div>مقر العمل: <strong>{c.currentEtablissement}</strong></div>
            <div>الإطار: <strong>{c.grade}</strong></div>
            <div>السلم: <strong>{c.scale}</strong> · رقم التأجير: <strong>{c.ppr}</strong></div>
            <div>عنوان الإقامة: <Blank w="140px" /></div>
          </div>
          <div>
            الحالة العائلية: <strong>{maritalLabel}</strong> (أعزب - متزوج(ة) - مطلق(ة) - أرمل(ة))
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
            <div>مهنة الزوج(ة): {f.spouseName ? (f.spouseIsPublicOfficial ? f.spouseAdministration || 'موظف(ة)' : 'بدون عمل') : <Blank />}</div>
            <div>مقر عمل الزوج(ة): <Blank /></div>
            <div>عدد الأطفال: <strong>{f.childrenCount}</strong></div>
          </div>
          <div className="grid grid-cols-2 gap-x-6">
            <div>المهمة الحالية: <strong>{c.grade}</strong></div>
            <div>تاريخ الالتحاق بمقر العمل الحالي: <strong>{c.installationDate}</strong></div>
          </div>
        </div>

        <div className="text-justify space-y-2">
          <p>
            أصرح أنني لا أملك أي سكن شخصي في البلدة التي أزاول العمل بها، وأنني لم أتعرض لعقوبة تأديبية لم يتم سحبها، وأن المعلومات التي أدليت بها صحيحة.
          </p>
          <p className="font-bold">- أطلب تسجيلي في مباراة الحصول على السكن الإداري المبين أعلاه.</p>
        </div>

        <div className="flex justify-end pt-4">
          <div className="text-center">
            <div className="font-bold">إمضاء المعني(ة) بالأمر</div>
            <div className="h-16" />
          </div>
        </div>

        {/* خاص بالإدارة */}
        <div className="space-y-2 pt-2 border-t-2 border-slate-400">
          <div className="text-center font-bold bg-slate-100 py-1 border border-slate-400">خـــاص بـــالإدارة</div>
          <p className="text-[11px]">
            تعبأ الخانات 6 و 8 و 9 (أنظر الجدول) من طرف الرئيس المباشر للموظف؛ وتعبأ الخانات المتبقية من طرف المصالح المكلفة بتدبير المساكن المخصصة للوزارة. يرتكز في تقييم مردودية الموظف على مواظبته وحسن سلوكه وإنتاجه وكذا مساهمته في التنشيط الثقافي والتربوي.
          </p>
          <table className="w-full border-collapse text-center">
            <thead>
              <tr>
                <th className={th}>عناصر التقويم</th>
                <th className={th}>النقطة</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={cell}>السلم</td><td className={cell}>&nbsp;</td></tr>
              <tr><td className={cell}>التحملات العائلية أو التراتب (عدد الأطفال / الراتب الوحيد)</td><td className={cell}>&nbsp;</td></tr>
              <tr><td className={cell}>الأقدمية العامة</td><td className={cell}>&nbsp;</td></tr>
              <tr><td className={cell}>الأقدمية في مقر العمل الحالي</td><td className={cell}>&nbsp;</td></tr>
              <tr><td className={cell}>المردودية</td><td className={cell}>&nbsp;</td></tr>
              <tr><td className={cell}>المسؤولية</td><td className={cell}>&nbsp;</td></tr>
              <tr><td className={cell}>أستاذ أو أستاذة مكلف(ة) بمدرسة فرعية</td><td className={cell}>&nbsp;</td></tr>
              <tr><td className={cell}>أستاذة غير متزوجة</td><td className={cell}>&nbsp;</td></tr>
              <tr className="font-bold bg-slate-100"><td className={cell}>مجموع النقط</td><td className={cell}>&nbsp;</td></tr>
            </tbody>
          </table>
          <div className="text-[11px] space-y-1">
            <div>* ملاحظات الرئيس المباشر للموظف بخصوص المردودية: <Blank w="300px" /></div>
            <div className="flex justify-between pt-4">
              <div>خاص بالعاملين بالوسط القروي (أ): <Blank /></div>
              <div className="text-center">إمضاء الرئيس المباشر<div className="h-12" /></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============ المطبوع 2: محضر أشغال لجنة الإسناد ============ */
  if (formId === 'official_2') {
    const competitors = dossiers.filter((d) => d.housingRequest.targetEtablissement === h.targetEtablissement && d.housingRequest.housingType !== 'fonction');
    return (
      <div className="space-y-5 text-xs font-sans leading-relaxed">
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold border-b-2 border-slate-900 inline-block pb-1">محضر أشغال لجنة إسناد المساكن الإدارية</h3>
          <div className="text-[11px] text-slate-600">(المطبوع رقم 2 - المذكرة الوزارية 40)</div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border border-slate-300 p-3 rounded">
          <div>الأكاديمية: <strong>{c.aref}</strong></div>
          <div>المديرية الإقليمية: <strong>{c.directionProvinciale}</strong></div>
          <div>السكن موضوع الإسناد: <strong>{h.targetEtablissement}</strong></div>
          <div>تاريخ انعقاد اللجنة: <Blank /></div>
        </div>

        <p className="text-justify">
          اجتمعت لجنة الإسناد لدراسة ملفات الترشيح الواردة على السكن المذكور أعلاه، على ضوء المعايير المنصوص عليها في المذكرة الوزارية رقم 40، وبعد التداول قررت ما يلي:
        </p>

        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              <th className={th}>رقم الملف</th>
              <th className={th}>الاسم والنسب</th>
              <th className={th}>الإطار</th>
              <th className={th}>السلم</th>
              <th className={th}>الأقدمية العامة</th>
              <th className={th}>التحملات العائلية</th>
              <th className={th}>مجموع النقط</th>
              <th className={th}>الترتيب</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((d, i) => (
              <tr key={d.id} className={d.id === dossier.id ? 'bg-emerald-50 font-bold' : ''}>
                <td className={cell}>{d.referenceNumber}</td>
                <td className={cell}>{d.candidate.fullNameAr}</td>
                <td className={cell}>{d.candidate.grade}</td>
                <td className={cell}>{d.candidate.scale}</td>
                <td className={cell}>{d.candidate.seniorityGeneral}</td>
                <td className={cell}>{d.situationFamiliale.childrenCount} أطفال</td>
                <td className={cell}>{d.bareme.totalPts}</td>
                <td className={cell}>{i + 1}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border border-slate-300 p-3 rounded space-y-2">
          <div className="font-bold">رأي اللجنة:</div>
          <p>
            تقترح اللجنة إسناد السكن المذكور أعلاه إلى السيد(ة): <strong>{competitors[0]?.candidate.fullNameAr || c.fullNameAr}</strong>،
            باعتباره(ا) المرشح(ة) الأعلى ترتيباً وفق شبكة التنقيط المعيارية.
          </p>
          <div className="text-[11px]">في حالة تساوي مرشحين أو أكثر في مجموع النقط يتم الفصل بينهما بالأقدمية في العمل ثم بالقرعة.</div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 text-center text-[11px]">
          <div>رئيس اللجنة<div className="h-14" /></div>
          <div>الأعضاء<div className="h-14" /></div>
          <div>الكاتب(ة)<div className="h-14" /></div>
        </div>
      </div>
    );
  }

  /* ============ المطبوع 3: التزام (وجوبا / بالمجان / بحكم القانون) ============ */
  if (formId === 'official_3') {
    return (
      <div className="space-y-4 text-xs font-sans leading-loose">
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold border-b-2 border-slate-900 inline-block pb-1">إلتزام وتصريح بالشرف</h3>
          <div className="text-[11px] text-slate-600">(المطبوع رقم 3 - خاص بالموظفين المسكنين وجوبا أو بالمجان أو بحكم القانون)</div>
        </div>

        <div className="space-y-1.5">
          <div>أصرح بالشرف أنا الموقع(ة) أسفله: <strong>{c.fullNameAr}</strong></div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <div>الاسم الشخصي: <Blank /></div>
            <div>الاسم العائلي: <Blank /></div>
            <div>رقم بطاقة التعريف الوطنية: <strong>{c.cin}</strong></div>
            <div>رقم التأجير: <strong>{c.ppr}</strong></div>
            <div>إدارة العمل: <strong>{c.currentEtablissement}</strong></div>
          </div>
        </div>

        <p className="text-justify">
          بأني على علم بكافة المقتضيات التنظيمية المتعلقة بالموظفين المسكنين، ولاسيما تلك المنصوص عليها في القرار الوزيري الصادر في 11 شتنبر 1991 حسبما وقع تغييره وتتميمه، والتي منح لي بمقتضاها السكن الإداري الواقع بـ <Blank /> بمدينة <Blank /> حيث أزاول مهامي.
        </p>

        <div className="font-bold">وألتزم:</div>
        <p className="text-justify">
          <strong>أولاً:</strong> بإفراغ المسكن الممنوح لي من طرف الإدارة في أجل شهرين عند الكف عن مزاولتي لمهامي المترتب عن: الاستقالة المقبولة بصفة قانونية؛ الإعفاء؛ العزل؛ التوقيف المؤقت عن العمل (الاستيداع)؛ الانتقال إلى مدينة أخرى؛ الإلحاق؛ الإحالة على التقاعد؛ إنهاء المهمة التي من أجلها أسند إلي السكن الذي أشغله سواء كان هذا الإنهاء من أجل المصلحة أو بطلب مني.
        </p>
        <p className="text-justify">
          <strong>ثانياً:</strong> في مرحلة عدم الامتثال لأمر الإدارة فإني أصبح معرضاً لإفراغ المسكن بالطرق القانونية التي تراها الإدارة مناسبة:
        </p>
        <ul className="list-disc list-inside space-y-1 pr-4">
          <li>تحمل سومة كرائية حقيقية للمسكن الذي أشغله تقوم بتحديدها اللجنة الإدارية للتقويم؛</li>
          <li>المتابعة القضائية؛</li>
          <li>التعرض للعقوبات التأديبية التي تراها الإدارة مناسبة.</li>
        </ul>

        <div className="flex justify-between pt-6">
          <div>حرر بـ <Blank /> في <Blank /></div>
          <div className="text-center">الإمضاء<div className="h-16" /></div>
        </div>
      </div>
    );
  }

  /* ============ المطبوع 4: التزام (المسكنون بالفعل) ============ */
  if (formId === 'official_4') {
    return (
      <div className="space-y-4 text-xs font-sans leading-loose">
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold border-b-2 border-slate-900 inline-block pb-1">إلتزام وتصريح بالشرف</h3>
          <div className="text-[11px] text-slate-600">(المطبوع رقم 4 - خاص بالموظفين المسكنين بالفعل)</div>
        </div>

        <div className="space-y-1.5">
          <div>أصرح بالشرف أنا الموقع(ة) أسفله: <strong>{c.fullNameAr}</strong></div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <div>الاسم الشخصي: <Blank /></div>
            <div>الاسم العائلي: <Blank /></div>
            <div>رقم بطاقة التعريف الوطنية: <strong>{c.cin}</strong></div>
            <div>رقم التأجير: <strong>{c.ppr}</strong></div>
            <div>إدارة العمل: <strong>{c.currentEtablissement}</strong></div>
          </div>
        </div>

        <p className="text-justify">
          بأني على علم بكافة المقتضيات التنظيمية المتعلقة بالموظفين المسكنين، ولاسيما تلك المنصوص عليها في القرار الوزيري الصادر في 11 شتنبر 1991 حسبما وقع تغييره وتتميمه، والتي منح لي في إطارها السكن الإداري الواقع بـ <Blank /> بمدينة <Blank /> حيث أزاول مهامي، وبأني لا أملك مسكناً شخصياً بالمدينة المذكورة.
        </p>

        <div className="font-bold">وألتزم:</div>
        <p className="text-justify">
          <strong>أولاً:</strong> بإفراغ المسكن الممنوح لي من طرف الإدارة في أجل شهرين عند الكف عن مزاولتي لمهامي المترتب عن: الاستقالة المقبولة بصفة قانونية؛ الإعفاء؛ العزل؛ التوقيف المؤقت عن العمل (الاستيداع)؛ الانتقال إلى مدينة أخرى؛ الإلحاق؛ الإحالة على التقاعد.
        </p>
        <p className="text-justify">
          <strong>ثانياً:</strong> بالإدلاء داخل أجل شهر واحد بجميع التغيرات التي تطرأ على أي من العناصر المصرح بها أعلاه، وإلا أصبح معرضاً لإفراغ المسكن بالطرق القانونية التي تراها الإدارة مناسبة:
        </p>
        <ul className="list-disc list-inside space-y-1 pr-4">
          <li>تحمل سومة كرائية حقيقية للمسكن الذي أشغله تقوم بتحديدها اللجنة الإدارية للتقويم؛</li>
          <li>المتابعة القضائية؛</li>
          <li>التعرض للعقوبات التأديبية التي تراها الإدارة مناسبة.</li>
        </ul>

        <div className="flex justify-between pt-6">
          <div>حرر بـ <Blank /> في <Blank /></div>
          <div className="text-center">الإمضاء<div className="h-16" /></div>
        </div>
      </div>
    );
  }

  /* ============ المطبوع 5: بطاقة معاينة السكن ============ */
  if (formId === 'official_5') {
    const conditionElements = [
      'البناء', 'تلبيس الجدران', 'الصباغة', 'تبليط الأرضية', 'المساكة', 'النجارة الخشبية',
      'النجارة الصناعية', 'التجهيزات النحاسية والحديدية', 'الحدادة', 'الزجاج', 'الترصيص',
      'الكهرباء', 'الربط بشبكة الماء الشروب', 'الربط بشبكة الكهرباء', 'الربط بشبكة التطهير',
      'قنوات الواد الحار', 'قنوات الماء الشروب', 'التدفئة المركزية', 'التدفئة الخشبية',
    ];
    const rooms = ['غرفة', 'صالون', 'مطبخ', 'حمام', 'دوش', 'مراحيض', 'مستودع', 'مرأب'];
    return (
      <div className="space-y-4 text-xs font-sans leading-relaxed">
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold border-b-2 border-slate-900 inline-block pb-1">بطاقة معاينة السكن</h3>
          <div className="text-[11px] text-slate-600">(المطبوع رقم 5 - المذكرة الوزارية 40)</div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <div>بطاقة معاينة السكن رقم: <Blank /></div>
          <div>عنوان السكن: <strong>{h.housingAddress}</strong></div>
        </div>

        <div className="border border-slate-300 p-2 rounded">
          <div className="font-bold mb-1">الطابق:</div>
          <div className="flex gap-6">
            <span>[ ] الأرضي</span><span>[ ] الطابق الأول</span><span>[ ] الطابق الثاني</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="font-bold">1- محتويات السكن:</div>
          <table className="w-full border-collapse text-center">
            <thead>
              <tr><th className={th}>المحتويات</th>{rooms.map((r) => <th key={r} className={th}>{r}</th>)}</tr>
            </thead>
            <tbody>
              <tr><td className={cell + ' font-bold'}>العدد</td>{rooms.map((r) => <td key={r} className={cell}>&nbsp;</td>)}</tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-1">
          <div className="font-bold">2- حالة السكن (وصف الحالة):</div>
          <table className="w-full border-collapse text-center">
            <tbody>
              {Array.from({ length: Math.ceil(conditionElements.length / 4) }).map((_, row) => (
                <React.Fragment key={row}>
                  <tr>
                    {conditionElements.slice(row * 4, row * 4 + 4).map((el) => (
                      <td key={el} className={cell + ' font-medium'}>{el}</td>
                    ))}
                  </tr>
                  <tr>
                    {conditionElements.slice(row * 4, row * 4 + 4).map((el) => (
                      <td key={el + '-s'} className={cell}>&nbsp;</td>
                    ))}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-slate-500">الحالة: (ج / م / ر.ت) حسب حالة كل عنصر.</div>
        </div>

        <div className="space-y-1">
          <div className="font-bold">3- التجهيزات المتوفرة:</div>
          <table className="w-full border-collapse text-center">
            <thead>
              <tr><th className={th}>نوع التجهيز</th><th className={th}>العدد</th><th className={th}>المكان</th></tr>
            </thead>
            <tbody>
              {[0, 1, 2].map((i) => (
                <tr key={i}><td className={cell}>&nbsp;</td><td className={cell}>&nbsp;</td><td className={cell}>&nbsp;</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-justify text-[11px]">
          أشهد أنا الموقع(ة) أسفله السيد(ة): <Blank /> رقم التأجير: <Blank /> رقم بطاقة التعريف الوطنية: <Blank />،
          بأنني عاينت حالة المسكن ومحتوياته المبينة في الصفحة أعلاه بحضور ممثل الإدارة، وأشهد بصحتها وذلك عند استلام (أو إفراغ) المسكن.
        </p>

        <div className="flex justify-between pt-4 text-center text-[11px]">
          <div>وحرر بـ <Blank /> بتاريخ <Blank /></div>
          <div>إمضاء المستفيد(ة)<div className="h-14" /></div>
          <div>اسم وصفة وتوقيع ممثل الإدارة<div className="h-14" /></div>
        </div>
      </div>
    );
  }

  /* ============ المطبوع 6: البطاقة رقم 1 (المسكن المحدث) ============ */
  if (formId === 'official_6') {
    return (
      <div className="space-y-4 text-xs font-sans leading-relaxed">
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold border-b-2 border-slate-900 inline-block pb-1">البطاقة رقم 1 (خاصة بالمسكن المحدث)</h3>
          <div className="text-[11px] text-slate-600">(المطبوع رقم 6 - تعبأ من طرف الإدارة التي ينتمي إليها الموظف المسكن وترسل إلى رئيس دائرة الأملاك المخزنية)</div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border border-slate-300 p-3 rounded">
          <div>الأكاديمية: <strong>{c.aref}</strong></div>
          <div>المديرية الإقليمية: <strong>{c.directionProvinciale}</strong></div>
          <div>المؤسسة: <strong>{h.targetEtablissement}</strong></div>
          <div>عنوان السكن: <strong>{h.housingAddress}</strong></div>
          <div>رقم السكن: <strong>{h.housingNumber}</strong></div>
          <div>الصنف: <strong>{h.housingCategory}</strong></div>
        </div>

        <div className="space-y-2 border border-slate-300 p-3 rounded">
          <div className="font-bold">1- الإحداث:</div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
            <div>برنامج سنة: <Blank /></div>
            <div>تاريخ التسلم المؤقت: <Blank /></div>
            <div>تاريخ التسلم النهائي: <Blank /></div>
          </div>
        </div>

        <div className="space-y-2 border border-slate-300 p-3 rounded">
          <div className="font-bold">2- الموظف المسكن:</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <div>الاسم والنسب: <strong>{c.fullNameAr}</strong></div>
            <div>رقم التأجير: <strong>{c.ppr}</strong></div>
            <div>الإطار: <strong>{c.grade}</strong></div>
            <div>المهمة: <strong>{c.grade}</strong></div>
            <div>تاريخ الالتحاق بالسكن: <Blank /></div>
            <div>وثيقة الإسناد (رقم/تاريخ): <Blank /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-6 text-center text-[11px]">
          <div>رئيس المؤسسة<div className="h-14" /></div>
          <div>المدير الإقليمي (التأشيرة)<div className="h-14" /></div>
        </div>
      </div>
    );
  }

  /* ============ المطبوع 7: البطاقة رقم 2 (تغيير شاغل / تعديلات) ============ */
  if (formId === 'official_7') {
    return (
      <div className="space-y-4 text-xs font-sans leading-relaxed">
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold border-b-2 border-slate-900 inline-block pb-1">البطاقة رقم 2 (تغيير شاغل المسكن أو إدخال تعديلات على المسكن)</h3>
          <div className="text-[11px] text-slate-600">(المطبوع رقم 7 - توافي بها دائرة الأملاك المخزنية كلما تغير شاغل المسكن أو طرأت تعديلات)</div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border border-slate-300 p-3 rounded">
          <div>الأكاديمية: <strong>{c.aref}</strong></div>
          <div>المديرية الإقليمية: <strong>{c.directionProvinciale}</strong></div>
          <div>عنوان السكن: <strong>{h.housingAddress}</strong></div>
          <div>رقم السكن: <strong>{h.housingNumber}</strong></div>
        </div>

        <div className="space-y-1">
          <div className="font-bold">1- التغييرات الطارئة على السكن:</div>
          <table className="w-full border-collapse text-center">
            <thead>
              <tr><th className={th}>التاريخ</th><th className={th}>الطبيعة والنوع</th><th className={th}>السند</th></tr>
            </thead>
            <tbody>
              {[0, 1].map((i) => (
                <tr key={i}><td className={cell}>&nbsp;</td><td className={cell}>&nbsp;</td><td className={cell}>&nbsp;</td></tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-slate-500">(2) إعادة التصميم - التقسيم - الفصل - الإدماج - إضافات ...</div>
        </div>

        <div className="space-y-1">
          <div className="font-bold">2- الإصلاحات المنجزة:</div>
          <table className="w-full border-collapse text-center">
            <thead>
              <tr>
                <th className={th}>نوع الإصلاح</th><th className={th}>المصاريف</th>
                <th className={th}>نوع المقاولة أو سند الطلب</th><th className={th}>رقم وتاريخ الصفقة</th>
                <th className={th}>رقم وتاريخ التأشير</th><th className={th}>رقم وتاريخ الأمر بالأداء</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1].map((i) => (
                <tr key={i}>{[0, 1, 2, 3, 4, 5].map((j) => <td key={j} className={cell}>&nbsp;</td>)}</tr>
              ))}
              <tr className="font-bold bg-slate-100"><td className={cell}>المجموع</td><td className={cell} colSpan={5}>&nbsp;</td></tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-2 border border-slate-300 p-3 rounded">
          <div className="font-bold">3- الشاغل الجديد:</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <div>الاسم والنسب: <Blank /></div>
            <div>رقم التأجير: <Blank /></div>
            <div>تاريخ شغل السكن: <Blank /></div>
            <div>وثيقة الإسناد: <Blank /></div>
          </div>
        </div>

        <div className="flex justify-end pt-4 text-center text-[11px]">
          <div>تاريخه وإمضاء رئيس المؤسسة<div className="h-14" /></div>
        </div>
      </div>
    );
  }

  /* ============ المطبوع 8: بطاقة إشعار ============ */
  if (formId === 'official_8') {
    return (
      <div className="space-y-4 text-xs font-sans leading-loose">
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold border-b-2 border-slate-900 inline-block pb-1">بطاقة إشعار</h3>
          <div className="text-[11px] text-slate-600">(المطبوع رقم 8 - تبلغ إلى رئيس دائرة الأملاك المخزنية لتحديد السومة الكرائية)</div>
        </div>

        <div className="text-left font-bold">
          إلى السيد رئيس دائرة الأملاك المخزنية<br />
          بـ <Blank />
        </div>

        <p className="text-justify">
          يشرفني أن أشعر سيادتكم بأن السكن الإداري / الوظيفي الكائن بـ <strong>{h.housingAddress}</strong>
          (رقم <strong>{h.housingNumber}</strong>) التابع لـ <strong>{h.targetEtablissement}</strong>،
          أصبح موضوع احتلال بدون سند قانوني من طرف:
        </p>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border border-slate-300 p-3 rounded">
          <div>الاسم والنسب: <Blank /></div>
          <div>رقم التأجير: <Blank /></div>
          <div>صفة المحتل: <Blank /></div>
          <div>تاريخ بداية الاحتلال: <Blank /></div>
          <div>سبب الاحتلال: <Blank w="160px" /></div>
        </div>

        <p className="text-justify">
          وذلك قصد العمل على تحديد السومة الكرائية الواجب فرضها على شاغل السكن طبقاً للمسطرة الجاري بها العمل في هذا المجال، مع إرسال نسخة من بطاقة الإشعار هذه إلى المصالح المركزية للوزارة لتمكينها من تحديد المسطرة التأديبية أو القضائية.
        </p>

        <div className="flex justify-between pt-6 text-center text-[11px]">
          <div>التاريخ: <Blank /></div>
          <div>الإمضاء والخاتم<div className="h-14" /></div>
        </div>
      </div>
    );
  }

  /* ============ المطبوع 9: بطاقة مراقبة السكن ============ */
  return (
    <div className="space-y-4 text-xs font-sans leading-relaxed">
      <div className="text-center space-y-1">
        <h3 className="text-base font-bold border-b-2 border-slate-900 inline-block pb-1">بطاقة مراقبة السكن</h3>
        <div className="text-[11px] text-slate-600">(المطبوع رقم 9 - المذكرة الوزارية 40)</div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <div>الأكاديمية: <strong>{c.aref}</strong></div>
        <div>الرمز: <Blank w="60px" /></div>
        <div>النيابة (المديرية الإقليمية): <strong>{c.directionProvinciale}</strong></div>
        <div>عنوان السكن (1): <strong>{h.housingAddress}</strong></div>
      </div>
      <div className="text-[10px] text-slate-500">(1) رقم السكن والشارع أو الزنقة والحي والبلدة.</div>

      <table className="w-full border-collapse text-center">
        <thead>
          <tr>
            <th className={th} rowSpan={2}>الاسم والنسب</th>
            <th className={th} rowSpan={2}>رقم التأجير</th>
            <th className={th} rowSpan={2}>الإطار</th>
            <th className={th} rowSpan={2}>المهمة</th>
            <th className={th} rowSpan={2}>تاريخ الميلاد</th>
            <th className={th} colSpan={3}>وثيقة الإسناد</th>
            <th className={th} colSpan={2}>الإفراغ</th>
          </tr>
          <tr>
            <th className={th}>التاريخ</th><th className={th}>الرقم</th><th className={th}>السند</th>
            <th className={th}>التاريخ</th><th className={th}>السبب</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={cell}>{c.fullNameAr}</td>
            <td className={cell}>{c.ppr}</td>
            <td className={cell}>{c.grade}</td>
            <td className={cell}>{c.grade}</td>
            <td className={cell}>&nbsp;</td>
            <td className={cell}>&nbsp;</td><td className={cell}>&nbsp;</td><td className={cell}>&nbsp;</td>
            <td className={cell}>&nbsp;</td><td className={cell}>&nbsp;</td>
          </tr>
          {[0, 1].map((i) => (
            <tr key={i}>{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => <td key={j} className={cell}>&nbsp;</td>)}</tr>
          ))}
        </tbody>
      </table>

      <div>ملاحظات: <Blank w="400px" /></div>

      <div className="space-y-2 border border-slate-300 p-3 rounded">
        <div className="font-bold">1- الإحداث:</div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
          <div>برنامج سنة: <Blank /></div>
          <div>تاريخ التسلم المؤقت: <Blank /></div>
          <div>تاريخ التسلم النهائي: <Blank /></div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="font-bold">2- التغييرات الطارئة على السكن:</div>
        <table className="w-full border-collapse text-center">
          <thead><tr><th className={th}>التاريخ</th><th className={th}>الطبيعة والنوع</th><th className={th}>السند</th></tr></thead>
          <tbody><tr><td className={cell}>&nbsp;</td><td className={cell}>&nbsp;</td><td className={cell}>&nbsp;</td></tr></tbody>
        </table>
      </div>

      <div className="space-y-1">
        <div className="font-bold">3- الإصلاحات المنجزة:</div>
        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              <th className={th}>نوع الإصلاح</th><th className={th}>المصاريف</th><th className={th}>نوع المقاولة أو سند الطلب</th>
              <th className={th}>رقم وتاريخ الصفقة</th><th className={th}>رقم وتاريخ التأشير</th><th className={th}>رقم وتاريخ الأمر بالأداء</th>
            </tr>
          </thead>
          <tbody>
            <tr>{[0, 1, 2, 3, 4, 5].map((j) => <td key={j} className={cell}>&nbsp;</td>)}</tr>
            <tr className="font-bold bg-slate-100"><td className={cell}>المجموع</td><td className={cell} colSpan={5}>&nbsp;</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
