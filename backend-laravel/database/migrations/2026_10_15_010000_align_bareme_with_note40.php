<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * المذكرة 40: معياران كانا يُشتقان بدل أن يُسألا - المسؤولية الإدارية والراتب الوحيد -
 * إضافة إلى وضعية الزوج(ة) المهنية التي كانت تختزلها خانة "موظف(ة) نعم/لا".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidats', function (Blueprint $table) {
            if (!Schema::hasColumn('candidats', 'responsabilite')) {
                $table->string('responsabilite', 30)->default('none')->after('franchise_rurale');
            }
            if (!Schema::hasColumn('candidats', 'conjoint_situation')) {
                $table->string('conjoint_situation', 30)->nullable()->after('conjoint_fonctionnaire');
            }
            if (!Schema::hasColumn('candidats', 'salaire_unique')) {
                $table->boolean('salaire_unique')->default(false)->after('nombre_enfants');
            }
        });

        Schema::table('baremes_detail', function (Blueprint $table) {
            if (!Schema::hasColumn('baremes_detail', 'pts_salaire_unique')) {
                $table->unsignedInteger('pts_salaire_unique')->default(0)->after('pts_situation_familiale');
            }
        });
    }

    public function down(): void
    {
        Schema::table('baremes_detail', function (Blueprint $table) {
            if (Schema::hasColumn('baremes_detail', 'pts_salaire_unique')) {
                $table->dropColumn('pts_salaire_unique');
            }
        });

        Schema::table('candidats', function (Blueprint $table) {
            foreach (['responsabilite', 'conjoint_situation', 'salaire_unique'] as $column) {
                if (Schema::hasColumn('candidats', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
