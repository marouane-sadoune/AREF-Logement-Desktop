import { HousingDossier, ORIENTAL_DIRECTORATES } from '../types/housing';

export function generateArefOrientalSql(dossiers: HousingDossier[]): string {
  const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  let sql = `-- ========================================================
-- Base de Données: aref_oriental
-- Serveur: MySQL / MariaDB (phpMyAdmin)
-- Système de Gestion du Logement Administratif et de Fonction
-- Note Ministérielle N° 40 - Académie Régionale de l'Oriental
-- Généré le: ${currentDate}
-- ========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Création et sélection de la base de données
--
CREATE DATABASE IF NOT EXISTS \`aref_oriental\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`aref_oriental\`;

-- --------------------------------------------------------

--
-- Structure de la table \`directions_provinciales\`
--
DROP TABLE IF EXISTS \`directions_provinciales\`;
CREATE TABLE \`directions_provinciales\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`code\` varchar(10) NOT NULL,
  \`nom_ar\` varchar(100) NOT NULL,
  \`nom_fr\` varchar(150) NOT NULL,
  \`chef_lieu\` varchar(100) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`code_unique\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table \`directions_provinciales\` (Les 8 DP de l'Oriental)
--
INSERT INTO \`directions_provinciales\` (\`id\`, \`code\`, \`nom_ar\`, \`nom_fr\`, \`chef_lieu\`) VALUES
(1, 'OUJ', 'المديرية الإقليمية بوجدة أنكاد', 'Direction Provinciale d''Oujda-Angad', 'وجدة'),
(2, 'BRK', 'المديرية الإقليمية ببركان', 'Direction Provinciale de Berkane', 'بركان'),
(3, 'NAD', 'المديرية الإقليمية بالناظور', 'Direction Provinciale de Nador', 'الناظور'),
(4, 'DRI', 'المديرية الإقليمية بالدريوش', 'Direction Provinciale de Driouch', 'الدريوش'),
(5, 'TAO', 'المديرية الإقليمية بتاوريرت', 'Direction Provinciale de Taourirt', 'تاوريرت'),
(6, 'GUE', 'المديرية الإقليمية بجرسيف', 'Direction Provinciale de Guercif', 'جرسيف'),
(7, 'JER', 'المديرية الإقليمية بجرادة', 'Direction Provinciale de Jerada', 'جرادة'),
(8, 'FIG', 'المديرية الإقليمية بفكيك (بوعرفة)', 'Direction Provinciale de Figuig (Bouarfa)', 'فكيك / بوعرفة');

-- --------------------------------------------------------

--
-- Structure de la table \`utilisateurs\` (4 Roles: dp_agent, aref_validator, aref_director, dev)
--
DROP TABLE IF EXISTS \`utilisateurs\`;
CREATE TABLE \`utilisateurs\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`username\` varchar(50) NOT NULL COMMENT 'اسم الدخول',
  \`nom_complet\` varchar(150) NOT NULL COMMENT 'الاسم الكامل للمستخدم',
  \`email\` varchar(150) NOT NULL,
  \`role\` enum('dp_agent','aref_validator','aref_director','dev') NOT NULL COMMENT 'الدور الوظيفي',
  \`dp_code\` varchar(10) DEFAULT NULL COMMENT 'الارتباط الجغرافي بالمديرية الإقليمية',
  \`titre_fonction\` varchar(150) NOT NULL COMMENT 'الصفة أو المنصب الإداري',
  \`statut_actif\` tinyint(1) NOT NULL DEFAULT 1,
  \`date_creation\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`dernier_acces\` varchar(30) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`username_unique\` (\`username\`),
  KEY \`fk_user_dp\` (\`dp_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table \`utilisateurs\`
--
INSERT INTO \`utilisateurs\` (\`id\`, \`username\`, \`nom_complet\`, \`email\`, \`role\`, \`dp_code\`, \`titre_fonction\`, \`statut_actif\`, \`dernier_acces\`) VALUES
(1, 'dev_admin', 'المشرف التقني للنظام', 'dev@aref-oriental.ma', 'dev', NULL, 'المسؤول التقني والمطور العام (Super Admin)', 1, '2026-09-28 11:30'),
(2, 'directeur_aref', 'السيد مدير الأكاديمية الجهوية لجهة الشرق', 'directeur@aref-oriental.ma', 'aref_director', NULL, 'مدير الأكاديمية الجهوية (صاحب القرار النهائي والتوقيع)', 1, '2026-09-28 10:15'),
(3, 'validateur_aref', 'رئيس مصلحة الممتلكات والسكنيات بالأكاديمية', 'logements@aref-oriental.ma', 'aref_validator', NULL, 'مسؤول التدقيق والافتحاص الجهوي (AREF)', 1, '2026-09-28 09:45'),
(4, 'agent_oujda', 'مصلحة تدبير السكنيات - DP وجدة أنكاد', 'dp.oujda@aref-oriental.ma', 'dp_agent', 'OUJ', 'ممثل المديرية الإقليمية بوجدة أنكاد', 1, '2026-09-28 08:30'),
(5, 'agent_berkane', 'مصلحة تدبير السكنيات - DP بركان', 'dp.berkane@aref-oriental.ma', 'dp_agent', 'BRK', 'ممثل المديرية الإقليمية ببركان', 1, '2026-09-27 16:10'),
(6, 'agent_nador', 'مصلحة تدبير السكنيات - DP الناظور', 'dp.nador@aref-oriental.ma', 'dp_agent', 'NAD', 'ممثل المديرية الإقليمية بالناظور', 1, '2026-09-27 15:40'),
(7, 'agent_driouch', 'مصلحة تدبير السكنيات - DP الدريوش', 'dp.driouch@aref-oriental.ma', 'dp_agent', 'DRI', 'ممثل المديرية الإقليمية بالدريوش', 1, NULL),
(8, 'agent_taourirt', 'مصلحة تدبير السكنيات - DP تاوريرت', 'dp.taourirt@aref-oriental.ma', 'dp_agent', 'TAO', 'ممثل المديرية الإقليمية بتاوريرت', 1, NULL),
(9, 'agent_guercif', 'مصلحة تدبير السكنيات - DP جرسيف', 'dp.guercif@aref-oriental.ma', 'dp_agent', 'GUE', 'ممثل المديرية الإقليمية بجرسيف', 1, NULL),
(10, 'agent_jerada', 'مصلحة تدبير السكنيات - DP جرادة', 'dp.jerada@aref-oriental.ma', 'dp_agent', 'JER', 'ممثل المديرية الإقليمية بجرادة', 1, NULL),
(11, 'agent_figuig', 'مصلحة تدبير السكنيات - DP فكيك (بوعرفة)', 'dp.figuig@aref-oriental.ma', 'dp_agent', 'FIG', 'ممثل المديرية الإقليمية بفكيك', 1, NULL);

-- --------------------------------------------------------

--
-- Structure de la table \`candidats\`
--
DROP TABLE IF EXISTS \`candidats\`;
CREATE TABLE \`candidats\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`ppr\` varchar(20) NOT NULL COMMENT 'Numéro SOM / رقم التأجير',
  \`cin\` varchar(20) NOT NULL COMMENT 'Carte d''Identité Nationale',
  \`nom_ar\` varchar(100) NOT NULL,
  \`nom_fr\` varchar(100) DEFAULT NULL,
  \`telephone\` varchar(20) DEFAULT NULL,
  \`email\` varchar(100) DEFAULT NULL,
  \`cadre\` varchar(100) NOT NULL COMMENT 'الإطار / المهمة الإدارية',
  \`echelle\` int(11) NOT NULL,
  \`echelon\` int(11) NOT NULL,
  \`anciennete_generale\` int(11) NOT NULL COMMENT 'En années (نقطة/سنة)',
  \`anciennete_etablissement\` int(11) NOT NULL COMMENT 'En années (2 نقط/سنة)',
  \`etablissement_actuel\` varchar(150) NOT NULL,
  \`type_etablissement\` varchar(50) DEFAULT NULL,
  \`commune\` varchar(100) DEFAULT NULL,
  \`direction_provinciale\` varchar(100) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`ppr_unique\` (\`ppr\`),
  KEY \`cin_idx\` (\`cin\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table \`demandes_logement\`
--
DROP TABLE IF EXISTS \`demandes_logement\`;
CREATE TABLE \`demandes_logement\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`numero_dossier\` varchar(50) NOT NULL COMMENT 'رقم الملف المرجعي',
  \`candidat_ppr\` varchar(20) NOT NULL,
  \`type_logement\` enum('fonction','administratif') NOT NULL,
  \`etablissement_cible\` varchar(150) NOT NULL,
  \`categorie_logement\` varchar(100) DEFAULT NULL,
  \`adresse_logement\` text DEFAULT NULL,
  \`numero_logement\` varchar(50) DEFAULT NULL,
  \`statut_logement\` enum('vacant','occupe_a_evacuer','en_maintenance') DEFAULT 'vacant',
  \`statut_dossier\` enum('draft','submitted_dp','under_review_dp','transmitted_aref','approved','rejected') NOT NULL DEFAULT 'submitted_dp',
  \`date_creation\` date NOT NULL,
  \`total_bareme\` int(11) NOT NULL DEFAULT 0,
  \`numero_bordereau_dp\` varchar(50) DEFAULT NULL COMMENT 'N° Bordereau d''envoi à l''AREF',
  \`date_transmission_aref\` date DEFAULT NULL,
  \`numero_decision_aref\` varchar(50) DEFAULT NULL COMMENT 'N° Décision d''attribution',
  \`date_commission_aref\` date DEFAULT NULL,
  \`reasons\` text DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`num_dossier_unique\` (\`numero_dossier\`),
  KEY \`fk_candidat\` (\`candidat_ppr\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table \`documents_fournis\`
-- (الوثائق الإلزامية التي تشترطها المذكرة 40 لملف السكن الإداري)
--
DROP TABLE IF EXISTS \`documents_fournis\`;
CREATE TABLE \`documents_fournis\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`numero_dossier\` varchar(50) NOT NULL,
  \`demande_manuscrite\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1. الطلب الخطي موجه للمدير الإقليمي',
  \`copie_cin\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '2. نسخة ب.ت.و الإلكترونية مصادق عليها',
  \`attestation_travail\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '3. شهادة العمل حديثة تثبت الإطار والسلم',
  \`situation_familiale\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '4. وثائق الوضع العائلي والأطفال',
  \`engagement_honneur\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '5. مطبوع الالتزام مصحح الإمضاء',
  \`pv_installation\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '6. محضر الالتحاق الفعلي بالمؤسسة',
  \`attestation_non_propriete\` tinyint(1) NOT NULL DEFAULT 0 COMMENT '7. شهادة عدم امتلاك السكن (صالحة شهرين)',
  \`date_attestation_non_propriete\` date DEFAULT NULL COMMENT 'تاريخ إصدار شهادة عدم امتلاك السكن',
  \`date_verification_dp\` date DEFAULT NULL,
  \`audite_par\` varchar(100) DEFAULT NULL,
  \`remarques_audit\` text DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_dossier_docs\` (\`numero_dossier\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table \`baremes_detail\`
--
DROP TABLE IF EXISTS \`baremes_detail\`;
CREATE TABLE \`baremes_detail\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`numero_dossier\` varchar(50) NOT NULL,
  \`pts_anciennete_generale\` int(11) NOT NULL DEFAULT 0,
  \`pts_anciennete_etablissement\` int(11) NOT NULL DEFAULT 0,
  \`pts_echelle\` int(11) NOT NULL DEFAULT 0,
  \`pts_situation_familiale\` int(11) NOT NULL DEFAULT 0,
  \`pts_salaire_unique\` int(11) NOT NULL DEFAULT 0 COMMENT '2 نقطة عن الراتب الوحيد للأسرة',
  \`pts_enfants\` int(11) NOT NULL DEFAULT 0,
  \`bonus_responsabilite\` int(11) NOT NULL DEFAULT 0 COMMENT 'امتياز الوظيفة الملزمة بحكم المذكرة 40',
  \`pts_merdoudia\` int(11) NOT NULL DEFAULT 0,
  \`pts_milieu_rural\` int(11) NOT NULL DEFAULT 0,
  \`total_points\` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`dossier_bareme_unique\` (\`numero_dossier\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table \`audit_historique\`
--
DROP TABLE IF EXISTS \`audit_historique\`;
CREATE TABLE \`audit_historique\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`numero_dossier\` varchar(50) NOT NULL,
  \`date_action\` varchar(30) NOT NULL,
  \`acteur\` varchar(100) NOT NULL,
  \`decision\` varchar(150) NOT NULL,
  \`commentaire\` text DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_dossier_audit\` (\`numero_dossier\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- INSERTION DES CANDIDATS ET DOSSIERS (Région de l'Oriental)
-- ========================================================
`;

  // Insertion loop
  dossiers.forEach((d) => {
    const c = d.candidate;
    const f = d.situationFamiliale;
    const h = d.housingRequest;
    const docs = d.documents;
    const b = d.bareme;

    const escapeStr = (val: string | undefined) => 
      val ? val.replace(/'/g, "''").replace(/\\/g, '\\\\') : '';

    sql += `
-- Candidat: ${c.fullNameAr} (${c.directionProvinciale})
INSERT INTO \`candidats\` (\`ppr\`, \`cin\`, \`nom_ar\`, \`nom_fr\`, \`telephone\`, \`email\`, \`cadre\`, \`echelle\`, \`echelon\`, \`anciennete_generale\`, \`anciennete_etablissement\`, \`etablissement_actuel\`, \`type_etablissement\`, \`commune\`, \`direction_provinciale\`)
VALUES ('${escapeStr(c.ppr)}', '${escapeStr(c.cin)}', '${escapeStr(c.fullNameAr)}', '${escapeStr(c.fullNameFr)}', '${escapeStr(c.phone)}', '${escapeStr(c.email)}', '${escapeStr(c.grade)}', ${c.scale}, ${c.echelon}, ${c.seniorityGeneral}, ${c.seniorityEtablissement}, '${escapeStr(c.currentEtablissement)}', '${escapeStr(c.etablissementType)}', '${escapeStr(c.commune)}', '${escapeStr(c.directionProvinciale)}')
ON DUPLICATE KEY UPDATE \`cadre\`='${escapeStr(c.grade)}', \`echelle\`=${c.scale};

INSERT INTO \`demandes_logement\` (\`numero_dossier\`, \`candidat_ppr\`, \`type_logement\`, \`etablissement_cible\`, \`categorie_logement\`, \`adresse_logement\`, \`numero_logement\`, \`statut_logement\`, \`statut_dossier\`, \`date_creation\`, \`total_bareme\`, \`numero_bordereau_dp\`, \`date_transmission_aref\`, \`numero_decision_aref\`, \`date_commission_aref\`, \`reasons\`)
VALUES ('${escapeStr(d.referenceNumber)}', '${escapeStr(c.ppr)}', '${h.housingType}', '${escapeStr(h.targetEtablissement)}', '${escapeStr(h.housingCategory)}', '${escapeStr(h.housingAddress)}', '${escapeStr(h.housingNumber)}', '${h.housingStatus}', '${d.status}', '${d.creationDate}', ${b.totalPts}, ${d.dpAudit?.bordereauNumber ? `'${escapeStr(d.dpAudit.bordereauNumber)}'` : 'NULL'}, ${d.dpAudit?.transmissionDate ? `'${d.dpAudit.transmissionDate}'` : 'NULL'}, ${d.arefDecision?.decisionNumber ? `'${escapeStr(d.arefDecision.decisionNumber)}'` : 'NULL'}, ${d.arefDecision?.commissionDate ? `'${d.arefDecision.commissionDate}'` : 'NULL'}, '${escapeStr(h.reasons)}')
ON DUPLICATE KEY UPDATE \`total_bareme\`=${b.totalPts}, \`statut_dossier\`='${d.status}';

INSERT INTO \`documents_fournis\` (\`numero_dossier\`, \`demande_manuscrite\`, \`copie_cin\`, \`attestation_travail\`, \`situation_familiale\`, \`engagement_honneur\`, \`pv_installation\`, \`attestation_non_propriete\`, \`date_attestation_non_propriete\`, \`date_verification_dp\`, \`audite_par\`, \`remarques_audit\`)
VALUES ('${escapeStr(d.referenceNumber)}', ${docs.demandeManuscrite.present ? 1 : 0}, ${docs.copieCIN.present ? 1 : 0}, ${docs.attestationTravail.present ? 1 : 0}, ${docs.situationFamiliale.present ? 1 : 0}, ${docs.engagementHonneur.present ? 1 : 0}, ${docs.pvInstallation.present ? 1 : 0}, ${docs.attestationNonPropriete?.present ? 1 : 0}, ${docs.attestationNonPropriete?.date ? `'${docs.attestationNonPropriete.date}'` : 'NULL'}, ${d.dpAudit?.auditDate ? `'${d.dpAudit.auditDate}'` : 'NULL'}, '${escapeStr(d.dpAudit?.auditedBy)}', '${escapeStr(d.dpAudit?.dpNotes)}');

INSERT INTO \`baremes_detail\` (\`numero_dossier\`, \`pts_anciennete_generale\`, \`pts_anciennete_etablissement\`, \`pts_echelle\`, \`pts_situation_familiale\`, \`pts_salaire_unique\`, \`pts_enfants\`, \`bonus_responsabilite\`, \`pts_merdoudia\`, \`pts_milieu_rural\`, \`total_points\`)
VALUES ('${escapeStr(d.referenceNumber)}', ${b.seniorityGeneralPts}, ${b.seniorityEtablissementPts}, ${b.scalePts}, ${b.maritalPts}, ${b.soleIncomePts}, ${b.childrenPts}, ${b.responsibilityBonus}, ${b.performancePts ?? 0}, ${b.ruralBonusPts ?? 0}, ${b.totalPts})
ON DUPLICATE KEY UPDATE \`total_points\`=${b.totalPts};
`;

    if (d.auditHistory && d.auditHistory.length > 0) {
      d.auditHistory.forEach((item) => {
        sql += `INSERT INTO \`audit_historique\` (\`numero_dossier\`, \`date_action\`, \`acteur\`, \`decision\`, \`commentaire\`) VALUES ('${escapeStr(d.referenceNumber)}', '${escapeStr(item.date)}', '${escapeStr(item.actor)}', '${escapeStr(item.decision)}', '${escapeStr(item.comment)}');\n`;
      });
    }
  });

  sql += `
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
`;

  return sql;
}
