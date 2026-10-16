<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>محضر تسليم السكن - {{ $dossier->numero_dossier }}</title>
    <style>
        @page { margin: 24px 40px; }
        body { font-family: 'amiri', 'DejaVu Sans', sans-serif; direction: rtl; text-align: right; font-size: 15px; line-height: 2; color: #111; }
        .header { text-align: center; margin-bottom: 28px; }
        .header img { width: 85%; height: auto; }
        h1 { text-align: center; font-size: 20px; margin: 24px 0; }
        .details { border-collapse: collapse; width: 100%; margin: 24px 0; }
        .details td { border: 1px solid #555; padding: 8px 10px; }
        .label { width: 30%; font-weight: bold; }
        .signatures { width: 100%; margin-top: 70px; }
        .signatures td { width: 50%; text-align: center; vertical-align: top; }
    </style>
</head>
<body>
    @php
        // في الحزمة المكتبية يكون مجلد public داخل مسار التطبيق، لا بجانبه.
        $logo = public_path('images/header.png');
        if (!is_file($logo)) {
            $logo = base_path('../public/images/header.png');
        }
    @endphp
    <div class="header">
        <img src="data:image/png;base64,{{ is_file($logo) ? base64_encode(file_get_contents($logo)) : '' }}" alt="AREF Oriental">
    </div>

    <h1>محضر تسليم ومعاينة السكن</h1>
    <p>رقم الملف: <strong>{{ $dossier->numero_dossier }}</strong></p>
    <p>بتاريخ {{ now()->format('Y-m-d') }}، تم تسليم ومعاينة السكن المرتبط بالطلب التالي:</p>

    <table class="details">
        <tr><td class="label">المترشح</td><td>{{ $dossier->candidat->nom_ar }} ({{ $dossier->candidat->nom_fr }})</td></tr>
        <tr><td class="label">رقم التأجير</td><td>{{ $dossier->candidat->ppr }}</td></tr>
        <tr><td class="label">المديرية الإقليمية</td><td>{{ $dossier->candidat->direction_provinciale }}</td></tr>
        <tr><td class="label">المؤسسة المستهدفة</td><td>{{ $dossier->etablissement_cible }}</td></tr>
        <tr><td class="label">عنوان السكن</td><td>{{ $dossier->adresse_logement ?? 'غير محدد' }}</td></tr>
        <tr><td class="label">رقم السكن</td><td>{{ $dossier->numero_logement ?? 'غير محدد' }}</td></tr>
    </table>

    <p>يقر الطرفان بمعاينة حالة السكن وتسليم مفاتيحه وفق الإجراءات المعمول بها.</p>
    <table class="signatures">
        <tr>
            <td>المستفيد<br><br><br>الإمضاء</td>
            <td>ممثل الإدارة<br><br><br>الإمضاء والخاتم</td>
        </tr>
    </table>
</body>
</html>