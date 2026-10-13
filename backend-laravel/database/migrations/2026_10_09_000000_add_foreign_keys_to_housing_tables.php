<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Add real database-level foreign keys between the housing tables.
|--------------------------------------------------------------------------
| The baseline migration declared these constraints inside createIfMissing()
| closures, so they were skipped on databases whose tables already existed.
| The Eloquent relations were therefore logical only, with no enforcement at
| the DB level. This migration adds the missing constraints idempotently.
*/

return new class extends Migration
{
    private function foreignKeyExists(string $table, string $constraint): bool
    {
        // SQLite: constraints already created inline by the baseline migration;
        // ALTER-based FK checks are not supported on this driver.
        if (DB::getDriverName() === 'sqlite') {
            return true;
        }

        if (DB::getDriverName() === 'pgsql') {
            $row = DB::selectOne(
                "SELECT con.conname FROM pg_constraint con
                 JOIN pg_class rel ON rel.oid = con.conrelid
                 JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                 WHERE nsp.nspname = current_schema()
                   AND rel.relname = ?
                   AND con.conname = ?
                   AND con.contype = 'f'",
                [$table, $constraint]
            );

            return $row !== null;
        }

        $row = DB::selectOne(
            'SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND CONSTRAINT_NAME = ?
               AND CONSTRAINT_TYPE = \'FOREIGN KEY\'',
            [$table, $constraint]
        );

        return $row !== null;
    }

    private function addForeignKey(
        string $table,
        string $column,
        string $referencedTable,
        string $referencedColumn,
        string $onDelete
    ): void {
        $constraint = "{$table}_{$column}_foreign";

        if ($this->foreignKeyExists($table, $constraint)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use (
            $column,
            $referencedTable,
            $referencedColumn,
            $onDelete,
            $constraint
        ) {
            $blueprint->foreign($column, $constraint)
                ->references($referencedColumn)
                ->on($referencedTable)
                ->onDelete($onDelete);
        });
    }

    private function dropForeignKey(string $table, string $column): void
    {
        $constraint = "{$table}_{$column}_foreign";

        if (! $this->foreignKeyExists($table, $constraint)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($constraint) {
            $blueprint->dropForeign($constraint);
        });
    }

    public function up(): void
    {
        // A demande always belongs to an existing candidat (matched by PPR).
        $this->addForeignKey('demandes_logement', 'candidat_ppr', 'candidats', 'ppr', 'restrict');

        // Child records are owned by a single dossier and follow it on delete.
        $this->addForeignKey('baremes_detail', 'numero_dossier', 'demandes_logement', 'numero_dossier', 'cascade');
        $this->addForeignKey('documents_fournis', 'numero_dossier', 'demandes_logement', 'numero_dossier', 'cascade');
        $this->addForeignKey('audit_historique', 'numero_dossier', 'demandes_logement', 'numero_dossier', 'cascade');
    }

    public function down(): void
    {
        $this->dropForeignKey('audit_historique', 'numero_dossier');
        $this->dropForeignKey('documents_fournis', 'numero_dossier');
        $this->dropForeignKey('baremes_detail', 'numero_dossier');
        $this->dropForeignKey('demandes_logement', 'candidat_ppr');
    }
};
