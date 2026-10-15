<?php

namespace App\Services;

/**
 * شبكة التنقيط الرسمية - المذكرة الوزارية رقم 40.
 * يحتسب الخادم النقط من معطيات المترشح ولا يقبل قيوداً جاهزة من الواجهة.
 */
class Note40ScoreCalculator
{
    private const SCALE_HIGH = 3;   // السلم 10 فما فوق وخارج السلم
    private const SCALE_MID = 2;    // السلم 7-8-9
    private const SCALE_LOW = 1;    // السلم 1 إلى 6

    private const PERFORMANCE_PTS = [
        'excellent' => 4,
        'good' => 2,
        'satisfactory' => 1,
        'below' => 0,
    ];

    private const RESPONSIBILITY_PTS = [
        'none' => 0,
        'chef_service' => 2,
        'chef_division' => 3,
    ];

    private const SPOUSE_NO_WORK_PTS = 3;
    private const SOLE_INCOME_PTS = 2;
    private const CHILDREN_CAP = 3;

    /**
     * @param  array<string, mixed>  $candidat
     * @return array<string, int>
     */
    public static function score(array $candidat): array
    {
        $seniorityGeneral = (int) ($candidat['anciennete_generale'] ?? 0);
        $seniorityLocality = (int) ($candidat['anciennete_etablissement'] ?? 0);
        $children = min((int) ($candidat['nombre_enfants'] ?? 0), self::CHILDREN_CAP);

        $spousePoints = $candidat['situation_familiale'] === 'marie'
            && self::spouseOccupation($candidat) === 'no_work'
            ? self::SPOUSE_NO_WORK_PTS
            : 0;

        $ruralPoints = 0;
        if (! empty($candidat['milieu_rural'])
            && ($candidat['gender'] ?? null) === 'female'
            && ($candidat['situation_familiale'] ?? null) === 'celibataire') {
            $ruralPoints = 3;
        } elseif (! empty($candidat['franchise_rurale'])) {
            $ruralPoints = 2;
        }

        $scores = [
            'pts_echelle' => self::scalePoints((int) ($candidat['echelle'] ?? 0)),
            'pts_anciennete_generale' => self::generalSeniorityPoints($seniorityGeneral),
            'pts_anciennete_etablissement' => $seniorityLocality >= 6 ? 2 : ($seniorityLocality >= 1 ? 1 : 0),
            'pts_situation_familiale' => $spousePoints,
            'pts_salaire_unique' => ! empty($candidat['salaire_unique']) ? self::SOLE_INCOME_PTS : 0,
            'pts_enfants' => $children,
            'bonus_responsabilite' => self::RESPONSIBILITY_PTS[$candidat['responsabilite'] ?? 'none'] ?? 0,
            'pts_merdoudia' => self::PERFORMANCE_PTS[$candidat['merdoudia'] ?? 'satisfactory'] ?? 1,
            'pts_milieu_rural' => $ruralPoints,
        ];

        return $scores;
    }

    /**
     * السكن الوظيفي يُسند بحكم المهام: لا تباري ولا شبكة تنقيط.
     *
     * @return array<string, int>
     */
    public static function zeroed(): array
    {
        return array_fill_keys(array_keys(self::score([])), 0);
    }

    private static function spouseOccupation(array $candidat): string
    {
        if (! empty($candidat['conjoint_situation'])) {
            return (string) $candidat['conjoint_situation'];
        }

        return empty($candidat['conjoint_fonctionnaire']) ? 'no_work' : 'public_sector';
    }

    private static function scalePoints(int $echelle): int
    {
        if ($echelle >= 10 || $echelle === 99) {
            return self::SCALE_HIGH;
        }

        return $echelle >= 7 ? self::SCALE_MID : self::SCALE_LOW;
    }

    private static function generalSeniorityPoints(int $years): int
    {
        return match (true) {
            $years >= 25 => 6,
            $years >= 20 => 5,
            $years >= 15 => 4,
            $years >= 10 => 3,
            $years >= 5 => 2,
            $years >= 1 => 1,
            default => 0,
        };
    }
}
