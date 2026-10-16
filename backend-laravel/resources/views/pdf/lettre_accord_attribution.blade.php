<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>الموافقة على إسناد سكن وظيفي - {{ $dossier->candidat->nom_ar }}</title>
    <style>
        @page {
            margin: 20px 40px;
        }
        body {
            font-family: 'amiri', 'DejaVu Sans', serif, sans-serif;
            direction: rtl;
            text-align: right;
            font-size: 15px;
            line-height: 1.8;
            color: #000;
        }
        
        /* En-tête officiel avec l'image */
        .header-logo {
            text-align: center;
            width: 100%;
            margin-bottom: 25px;
        }
        .header-logo img {
            width: 85%;
            max-width: 750px;
            height: auto;
        }

        .recipient {
            text-align: center;
            font-weight: bold;
            font-size: 17px;
            margin: 20px 0 25px 0;
            line-height: 1.5;
        }

        .subject-box {
            margin: 20px 0;
            font-size: 15px;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 10px 15px;
            border-radius: 6px;
        }
        .subject-box p {
            margin: 4px 0;
        }

        .content-body {
            margin-top: 25px;
            text-align: justify;
            text-justify: inter-word;
        }

        .signature-section {
            margin-top: 40px;
            width: 100%;
        }

        .signature-box {
            float: left;
            text-align: center;
            width: 250px;
        }

        .footer {
            position: absolute;
            bottom: 15px;
            left: 0;
            right: 0;
            text-align: center;
            border-top: 1.5px solid #000;
            padding-top: 6px;
            font-size: 13px;
            font-weight: bold;
        }
    </style>
</head>
<body>

    <!-- En-tête avec l'image officielle AREF Oriental -->
    @php
        // في الحزمة المكتبية يكون مجلد public داخل مسار التطبيق، لا بجانبه.
        $logo = public_path('images/header.png');
        if (!is_file($logo)) {
            $logo = base_path('../public/images/header.png');
        }
    @endphp
    <div class="header-logo">
        <img src="data:image/png;base64,{{ is_file($logo) ? base64_encode(file_get_contents($logo)) : '' }}" alt="En-tête AREF Oriental">
    </div>

    <!-- Destinataire -->
    <div class="recipient">
        مديرة الأكاديمية<br>
        إلى السيد المدير الإقليمي<br>
        المديرية الإقليمية - {{ $dossier->candidat->direction_provinciale }}
    </div>

    <!-- الموضوع والمراجع -->
    <div class="subject-box">
        <p><strong><u>الموضوع:</u></strong> الموافقة على إسناد سكن وظيفي.</p>
        <p><strong><u>المرجع:</u></strong> إرساليتكم عدد {{ $dossier->numero_bordereau_dp ?? '24/1109' }} بتاريخ {{ $dossier->date_transmission_aref ? $dossier->date_transmission_aref->format('Y-m-d') : date('Y-m-d') }}<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;المذكرة الوزارية رقم 40 بتاريخ 10 ماي 2004</p>
    </div>

    <!-- سلام تام -->
    <p style="text-align: center; font-weight: bold; margin-top: 20px; font-size: 16px;">سلام تام بوجود مولانا الإمام</p>

    <!-- نص الرسالة -->
    <div class="content-body">
        <p>
            وبعد، فجوابا على إرساليتكم المشار إليها في المرجع أعلاه، والمتضمنة لطلب السيد(ة) 
            <strong>{{ $dossier->candidat->nom_ar }}</strong> 
            رقم التأجير <strong>{{ $dossier->candidat->ppr }}</strong> 
            في شأن الموافقة على إسناد السكن الوظيفي المخصص للإدارة التربوية بـ 
            <strong>{{ $dossier->adresse_logement ?: $dossier->etablissement_cible }}</strong> 
            التابعة للمديرية الإقليمية {{ $dossier->candidat->direction_provinciale }}، 
            وتبعا للمذكرة الوزارية المذكورة أعلاه، يشرفني إخباركم أن الأكاديمية توافق على إسناد هذا السكن للمكلف بالأمر بصفته 
            <strong>{{ $dossier->candidat->cadre }}</strong>.
        </p>
    </div>

    <p style="text-align: center; font-weight: bold; margin-top: 40px; font-size: 16px;">وتقبلوا أزكى التحيات والسلام.</p>

    <!-- توقيع وخاتم الأكاديمية -->
    <div class="signature-section">
        <div class="signature-box">
            <div style="font-size: 12px; margin-bottom: 5px;">وجدة في: {{ $dossier->date_commission_aref ? $dossier->date_commission_aref->format('Y-m-d') : date('Y-m-d') }}</div>
            <div style="font-weight: bold;">عن مديرة الأكاديمية الجهوية للتربية والتكوين</div>
            <div style="font-size: 12px;">جهة الشرق</div>
            <div style="margin-top: 15px; border: 2px dashed #b45309; padding: 15px; border-radius: 8px; color: #92400e; font-size: 11px;">
                خاتم وتأشيرة الأكاديمية الجهوية<br>
                <span style="font-family: monospace;">{{ $dossier->numero_decision_aref ?? 'DEC/AREF/' . date('Y') . '/049' }}</span>
            </div>
        </div>
        <div style="clear: both;"></div>
    </div>

    <!-- أسفل الصفحة (Footer) -->
    <div class="footer">
        قسم الشؤون الإدارية والمالية<br>
        الهاتف: 05-36-50-32-00 &nbsp;&nbsp;-&nbsp;&nbsp; الفاكس: 05-36-68-55-17
    </div>

</body>
</html>
