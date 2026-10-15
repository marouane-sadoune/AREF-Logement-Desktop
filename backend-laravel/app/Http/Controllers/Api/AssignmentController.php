<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditHistorique;
use App\Models\BaremeDetail;
use App\Models\Candidat;
use App\Models\DemandeLogement;
use App\Models\DocumentFourni;
use App\Services\Note40ScoreCalculator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DemandeLogement::with(['candidat', 'bareme', 'documents', 'historique', 'logement']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('statut_dossier', $request->status);
        }

        if ($request->filled('direction_provinciale')) {
            $query->whereHas('candidat', fn($candidateQuery) =>
                $candidateQuery->where('direction_provinciale', $request->direction_provinciale)
            );
        }

        $demandes = $query->orderByDesc('date_creation')->orderByDesc('id')->paginate(15);

        return response()->json($demandes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'candidat.ppr' => 'required|string|max:20',
            'candidat.cin' => 'nullable|string|max:20',
            'candidat.nom_ar' => 'required|string|max:150',
            'candidat.nom_fr' => 'nullable|string|max:150',
            'candidat.telephone' => 'nullable|string|max:20',
            'candidat.email' => 'nullable|email',
            'candidat.cadre' => 'required|string|max:150',
            'candidat.echelle' => 'nullable|integer|min:0',
            'candidat.echelon' => 'nullable|integer|min:0',
            'candidat.anciennete_generale' => 'sometimes|integer|min:0',
            'candidat.anciennete_etablissement' => 'sometimes|integer|min:0',
            'candidat.date_installation' => 'nullable|date',
            'candidat.etablissement_actuel' => 'nullable|string|max:150',
            'candidat.type_etablissement' => 'nullable|string|max:100',
            'candidat.commune' => 'nullable|string|max:100',
            'candidat.direction_provinciale' => 'required|string|max:150',
            'candidat.aref' => 'nullable|string|max:150',
            'candidat.situation_familiale' => 'sometimes|in:celibataire,marie,divorce,veuf',
            'candidat.nom_conjoint' => 'nullable|string|max:150',
            'candidat.conjoint_fonctionnaire' => 'sometimes|boolean',
            'candidat.administration_conjoint' => 'nullable|string|max:150',
            'candidat.ppr_conjoint' => 'nullable|string|max:20',
            'candidat.nombre_enfants' => 'sometimes|integer|min:0',
            'candidat.gender' => 'nullable|in:male,female',
            'candidat.merdoudia' => 'nullable|in:excellent,good,satisfactory,below',
            'candidat.milieu_rural' => 'sometimes|boolean',
            'candidat.franchise_rurale' => 'sometimes|boolean',
            'candidat.responsabilite' => 'nullable|in:none,chef_service,chef_division',
            'candidat.conjoint_situation' => 'nullable|in:public_sector,private_sector,no_work',
            'candidat.salaire_unique' => 'sometimes|boolean',
            // المرحلة أ: شروط الترشح الثلاثة، تجيب عنها الواجهة صراحة.
            'candidat.travaille_meme_ville' => 'nullable|boolean',
            'candidat.possede_logement' => 'nullable|boolean',
            'candidat.sanction_disciplinaire' => 'nullable|boolean',

            'type_logement' => 'required|in:fonction,administratif',
            'etablissement_cible' => 'required|string|max:150',
            'registre_logement_id' => 'nullable|integer|exists:registre_logements,id',
            'categorie_logement' => 'nullable|string|max:100',
            'adresse_logement' => 'nullable|string',
            'numero_logement' => 'nullable|string|max:50',
            'statut_logement' => 'nullable|in:vacant,occupe_a_evacuer,en_maintenance',
            'statut_dossier' => 'sometimes|in:draft,submitted_dp,under_review_dp,transmitted_aref,approved,rejected',
            'date_creation' => 'nullable|date',
            'reasons' => 'nullable|string',
            'acteur' => 'nullable|string|max:100',
            'commentaire' => 'nullable|string',

            'documents.demande_manuscrite' => 'sometimes|boolean',
            'documents.copie_cin' => 'sometimes|boolean',
            'documents.attestation_travail' => 'sometimes|boolean',
            'documents.situation_familiale' => 'sometimes|boolean',
            'documents.engagement_honneur' => 'sometimes|boolean',
            'documents.pv_installation' => 'sometimes|boolean',
            'documents.attestation_non_propriete' => 'sometimes|boolean',
            'documents.date_attestation_non_propriete' => 'nullable|date',
            'documents.fiche_visite' => 'sometimes|boolean',
            'documents.fiche_controle' => 'sometimes|boolean',
        ]);

        // النقط تُحتسب هنا من معطيات المترشح: الواجهة لا تمرّر قيوداً جاهزة.
        $scores = $validated['type_logement'] === 'fonction'
            ? Note40ScoreCalculator::zeroed()
            : Note40ScoreCalculator::score($validated['candidat']);
        $documentFlags = collect($validated['documents'] ?? [])->all();
        $numeroDossier = 'DOS-' . now()->format('Y') . '-' . Str::upper(Str::random(8));

        $demande = DB::transaction(function () use ($validated, $scores, $documentFlags, $numeroDossier) {
            $candidatData = $validated['candidat'];
            // ConvertEmptyStringsToNull turns the unused Latin name into null,
            // which the NOT NULL column rejects.
            $candidatData['nom_fr'] = $candidatData['nom_fr'] ?? '';
            $candidat = Candidat::updateOrCreate(
                ['ppr' => $candidatData['ppr']],
                collect($candidatData)->except('ppr')->all()
            );

            $demande = DemandeLogement::create([
                'numero_dossier' => $numeroDossier,
                'candidat_ppr' => $candidat->ppr,
                'registre_logement_id' => $validated['registre_logement_id'] ?? null,
                'type_logement' => $validated['type_logement'],
                'etablissement_cible' => $validated['etablissement_cible'],
                'categorie_logement' => $validated['categorie_logement'] ?? null,
                'adresse_logement' => $validated['adresse_logement'] ?? null,
                'numero_logement' => $validated['numero_logement'] ?? null,
                'statut_logement' => $validated['statut_logement'] ?? 'vacant',
                'statut_dossier' => $validated['statut_dossier'] ?? 'draft',
                'date_creation' => $validated['date_creation'] ?? now()->toDateString(),
                'total_bareme' => array_sum($scores),
                'reasons' => $validated['reasons'] ?? null,
            ]);

            BaremeDetail::create([
                'numero_dossier' => $numeroDossier,
                ...$scores,
                'total_points' => array_sum($scores),
            ]);
            DocumentFourni::create(['numero_dossier' => $numeroDossier, ...$documentFlags]);
            AuditHistorique::create([
                'numero_dossier' => $numeroDossier,
                'date_action' => now()->toDateTimeString(),
                'acteur' => $validated['acteur'] ?? 'API',
                'decision' => 'Création du dossier',
                'commentaire' => $validated['commentaire'] ?? null,
            ]);

            return $demande;
        });

        return response()->json([
            'message' => 'تم إنشاء طلب الاستفادة بنجاح',
            'data' => $demande->load(['candidat', 'bareme', 'documents', 'historique']),
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $demande = DemandeLogement::with(['candidat', 'bareme', 'documents', 'historique'])->findOrFail($id);

        return response()->json($demande);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:draft,submitted_dp,under_review_dp,transmitted_aref,approved,rejected',
            'statut_dossier' => 'sometimes|in:draft,submitted_dp,under_review_dp,transmitted_aref,approved,rejected',
            'numero_bordereau_dp' => 'nullable|string|max:50',
            'date_transmission_aref' => 'nullable|date',
            'numero_decision_aref' => 'nullable|string|max:50',
            'date_commission_aref' => 'nullable|date',
            'reasons' => 'nullable|string',
            'acteur' => 'nullable|string|max:100',
            'commentaire' => 'nullable|string',
        ]);

        $demande = DemandeLogement::findOrFail($id);
        $status = $validated['statut_dossier'] ?? $validated['status'] ?? null;
        $changes = collect($validated)->only([
            'numero_bordereau_dp',
            'date_transmission_aref',
            'numero_decision_aref',
            'date_commission_aref',
            'reasons',
        ])->all();

        DB::transaction(function () use ($demande, $status, $changes, $validated) {
            if ($status !== null) {
                $changes['statut_dossier'] = $status;
            }
            $demande->update($changes);

            if ($status !== null || $changes !== []) {
                AuditHistorique::create([
                    'numero_dossier' => $demande->numero_dossier,
                    'date_action' => now()->toDateTimeString(),
                    'acteur' => $validated['acteur'] ?? 'API',
                    'decision' => $status === null ? 'Mise à jour du dossier' : 'Statut: ' . $status,
                    'commentaire' => $validated['commentaire'] ?? null,
                ]);
            }
        });

        return response()->json([
            'message' => 'تم تحديث وضعية الملف بنجاح',
            'data' => $demande->fresh()->load(['candidat', 'bareme', 'documents', 'historique']),
        ]);
    }
}
