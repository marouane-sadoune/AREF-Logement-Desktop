<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// المرحلة أ من المذكرة 40: شروط الترشح الثلاثة صريحة في قاعدة المعطيات،
// وشهادة عدم امتلاك السكن وثيقة إلزامية سارية الصلاحية (شهران من تاريخها).
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('candidats', 'travaille_meme_ville')) {
            Schema::table('candidats', function (Blueprint $table) {
                $table->boolean('travaille_meme_ville')->nullable()->after('franchise_rurale');
            });
        }
        if (!Schema::hasColumn('candidats', 'possede_logement')) {
            Schema::table('candidats', function (Blueprint $table) {
                $table->boolean('possede_logement')->nullable()->after('travaille_meme_ville');
            });
        }
        if (!Schema::hasColumn('candidats', 'sanction_disciplinaire')) {
            Schema::table('candidats', function (Blueprint $table) {
                $table->boolean('sanction_disciplinaire')->nullable()->after('possede_logement');
            });
        }

        if (!Schema::hasColumn('documents_fournis', 'attestation_non_propriete')) {
            Schema::table('documents_fournis', function (Blueprint $table) {
                $table->boolean('attestation_non_propriete')->default(false)->after('pv_installation');
                $table->string('attestation_non_propriete_path')->nullable()->after('attestation_non_propriete');
                $table->date('date_attestation_non_propriete')->nullable()->after('attestation_non_propriete_path');
            });
        }
    }

    public function down(): void
    {
        Schema::table('candidats', function (Blueprint $table) {
            foreach (['travaille_meme_ville', 'possede_logement', 'sanction_disciplinaire'] as $column) {
                if (Schema::hasColumn('candidats', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        if (Schema::hasColumn('documents_fournis', 'attestation_non_propriete')) {
            Schema::table('documents_fournis', function (Blueprint $table) {
                $table->dropColumn(['attestation_non_propriete', 'attestation_non_propriete_path', 'date_attestation_non_propriete']);
            });
        }
    }
};
