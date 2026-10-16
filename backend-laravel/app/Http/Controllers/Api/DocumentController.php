<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeLogement;
use App\Models\DocumentFourni;
use App\Support\ApiAccess;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Native\Desktop\Dialog;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    /**
     * The supporting documents of the file, keyed by the column prefix used
     * in `documents_fournis` (both the boolean flag and the `{key}_path` file
     * path share this prefix).
     */
    private const SUPPORTING_DOC_KEYS = [
        'demande_manuscrite',
        'copie_cin',
        'attestation_travail',
        'situation_familiale',
        'situation_familiale_contrat_mariage',
        'situation_familiale_attestation_conjoint',
        'situation_familiale_enfants',
        'engagement_honneur',
        'pv_installation',
        'attestation_non_propriete',
        'fiche_visite',
        'fiche_controle',
    ];

    private const SITUATION_FAMILIALE_SUB_KEYS = [
        'situation_familiale_contrat_mariage',
        'situation_familiale_attestation_conjoint',
        'situation_familiale_enfants',
    ];

    /**
     * Upload one of the 6 supporting documents for a dossier, so the DP
     * agent can inspect it later (step 4 "Dossier de Demande").
     *
     * `situation_familiale_enfants` is special: one birth certificate per
     * child, uploaded together as `files[]` and stored as a JSON array of
     * paths in the single `situation_familiale_enfants_path` column.
     */
    public function uploadSupportingDocument(Request $request, $dossierId, string $docKey): JsonResponse
    {
        abort_unless(in_array($docKey, self::SUPPORTING_DOC_KEYS, true), 404);

        ApiAccess::assertCanUploadSupportingDocument($request);

        $dossier = DemandeLogement::with('candidat')->findOrFail($dossierId);
        ApiAccess::assertDossierVisible($request, $dossier);
        $document = DocumentFourni::firstOrCreate(['numero_dossier' => $dossier->numero_dossier]);

        $fileRule = 'file|mimes:pdf,jpg,jpeg,png,webp|max:10240';

        if ($docKey === 'situation_familiale_enfants') {
            $request->validate(['files' => 'required|array|min:1', 'files.*' => $fileRule]);

            $new = [];
            foreach ($request->file('files') as $file) {
                $new[] = $file->store("dossiers/{$dossier->numero_dossier}", 'local');
            }

            $document->update([
                'situation_familiale_enfants_path' => json_encode(array_merge(
                    self::decodeChildrenPaths($document->situation_familiale_enfants_path),
                    $new
                )),
                'situation_familiale' => true,
            ]);

            return response()->json([
                'message' => 'تم رفع عقود الازدياد بنجاح',
                'fileNames' => array_map('basename', $new),
            ]);
        }

        $request->validate(['file' => 'required|'.$fileRule]);

        $path = $request->file('file')->store("dossiers/{$dossier->numero_dossier}", 'local');

        $flagColumn = in_array($docKey, self::SITUATION_FAMILIALE_SUB_KEYS, true) ? 'situation_familiale' : $docKey;
        $document->update([
            "{$docKey}_path" => $path,
            $flagColumn => true,
        ]);

        return response()->json([
            'message' => 'تم رفع الوثيقة بنجاح',
            'fileName' => basename($path),
        ]);
    }

    /**
     * The children-certificate column holds either a JSON array of paths
     * (multi-child) or a plain single path from earlier uploads.
     */
    private static function decodeChildrenPaths(?string $value): array
    {
        if (empty($value)) {
            return [];
        }
        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [$value];
    }

    /**
     * Register the Amiri Arabic fonts with dompdf so Arabic text in the
     * generated PDFs renders correctly (DejaVu Sans has no Arabic glyphs).
     */
    private function registerArabicFonts($pdf): void
    {
        $metrics = $pdf->getDomPDF()->getFontMetrics();
        $metrics->registerFont(
            ['family' => 'amiri', 'style' => 'normal', 'weight' => 'normal'],
            storage_path('fonts/Amiri-Regular.ttf')
        );
        $metrics->registerFont(
            ['family' => 'amiri', 'style' => 'normal', 'weight' => 'bold'],
            storage_path('fonts/Amiri-Bold.ttf')
        );
        $metrics->registerFont(
            ['family' => 'amiri', 'style' => 'italic', 'weight' => 'normal'],
            storage_path('fonts/Amiri-Italic.ttf')
        );
    }

    /**
     * Stream a previously uploaded supporting document so it can be
     * inspected (viewed/downloaded) by the DP agent. Birth certificates
     * are addressed by position: `?index=0..N-1` (default: first).
     */
    public function downloadSupportingDocument(Request $request, $dossierId, string $docKey): StreamedResponse
    {
        abort_unless(in_array($docKey, self::SUPPORTING_DOC_KEYS, true), 404);

        $dossier = DemandeLogement::with("candidat")->findOrFail($dossierId);
        ApiAccess::assertDossierVisible($request, $dossier);
        $document = DocumentFourni::where('numero_dossier', $dossier->numero_dossier)->firstOrFail();

        $path = $document->{"{$docKey}_path"};
        if ($docKey === 'situation_familiale_enfants') {
            $paths = self::decodeChildrenPaths($path);
            $index = max(0, (int) $request->query('index', 0));
            $path = $paths[$index] ?? ($paths[0] ?? null);
        }
        abort_if(empty($path) || !Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path);
    }

    /**
     * توليد رسالة الموافقة الرسمية بصيغة PDF (A4)
     */
    public function generateApprovalLetter(Request $request, $dossierId): Response
    {
        ApiAccess::assertCanGenerateOfficialDocument($request);

        $dossier = DemandeLogement::with('candidat')->findOrFail($dossierId);

        $pdf = Pdf::loadView('pdf.lettre_accord_attribution', compact('dossier'))
            ->setPaper('a4', 'portrait')
            ->setOption([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'amiri'
            ]);
        $this->registerArabicFonts($pdf);

        $filename = 'Accord_Attribution_' . $dossier->candidat->ppr . '.pdf';

        return $pdf->stream($filename);
    }

    /**
     * توليد محضر تسليم السكن والمعاينة (PV de possession)
     */
    public function generatePvPossession(Request $request, $dossierId): Response
    {
        ApiAccess::assertCanGenerateOfficialDocument($request);

        $dossier = DemandeLogement::with('candidat')->findOrFail($dossierId);

        $pdf = Pdf::loadView('pdf.pv_possession', compact('dossier'))
            ->setPaper('a4', 'portrait');
        $this->registerArabicFonts($pdf);

        return $pdf->stream('PV_Prise_Possession_' . $dossier->candidat->ppr . '.pdf');
    }

    /**
     * استقبال ملف PDF مولَّد في الواجهة (نفس ورقة الوثيقة) وحفظه عبر نافذة النظام
     * باختيار المستخدم. عند غياب التطبيق المكتبي أو إلغاء الحفظ يُرجَّع الملف للتنزيل.
     */
    public function savePdf(Request $request): Response|JsonResponse
    {
        // حدّ أقل من post_max_size في PHP المضمَّن (8M) حتى لا يسقط الجسم صامتًا.
        $validated = $request->validate([
            'pdf' => 'required|string|max:6500000',
            'filename' => 'required|string|max:180',
            'save' => 'sometimes|boolean',
        ]);

        $pdf = base64_decode(preg_replace('/\s+/', '', $validated['pdf']) ?? '', true);
        abort_if($pdf === false || !str_starts_with($pdf, '%PDF-') || strlen($pdf) < 1024, 422, 'ملف PDF غير صالح، أعد التوليد.');

        $filename = self::safeFilename($validated['filename']);

        if ($request->boolean('save') && self::sidecarAvailable()) {
            $chosen = Dialog::new()
                ->title('حفظ ملف PDF')
                ->button('حفظ')
                ->defaultPath(self::documentsDir() . DIRECTORY_SEPARATOR . $filename)
                ->filter('PDF', ['pdf'])
                ->save();

            if (!is_string($chosen) || $chosen === '') {
                return response()->json(['cancelled' => true]);
            }

            abort_unless(@file_put_contents($chosen, $pdf) !== false, 500, 'تعذّر حفظ الملف في المسار المختار.');

            return response()->json(['saved' => $chosen]);
        }

        $ascii = preg_replace('/[^\x20-\x7E]/', '', $filename) ?: 'document.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $ascii . '"; filename*=UTF-8\'\''. rawurlencode($filename),
        ]);
    }

    private static function sidecarAvailable(): bool
    {
        return (bool) config('nativephp-internal.api_url');
    }

    private static function documentsDir(): string
    {
        $profile = getenv('USERPROFILE') ?: getenv('HOME');

        return $profile ? rtrim($profile, '\\/') . DIRECTORY_SEPARATOR . 'Documents' : storage_path('app');
    }

    /** أسماء ملفات ويندوز لا تقبل هذه المحارف، والامتداد مفروض حتى لا يُحقن مسار. */
    private static function safeFilename(string $name): string
    {
        $clean = str_replace('.pdf', '', preg_replace('/[\\\\\/:*?"<>|\x00-\x1F]+/u', '-', $name) ?? '');
        $clean = trim(preg_replace('/\s+/', ' ', $clean) ?? '', " .-\t");

        return mb_substr($clean !== '' ? $clean : 'document', 0, 120) . '.pdf';
    }
}
