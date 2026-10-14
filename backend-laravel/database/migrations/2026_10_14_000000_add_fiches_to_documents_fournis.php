<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents_fournis', function (Blueprint $table) {
            // مسطرة السكن الوظيفي (بلا تباري ولا تنقيط): المطبوع 5 و9.
            $table->boolean('fiche_visite')->default(false)->after('pv_installation');
            $table->string('fiche_visite_path')->nullable()->after('fiche_visite');
            $table->boolean('fiche_controle')->default(false)->after('fiche_visite_path');
            $table->string('fiche_controle_path')->nullable()->after('fiche_controle');
        });
    }

    public function down(): void
    {
        Schema::table('documents_fournis', function (Blueprint $table) {
            $table->dropColumn([
                'fiche_visite',
                'fiche_visite_path',
                'fiche_controle',
                'fiche_controle_path',
            ]);
        });
    }
};
