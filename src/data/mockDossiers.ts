import { HousingDossier } from '../types/housing';
import { calculateBareme } from '../utils/bareme';

export const INITIAL_DOSSIERS: HousingDossier[] = [
  {
    id: 'dos-2026-ouj-001',
    referenceNumber: 'DP-OUJ/LOG/2026/014',
    creationDate: '2026-09-12',
    status: 'under_review_dp',
    candidate: {
      fullNameAr: 'ذ. عبد الرحيم الإدريسي',
      fullNameFr: 'Abderrahim EL IDRISSI',
      cin: 'F458921',
      ppr: '1489201',
      phone: '0661234567',
      email: 'a.elidrissi@taalim.ma',
      grade: 'مدير ثانوية تأهيلية',
      scale: 11,
      echelon: 6,
      seniorityGeneral: 18,
      seniorityEtablissement: 3,
      installationDate: '2023-09-04',
      currentEtablissement: 'الثانوية التأهيلية عمر بن عبد العزيز',
      etablissementType: 'ثانوي تأهيلي',
      commune: 'وجدة',
      directionProvinciale: 'المديرية الإقليمية بوجدة أنكاد',
      aref: 'الأكاديمية الجهوية للتربية والتكوين - جهة الشرق (AREF Oriental)'
    },
    situationFamiliale: {
      maritalStatus: 'marie',
      spouseName: 'فاطمة الزهراء بنيس',
      spouseIsPublicOfficial: true,
      spouseAdministration: 'وزارة الصحة والحماية الاجتماعية - وجدة',
      spousePPR: '1894200',
      childrenCount: 3
    },
    housingRequest: {
      housingType: 'fonction',
      targetEtablissement: 'الثانوية التأهيلية عمر بن عبد العزيز',
      housingCategory: 'فيلا وظيفية مخصصة للمدير (Pavillon de Direction)',
      housingAddress: 'داخل الحرم المدرسي، الباب الجنوبي، شارع محمد الخامس، وجدة',
      housingNumber: 'سكن وظيفي رقم 01',
      housingStatus: 'vacant',
      reasons: 'ضرورة التواجد الدائم لتسيير المؤسسة والحراسة والتدبير التربوي والمادي وفق مقتضيات المذكرة 40'
    },
    documents: {
      demandeManuscrite: {
        present: true,
        date: '2026-09-10',
        fileName: 'Demande_Manuscrite_ElIdrissi_Oujda.pdf',
        isLegalized: false,
        notes: 'موقعة وموجهة للسيد المدير الإقليمي بوجدة أنكاد'
      },
      copieCIN: {
        present: true,
        date: '2026-09-08',
        fileName: 'Copie_CIN_F458921.pdf',
        isLegalized: true,
        notes: 'بطاقة التعريف الإلكترونية سارية المفعول إلى غاية 2030'
      },
      attestationTravail: {
        present: true,
        date: '2026-09-05',
        fileName: 'Attestation_Travail_Sept2026.pdf',
        notes: 'شهادة عمل حديثة مسلمة من مصلحة الموارد البشرية بمديرية وجدة أنكاد'
      },
      situationFamiliale: {
        present: true,
        marriageCert: true,
        spouseAttestation: true,
        childrenCertificates: true,
        notes: 'عقد زواج + شهادة عمل الزوجة + عقود ازدياد 3 أطفال'
      },
      engagementHonneur: {
        present: true,
        dateLegalized: '2026-09-11',
        fileName: 'Engagement_Honneur_Legalise.pdf',
        isLegalized: true,
        notes: 'التزام مصحح الإمضاء بمقاطعة سيدي زيان بوجدة يقر باحترام المذكرة 40 والتعهد بالإفراغ الفوري'
      },
      pvInstallation: {
        present: true,
        pvNumber: 'PV-2023/182',
        installationDate: '2023-09-04',
        fileName: 'PV_Installation_OmarIbnAbdelaziz.pdf',
        notes: 'محضر الالتحاق الفعلي بالثانوية التأهيلية عمر بن عبد العزيز'
      }
    },
    bareme: {
      seniorityGeneralPts: 18,
      seniorityEtablissementPts: 6,
      scalePts: 10,
      maritalPts: 4,
      soleIncomePts: 0,
      childrenPts: 6,
      responsibilityBonus: 25,
      totalPts: 69
    },
    auditHistory: [
      {
        stage: 'creation',
        date: '2026-09-12 09:30',
        actor: 'ذ. عبد الرحيم الإدريسي',
        decision: 'إنشاء الملف بالمنصة',
        comment: 'تم إعداد ملف الترشيح وتضمين الوثائق الست وفق المذكرة 40'
      },
      {
        stage: 'submission_dp',
        date: '2026-09-14 11:15',
        actor: 'مكتب الضبط - المديرية الإقليمية بوجدة أنكاد',
        decision: 'استلام الملف وتسليم الوصل',
        comment: 'تم إيداع الملف بمكتب الضبط وإحالته على مصلحة الموارد البشرية والشؤون القانونية'
      },
      {
        stage: 'audit_dp',
        date: '2026-09-18 14:00',
        actor: 'رئيس مصلحة الموارد البشرية بمديرية وجدة',
        decision: 'الملف مستوفٍ لجميع الوثائق',
        comment: 'تم التدقيق والتأكد من مطبوع الالتزام مصحح الإمضاء والملف جاهز للإحالة على الأكاديمية الجهوية للشرق'
      }
    ],
    dpAudit: {
      auditedBy: 'مصلحة الموارد البشرية والشؤون الإدارية - DP وجدة أنكاد',
      auditDate: '2026-09-18',
      isComplete: true,
      dpNotes: 'الملف مطابق للمذكرة 40 وتتوفر فيه شروط السكن الوظيفي لمدير المؤسسة.',
      bordereauNumber: 'BORD/DP-OUJ/2026/089',
      transmissionDate: '2026-09-22'
    }
  },
  {
    id: 'dos-2026-brk-002',
    referenceNumber: 'DP-BRK/LOG/2026/041',
    creationDate: '2026-08-25',
    status: 'transmitted_aref',
    candidate: {
      fullNameAr: 'ذ. محمد اليعقوبي',
      fullNameFr: 'Mohammed EL YAACOUBI',
      cin: 'FA78210',
      ppr: '1329845',
      phone: '0670984512',
      email: 'm.yaacoubi@taalim.ma',
      grade: 'حارس عام للخارجية',
      scale: 11,
      echelon: 8,
      seniorityGeneral: 22,
      seniorityEtablissement: 5,
      installationDate: '2021-09-02',
      currentEtablissement: 'الثانوية التأهيلية أبي الخير',
      etablissementType: 'ثانوي تأهيلي',
      commune: 'بركان',
      directionProvinciale: 'المديرية الإقليمية ببركان',
      aref: 'الأكاديمية الجهوية للتربية والتكوين - جهة الشرق (AREF Oriental)'
    },
    situationFamiliale: {
      maritalStatus: 'marie',
      spouseName: 'أمينة الماحي',
      spouseIsPublicOfficial: false,
      childrenCount: 2
    },
    housingRequest: {
      housingType: 'fonction',
      targetEtablissement: 'الثانوية التأهيلية أبي الخير',
      housingCategory: 'شقة وظيفية ملحقة بالإدارة',
      housingAddress: 'جناح الحراسة العامة، الطابق الأول، بركان',
      housingNumber: 'شقة رقم 02',
      housingStatus: 'vacant',
      reasons: 'تأمين المداومة المستمرة وحراسة مرافق المؤسسة والداخليات'
    },
    documents: {
      demandeManuscrite: {
        present: true,
        date: '2026-08-20',
        fileName: 'Demande_Yaacoubi_Berkane.pdf',
        isLegalized: false
      },
      copieCIN: {
        present: true,
        date: '2026-08-20',
        fileName: 'CIN_Yaacoubi_FA78210.pdf',
        isLegalized: true
      },
      attestationTravail: {
        present: true,
        date: '2026-08-21',
        fileName: 'Attestation_Berkane.pdf'
      },
      situationFamiliale: {
        present: true,
        marriageCert: true,
        spouseAttestation: true,
        childrenCertificates: true,
        notes: 'عقد زواج + شهادة عمل الزوجة + عقود ازدياد طفلين'
      },
      engagementHonneur: {
        present: true,
        dateLegalized: '2026-08-22',
        fileName: 'Engagement_Yaacoubi_Berkane.pdf',
        isLegalized: true
      },
      pvInstallation: {
        present: true,
        pvNumber: 'PV-BRK-2021/409',
        installationDate: '2021-09-02',
        fileName: 'PV_Installation_Berkane.pdf'
      }
    },
    bareme: {
      seniorityGeneralPts: 22,
      seniorityEtablissementPts: 10,
      scalePts: 10,
      maritalPts: 4,
      soleIncomePts: 0,
      childrenPts: 4,
      responsibilityBonus: 25,
      totalPts: 75
    },
    auditHistory: [
      {
        stage: 'creation',
        date: '2026-08-25 10:00',
        actor: 'ذ. محمد اليعقوبي',
        decision: 'إنشاء الملف بالمنظومة',
        comment: 'ملف كامل مع جميع التبريرات'
      },
      {
        stage: 'submission_dp',
        date: '2026-08-28 09:00',
        actor: 'مكتب الضبط - المديرية الإقليمية ببركان',
        decision: 'تسجيل بالإرساليات الواردة',
        comment: 'تم التدقيق والتأكد من صحة محضر الالتحاق والتصريح بالشرف'
      },
      {
        stage: 'transmission_aref',
        date: '2026-09-10 12:30',
        actor: 'المدير الإقليمي ببركان',
        decision: 'إحالة الملف على الأكاديمية الجهوية للشرق',
        comment: 'إرسال الملف بموجب جدول الإرسال رقم BORD/DP-BRK/2026/142 لعرضه على اللجنة الجهوية'
      }
    ],
    dpAudit: {
      auditedBy: 'مصلحة الموارد البشرية والشؤون القانونية DP بركان',
      auditDate: '2026-09-05',
      isComplete: true,
      bordereauNumber: 'BORD/DP-BRK/2026/142',
      transmissionDate: '2026-09-10'
    }
  },
  {
    id: 'dos-2026-nad-003',
    referenceNumber: 'DP-NAD/LOG/2026/078',
    creationDate: '2026-07-15',
    status: 'approved',
    candidate: {
      fullNameAr: 'ذ. خديجة البوعزاتي',
      fullNameFr: 'Khadija EL BOUAZZATI',
      cin: 'S541290',
      ppr: '1604128',
      phone: '0663889911',
      email: 'k.elbouazzati@taalim.ma',
      grade: 'مسير المصالح المادية والمالية (مقتصد)',
      scale: 11,
      echelon: 5,
      seniorityGeneral: 15,
      seniorityEtablissement: 4,
      installationDate: '2022-09-01',
      currentEtablissement: 'الثانوية التأهيلية عبد الكريم الخطابي',
      etablissementType: 'ثانوي تأهيلي',
      commune: 'الناظور',
      directionProvinciale: 'المديرية الإقليمية بالناظور',
      aref: 'الأكاديمية الجهوية للتربية والتكوين - جهة الشرق (AREF Oriental)'
    },
    situationFamiliale: {
      maritalStatus: 'marie',
      spouseName: 'فؤاد المساوي',
      spouseIsPublicOfficial: true,
      spouseAdministration: 'المديرية الإقليمية بالناظور - أستاذ',
      spousePPR: '1589110',
      childrenCount: 2
    },
    housingRequest: {
      housingType: 'fonction',
      targetEtablissement: 'الثانوية التأهيلية عبد الكريم الخطابي',
      housingCategory: 'سكن وظيفي ملحق بالمصالح المادية والمالية',
      housingAddress: 'جناح المصالح الاقتصادية، قرب المطعم المدرسي، الناظور',
      housingNumber: 'سكن وظيفي 03',
      housingStatus: 'vacant',
      reasons: 'تسيير المصالح المادية والمالية وحماية الخزينة والمستودعات والتغذية بالقسم الداخلي'
    },
    documents: {
      demandeManuscrite: { present: true, isLegalized: false },
      copieCIN: { present: true, isLegalized: true },
      attestationTravail: { present: true },
      situationFamiliale: {
        present: true,
        marriageCert: true,
        spouseAttestation: true,
        childrenCertificates: true
      },
      engagementHonneur: { present: true, isLegalized: true },
      pvInstallation: { present: true, pvNumber: 'PV-NAD-2022/88' }
    },
    bareme: {
      seniorityGeneralPts: 15,
      seniorityEtablissementPts: 8,
      scalePts: 10,
      maritalPts: 4,
      soleIncomePts: 0,
      childrenPts: 4,
      responsibilityBonus: 25,
      totalPts: 66
    },
    auditHistory: [
      {
        stage: 'creation',
        date: '2026-07-15',
        actor: 'ذ. خديجة البوعزاتي',
        decision: 'إيداع الملف',
        comment: 'ملف كامل'
      },
      {
        stage: 'audit_dp',
        date: '2026-07-22',
        actor: 'مصلحة الشؤون الإدارية DP الناظور',
        decision: 'موافقة وتوجيه',
        comment: 'الملف مستوفٍ لجميع المعايير القانونية'
      },
      {
        stage: 'final_decision',
        date: '2026-09-02',
        actor: 'مدير الأكاديمية الجهوية للتربية والتكوين لجهة الشرق',
        decision: 'المصادقة والترخيص بالسكن الوظيفي',
        comment: 'تم إصدار مقرر استغلال السكن الوظيفي رقم DEC/AREF-OR/2026/894'
      }
    ],
    dpAudit: {
      auditedBy: 'DP الناظور - مصلحة الموارد البشرية',
      auditDate: '2026-07-22',
      isComplete: true,
      bordereauNumber: 'BORD/DP-NAD/2026/512'
    },
    arefDecision: {
      commissionDate: '2026-08-28',
      commissionDecision: 'accord',
      decisionNumber: 'DEC/AREF-OR/2026/894',
      pvDecisionDate: '2026-09-02',
      arefNotes: 'تم منح الترخيص بالاستفادة وفق المذكرة 40 مع إلزامية توقيع محضر تسلّم المفاتيح والمعاينة'
    }
  },
  {
    id: 'dos-2026-dri-004',
    referenceNumber: 'DP-DRI/LOG/2026/022',
    creationDate: '2026-09-20',
    status: 'draft',
    candidate: {
      fullNameAr: 'ذ. رضوان أزرقان',
      fullNameFr: 'Redouane AZERKAN',
      cin: 'SZ39481',
      ppr: '1720391',
      phone: '0655443322',
      email: 'r.azerkan@taalim.ma',
      grade: 'ناظر الدروس',
      scale: 11,
      echelon: 4,
      seniorityGeneral: 12,
      seniorityEtablissement: 3,
      installationDate: '2023-09-05',
      currentEtablissement: 'الثانوية التأهيلية الدريوش الجديدة',
      etablissementType: 'ثانوي تأهيلي',
      commune: 'الدريوش',
      directionProvinciale: 'المديرية الإقليمية بالدريوش',
      aref: 'الأكاديمية الجهوية للتربية والتكوين - جهة الشرق (AREF Oriental)'
    },
    housingRequest: {
      housingType: 'fonction',
      targetEtablissement: 'الثانوية التأهيلية الدريوش الجديدة',
      housingCategory: 'سكن وظيفي مخصص لناظر الدروس',
      housingAddress: 'الجناح الإداري، الطابق الثاني',
      housingNumber: 'سكن وظيفي رقم 02',
      housingStatus: 'vacant',
      reasons: 'تتبع السير البيداغوجي وتنسيق الأقسام وفق المذكرة 40'
    },
    situationFamiliale: {
      maritalStatus: 'marie',
      spouseName: 'فاطمة قدوري',
      spouseIsPublicOfficial: false,
      childrenCount: 1
    },
    documents: {
      demandeManuscrite: { present: true, isLegalized: false },
      copieCIN: { present: true, isLegalized: true },
      attestationTravail: { present: true },
      situationFamiliale: {
        present: true,
        marriageCert: true,
        spouseAttestation: true,
        childrenCertificates: true,
        notes: 'عقد زواج + شهادة عمل الزوجة + عقد ازدياد الابن'
      },
      engagementHonneur: { present: false, isLegalized: false, notes: 'قيد المصادقة على الإمضاء ببلدية الدريوش' },
      pvInstallation: { present: true, pvNumber: 'PV-DRI-2023/310' }
    },
    bareme: {
      seniorityGeneralPts: 12,
      seniorityEtablissementPts: 6,
      scalePts: 10,
      maritalPts: 4,
      soleIncomePts: 0,
      childrenPts: 2,
      responsibilityBonus: 25,
      totalPts: 59
    },
    auditHistory: [
      {
        stage: 'creation',
        date: '2026-09-20',
        actor: 'ذ. رضوان أزرقان',
        decision: 'بدء تعبئة الملف',
        comment: 'ملف مسودة في انتظار استكمال الالتزام المصادق عليه'
      }
    ]
  },
  {
    id: 'dos-2026-tao-005',
    referenceNumber: 'DP-TAO/LOG/2026/033',
    creationDate: '2026-09-02',
    status: 'under_review_dp',
    candidate: {
      fullNameAr: 'ذ. طارق بنعلي',
      fullNameFr: 'Tariq BENALI',
      cin: 'FC19283',
      ppr: '1598412',
      phone: '0662334455',
      email: 't.benali@taalim.ma',
      grade: 'أستاذ التعليم الثانوي التأهيلي',
      scale: 11,
      echelon: 7,
      seniorityGeneral: 16,
      seniorityEtablissement: 8,
      installationDate: '2018-09-03',
      currentEtablissement: 'الثانوية التأهيلية الفتح',
      etablissementType: 'ثانوي تأهيلي',
      commune: 'تاوريرت',
      directionProvinciale: 'المديرية الإقليمية بتاوريرت',
      aref: 'الأكاديمية الجهوية للتربية والتكوين - جهة الشرق (AREF Oriental)'
    },
    situationFamiliale: {
      maritalStatus: 'marie',
      spouseName: 'نادية بلقاسمي',
      spouseIsPublicOfficial: true,
      spouseAdministration: 'وزارة العدل - محكمة تاوريرت',
      spousePPR: '1904122',
      childrenCount: 3
    },
    housingRequest: {
      housingType: 'administratif',
      targetEtablissement: 'الثانوية التأهيلية الفتح',
      housingCategory: 'شقة إدارية شاغرة',
      housingAddress: 'مجمع السكنيات الإدارية، عمارة أ، تاوريرت',
      housingNumber: 'شقة رقم 05',
      housingStatus: 'vacant',
      reasons: 'طلب الاستفادة من سكن إداري شاغر وفق الاستحقاق وشبكة التنقيط للمذكرة 40'
    },
    documents: {
      demandeManuscrite: { present: true, isLegalized: false },
      copieCIN: { present: true, isLegalized: true },
      attestationTravail: { present: true },
      situationFamiliale: {
        present: true,
        marriageCert: true,
        spouseAttestation: true,
        childrenCertificates: true
      },
      engagementHonneur: { present: true, isLegalized: true },
      pvInstallation: { present: true, pvNumber: 'PV-TAO-2018/142' }
    },
    bareme: {
      seniorityGeneralPts: 16,
      seniorityEtablissementPts: 16,
      scalePts: 10,
      maritalPts: 4,
      soleIncomePts: 0,
      childrenPts: 6,
      responsibilityBonus: 0,
      totalPts: 52
    },
    auditHistory: [
      {
        stage: 'creation',
        date: '2026-09-02',
        actor: 'ذ. طارق بنعلي',
        decision: 'إيداع الملف الإداري',
        comment: 'ملف ترشيح لسكن إداري شاغر'
      },
      {
        stage: 'audit_dp',
        date: '2026-09-08',
        actor: 'مصلحة الشؤون الإدارية DP تاوريرت',
        decision: 'تدقيق الوثائق',
        comment: 'الوثائق مستوفاة وجاهزة لترتيب الاستحقاق'
      }
    ],
    dpAudit: {
      auditedBy: 'DP تاوريرت - مصلحة الموارد البشرية',
      auditDate: '2026-09-08',
      isComplete: true,
      bordereauNumber: 'BORD/DP-TAO/2026/099'
    }
  },
  {
    id: 'dos-2026-gue-006',
    referenceNumber: 'DP-GUE/LOG/2026/019',
    creationDate: '2026-08-30',
    status: 'transmitted_aref',
    candidate: {
      fullNameAr: 'ذ. سمير أوعلي',
      fullNameFr: 'Samir OUALI',
      cin: 'ZG44129',
      ppr: '1689230',
      phone: '0668112233',
      email: 's.ouali@taalim.ma',
      grade: 'مدير ثانوية إعدادية',
      scale: 11,
      echelon: 5,
      seniorityGeneral: 14,
      seniorityEtablissement: 2,
      installationDate: '2024-09-02',
      currentEtablissement: 'الثانوية الإعدادية ابن الهيثم',
      etablissementType: 'ثانوي إعدادي',
      commune: 'جرسيف',
      directionProvinciale: 'المديرية الإقليمية بجرسيف',
      aref: 'الأكاديمية الجهوية للتربية والتكوين - جهة الشرق (AREF Oriental)'
    },
    situationFamiliale: {
      maritalStatus: 'marie',
      spouseName: 'لبنى الزايدي',
      spouseIsPublicOfficial: false,
      childrenCount: 2
    },
    housingRequest: {
      housingType: 'fonction',
      targetEtablissement: 'الثانوية الإعدادية ابن الهيثم',
      housingCategory: 'سكن وظيفي لمدير الإعدادية',
      housingAddress: 'داخل حرم المؤسسة، جرسيف المركز',
      housingNumber: 'سكن 01',
      housingStatus: 'vacant',
      reasons: 'ضرورة المصلحة والتواجد اليومي لإدارة الإعدادية وحراسة المؤسسة'
    },
    documents: {
      demandeManuscrite: { present: true, isLegalized: false },
      copieCIN: { present: true, isLegalized: true },
      attestationTravail: { present: true },
      situationFamiliale: {
        present: true,
        marriageCert: true,
        spouseAttestation: true,
        childrenCertificates: true
      },
      engagementHonneur: { present: true, isLegalized: true },
      pvInstallation: { present: true, pvNumber: 'PV-GUE-2024/091' }
    },
    bareme: {
      seniorityGeneralPts: 14,
      seniorityEtablissementPts: 4,
      scalePts: 10,
      maritalPts: 4,
      soleIncomePts: 0,
      childrenPts: 4,
      responsibilityBonus: 25,
      totalPts: 61
    },
    auditHistory: [
      {
        stage: 'creation',
        date: '2026-08-30',
        actor: 'ذ. سمير أوعلي',
        decision: 'إيداع الطلب',
        comment: 'طلب سكن وظيفي بحكم مهام الإدارة'
      },
      {
        stage: 'transmission_aref',
        date: '2026-09-12',
        actor: 'المدير الإقليمي بجرسيف',
        decision: 'إحالة على الأكاديمية الجهوية للشرق',
        comment: 'إحالة بجدول إرسال رسمي BORD/DP-GUE/2026/045'
      }
    ],
    dpAudit: {
      auditedBy: 'DP جرسيف',
      auditDate: '2026-09-05',
      isComplete: true,
      bordereauNumber: 'BORD/DP-GUE/2026/045',
      transmissionDate: '2026-09-12'
    }
  },
  {
    id: 'dos-2026-jer-007',
    referenceNumber: 'DP-JER/LOG/2026/015',
    creationDate: '2026-09-10',
    status: 'under_review_dp',
    candidate: {
      fullNameAr: 'ذ. رشيد القاسمي',
      fullNameFr: 'Rachid EL KASMI',
      cin: 'FJ89124',
      ppr: '1745812',
      phone: '0665998877',
      email: 'r.kasmi@taalim.ma',
      grade: 'حارس عام للداخلية',
      scale: 11,
      echelon: 4,
      seniorityGeneral: 11,
      seniorityEtablissement: 3,
      installationDate: '2023-09-04',
      currentEtablissement: 'الثانوية التأهيلية الفوسفاط',
      etablissementType: 'ثانوي تأهيلي',
      commune: 'جرادة',
      directionProvinciale: 'المديرية الإقليمية بجرادة',
      aref: 'الأكاديمية الجهوية للتربية والتكوين - جهة الشرق (AREF Oriental)'
    },
    situationFamiliale: {
      maritalStatus: 'marie',
      spouseName: 'مريم حدوش',
      spouseIsPublicOfficial: false,
      childrenCount: 1
    },
    housingRequest: {
      housingType: 'fonction',
      targetEtablissement: 'الثانوية التأهيلية الفوسفاط',
      housingCategory: 'سكن وظيفي ملحق بالقسم الداخلي',
      housingAddress: 'جناح القسم الداخلي، جرادة',
      housingNumber: 'سكن 02',
      housingStatus: 'vacant',
      reasons: 'تأطير ومراقبة التلاميذ الداخليين طيلة أيام الأسبوع والمداومة الليلية'
    },
    documents: {
      demandeManuscrite: { present: true, isLegalized: false },
      copieCIN: { present: true, isLegalized: true },
      attestationTravail: { present: true },
      situationFamiliale: {
        present: true,
        marriageCert: true,
        spouseAttestation: true,
        childrenCertificates: true
      },
      engagementHonneur: { present: true, isLegalized: true },
      pvInstallation: { present: true, pvNumber: 'PV-JER-2023/201' }
    },
    bareme: {
      seniorityGeneralPts: 11,
      seniorityEtablissementPts: 6,
      scalePts: 10,
      maritalPts: 4,
      soleIncomePts: 0,
      childrenPts: 2,
      responsibilityBonus: 25,
      totalPts: 58
    },
    auditHistory: [
      {
        stage: 'creation',
        date: '2026-09-10',
        actor: 'ذ. رشيد القاسمي',
        decision: 'إيداع الملف',
        comment: 'ملف كامل'
      }
    ],
    dpAudit: {
      auditedBy: 'مصلحة الشؤون الإدارية DP جرادة',
      auditDate: '2026-09-15',
      isComplete: true,
      bordereauNumber: 'BORD/DP-JER/2026/028'
    }
  },
  {
    id: 'dos-2026-fig-008',
    referenceNumber: 'DP-FIG/LOG/2026/009',
    creationDate: '2026-08-18',
    status: 'approved',
    candidate: {
      fullNameAr: 'ذ. إبراهيم الزياني',
      fullNameFr: 'Brahim ZIANI',
      cin: 'FL38921',
      ppr: '1540192',
      phone: '0671445566',
      email: 'b.ziani@taalim.ma',
      grade: 'مدير مدرسة ابتدائية',
      scale: 11,
      echelon: 6,
      seniorityGeneral: 19,
      seniorityEtablissement: 5,
      installationDate: '2021-09-06',
      currentEtablissement: 'مجموعة مدارس النخيل',
      etablissementType: 'ابتدائي',
      commune: 'فكيك (Bouarfa)',
      directionProvinciale: 'المديرية الإقليمية بفكيك (بوعرفة)',
      aref: 'الأكاديمية الجهوية للتربية والتكوين - جهة الشرق (AREF Oriental)'
    },
    situationFamiliale: {
      maritalStatus: 'marie',
      spouseName: 'فاطمة اليعقوبي',
      spouseIsPublicOfficial: true,
      spouseAdministration: 'وزارة التربية الوطنية - أستاذة ابتدائي',
      spousePPR: '1612090',
      childrenCount: 3
    },
    housingRequest: {
      housingType: 'fonction',
      targetEtablissement: 'مجموعة مدارس النخيل',
      housingCategory: 'سكن وظيفي لمدير المركزية',
      housingAddress: 'المدرسة المركزية، فكيك',
      housingNumber: 'سكن 01',
      housingStatus: 'vacant',
      reasons: 'تسيير المدرسة الابتدائية والوحدات الفرعية القروية الملحقة'
    },
    documents: {
      demandeManuscrite: { present: true, isLegalized: false },
      copieCIN: { present: true, isLegalized: true },
      attestationTravail: { present: true },
      situationFamiliale: {
        present: true,
        marriageCert: true,
        spouseAttestation: true,
        childrenCertificates: true
      },
      engagementHonneur: { present: true, isLegalized: true },
      pvInstallation: { present: true, pvNumber: 'PV-FIG-2021/043' }
    },
    bareme: {
      seniorityGeneralPts: 19,
      seniorityEtablissementPts: 10,
      scalePts: 10,
      maritalPts: 4,
      soleIncomePts: 0,
      childrenPts: 6,
      responsibilityBonus: 25,
      totalPts: 74
    },
    auditHistory: [
      {
        stage: 'creation',
        date: '2026-08-18',
        actor: 'ذ. إبراهيم الزياني',
        decision: 'إيداع الملف بمديرية فكيك (بوعرفة)',
        comment: 'ملف مستوفٍ لجميع الشروط'
      },
      {
        stage: 'audit_dp',
        date: '2026-08-25',
        actor: 'DP فكيك (بوعرفة)',
        decision: 'تأشير وموافقة إقليمية',
        comment: 'إحالة على الأكاديمية الجهوية للشرق بوجدة'
      },
      {
        stage: 'final_decision',
        date: '2026-09-15',
        actor: 'مدير الأكاديمية الجهوية لجهة الشرق',
        decision: 'المصادقة ومنح الترخيص النهائي',
        comment: 'صدور القرار الجهوي رقم DEC/AREF-OR/2026/711'
      }
    ],
    dpAudit: {
      auditedBy: 'DP فكيك بوعرفة',
      auditDate: '2026-08-25',
      isComplete: true,
      bordereauNumber: 'BORD/DP-FIG/2026/031'
    },
    arefDecision: {
      commissionDate: '2026-09-10',
      commissionDecision: 'accord',
      decisionNumber: 'DEC/AREF-OR/2026/711',
      pvDecisionDate: '2026-09-15',
      arefNotes: 'تم منح الترخيص بالاستفادة وفق مقتضيات المذكرة 40'
    }
  }
];

// Recompute every demo dossier's barème with the official Note 40 grid so the
// seeded data never drifts from the live scoring logic.
for (const dossier of INITIAL_DOSSIERS) {
  dossier.bareme = calculateBareme(
    dossier.candidate,
    dossier.situationFamiliale,
    dossier.housingRequest
  );
}

