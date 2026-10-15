<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentFourni extends Model
{
    protected $table = 'documents_fournis';

    protected $guarded = ['id'];

    public $timestamps = false;

    protected $casts = [
        'demande_manuscrite' => 'boolean',
        'copie_cin' => 'boolean',
        'attestation_travail' => 'boolean',
        'situation_familiale' => 'boolean',
        'engagement_honneur' => 'boolean',
        'pv_installation' => 'boolean',
        'attestation_non_propriete' => 'boolean',
        'date_attestation_non_propriete' => 'date',
        'fiche_visite' => 'boolean',
        'fiche_controle' => 'boolean',
        'date_verification_dp' => 'date',
    ];

    public function demande(): BelongsTo
    {
        return $this->belongsTo(DemandeLogement::class, 'numero_dossier', 'numero_dossier');
    }
}