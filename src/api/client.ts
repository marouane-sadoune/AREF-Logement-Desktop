import { HousingDossier, DossierStatus, EvictionProcedure, RegistreLogement } from '../types/housing';

// النسبي '/api/v1' يعمل داخل التطبيق المُغلَّف (نافذة NativePHP تفتح نفس المنفذ
// الذي يشغّل Laravel) وفي التطوير على أي منفذ، فلا يعلق التطبيق بمنفذ ثابت.
export const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

const TOKEN_KEY = 'aref_auth_token';

export function getAuthToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setAuthToken(token: string): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// جلسة منتهية/مُلغاة من أي نقطة API تُخرج التطبيق من الدخول مباشرة.
function handleUnauthorized(path: string) {
  if (path.startsWith('/auth/')) return;
  setAuthToken('');
  window.dispatchEvent(new Event('aref:unauthorized'));
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) handleUnauthorized(path);
    const message = body?.message || `${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return body;
}

const HOUSING_STATUS_TO_API: Record<string, string> = {
  vacant: 'vacant',
  occupied_to_evict: 'occupe_a_evacuer',
  under_maintenance: 'en_maintenance',
};
const HOUSING_STATUS_FROM_API: Record<string, string> = {
  vacant: 'vacant',
  occupe_a_evacuer: 'occupied_to_evict',
  en_maintenance: 'under_maintenance',
};

// Maps each of the mandatory Dossier de Demande documents (step 4 of the
// dossier form) to the column prefix used by the backend documents_fournis
// table (shared by the key boolean flag and the key_path file path column).
export const SUPPORTING_DOC_KEYS: Record<string, string> = {
  demandeManuscrite: 'demande_manuscrite',
  copieCIN: 'copie_cin',
  attestationTravail: 'attestation_travail',
  situationFamiliale: 'situation_familiale',
  situationFamilialeContratMariage: 'situation_familiale_contrat_mariage',
  situationFamilialeAttestationConjoint: 'situation_familiale_attestation_conjoint',
  situationFamilialeEnfants: 'situation_familiale_enfants',
  engagementHonneur: 'engagement_honneur',
  pvInstallation: 'pv_installation',
  attestationNonPropriete: 'attestation_non_propriete',
  ficheVisite: 'fiche_visite',
  ficheControle: 'fiche_controle',
};

function inferAuditStage(decision: string, index: number): string {
  const d = (decision || '').toLowerCase();
  if (d.includes('submitted_dp') || d.includes('إيداع') || d.includes('استلام')) return 'submission_dp';
  if (d.includes('transmitted_aref') || d.includes('احالة') || d.includes('ارسال') || d.includes('إحالة')) return 'transmission_aref';
  if (d.includes('commission') || d.includes('لجنة')) return 'commission_aref';
  if (d.includes('approved') || d.includes('rejected') || d.includes('المصادقة') || d.includes('الترخيص') || d.includes('رفض')) return 'final_decision';
  if (d.includes('under_review_dp') || d.includes('تدقيق') || d.includes('موافقة')) return 'audit_dp';
  if (index === 0 || d.includes('création') || d.includes('creation')) return 'creation';
  return 'audit_dp';
}

function fileNameFromPath(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.split('/').pop();
}

// The children-certificate column may hold a JSON array of storage paths
// (one birth certificate per child) or a legacy single path.
function documentPaths(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // not JSON — plain single path
  }
  return [value];
}

// Maps the flat Laravel demandes_logement JSON shape (with nested
// candidat/bareme/documents/historique) to the richer frontend HousingDossier
// shape. Fields the backend does not store yet (dpAudit/arefDecision
// sub-objects) are left undefined/false; callers that need them locally
// should merge on top of this result.
export function mapApiToDossier(api: any): HousingDossier {
  const c = api.candidat || {};
  const b = api.bareme || {};
  const docs = api.documents || {};

  return {
    id: String(api.id),
    referenceNumber: api.numero_dossier,
    creationDate: (api.date_creation || '').slice(0, 10),
    status: api.statut_dossier as DossierStatus,
    candidate: {
      fullNameAr: c.nom_ar || '',
      fullNameFr: c.nom_fr || '',
      cin: c.cin || '',
      gender: c.gender === 'female' ? 'female' : c.gender === 'male' ? 'male' : undefined,
      ppr: c.ppr || '',
      phone: c.telephone || '',
      email: c.email || '',
      grade: c.cadre || '',
      scale: c.echelle ?? 0,
      echelon: c.echelon ?? 0,
      seniorityGeneral: c.anciennete_generale ?? 0,
      seniorityEtablissement: c.anciennete_etablissement ?? 0,
      installationDate: (c.date_installation || '').slice(0, 10),
      currentEtablissement: c.etablissement_actuel || '',
      etablissementType: c.type_etablissement || '',
      commune: c.commune || '',
      directionProvinciale: c.direction_provinciale || '',
      aref: c.aref || '',
      performanceRating: (c.merdoudia || undefined) as any,
      isRuralArea: !!c.milieu_rural,
      isRuralBranch: !!c.franchise_rurale,
      responsibility: (c.responsabilite || 'none') as any,
      // null = لم يُجب بعد (ملفات قديمة أو مسطرة وظيفي): يبقى الحقل غير محدد.
      worksInSameCity: c.travaille_meme_ville === null || c.travaille_meme_ville === undefined
        ? undefined : !!c.travaille_meme_ville,
      ownsPersonalHousing: c.possede_logement === null || c.possede_logement === undefined
        ? undefined : !!c.possede_logement,
      hasDisciplinarySanction: c.sanction_disciplinaire === null || c.sanction_disciplinaire === undefined
        ? undefined : !!c.sanction_disciplinaire,
    },
    situationFamiliale: {
      maritalStatus: c.situation_familiale || 'celibataire',
      spouseName: c.nom_conjoint || '',
      spouseIsPublicOfficial: !!c.conjoint_fonctionnaire,
      spouseOccupation: (c.situation_familiale === 'marie'
        ? (c.conjoint_situation || (c.conjoint_fonctionnaire ? 'public_sector' : 'no_work'))
        : undefined) as any,
      soleFamilyIncome: !!c.salaire_unique,
      spouseAdministration: c.administration_conjoint || '',
      spousePPR: c.ppr_conjoint || '',
      childrenCount: c.nombre_enfants ?? 0,
    },
    housingRequest: {
      housingType: api.type_logement,
      targetEtablissement: api.etablissement_cible || '',
      housingCategory: api.categorie_logement || '',
      housingAddress: api.adresse_logement || '',
      housingNumber: api.numero_logement || '',
      housingStatus: (HOUSING_STATUS_FROM_API[api.statut_logement] || 'vacant') as any,
      reasons: api.reasons || '',
    },
    registreLogementId: api.registre_logement_id ?? null,
    logement: api.logement ?? null,
    documents: {
      demandeManuscrite: { present: !!docs.demande_manuscrite, fileName: fileNameFromPath(docs.demande_manuscrite_path) },
      copieCIN: { present: !!docs.copie_cin, fileName: fileNameFromPath(docs.copie_cin_path) },
      attestationTravail: { present: !!docs.attestation_travail, fileName: fileNameFromPath(docs.attestation_travail_path) },
      situationFamiliale: {
        present: !!docs.situation_familiale,
        fileName: fileNameFromPath(docs.situation_familiale_path),
        marriageCert: !!docs.situation_familiale_contrat_mariage_path,
        marriageCertFileName: fileNameFromPath(docs.situation_familiale_contrat_mariage_path),
        spouseAttestation: !!docs.situation_familiale_attestation_conjoint_path,
        spouseAttestationFileName: fileNameFromPath(docs.situation_familiale_attestation_conjoint_path),
        childrenCertificates: documentPaths(docs.situation_familiale_enfants_path).length > 0,
        childrenCertificatesFileName: fileNameFromPath(documentPaths(docs.situation_familiale_enfants_path)[0]),
        childrenCertificatesFileNames: documentPaths(docs.situation_familiale_enfants_path).map((p) => fileNameFromPath(p) || ''),
      },
      engagementHonneur: { present: !!docs.engagement_honneur, fileName: fileNameFromPath(docs.engagement_honneur_path) },
      pvInstallation: { present: !!docs.pv_installation, fileName: fileNameFromPath(docs.pv_installation_path) },
      attestationNonPropriete: {
        present: !!docs.attestation_non_propriete,
        fileName: fileNameFromPath(docs.attestation_non_propriete_path),
        date: docs.date_attestation_non_propriete ? String(docs.date_attestation_non_propriete).slice(0, 10) : undefined,
      },
      ficheVisite: { present: !!docs.fiche_visite, fileName: fileNameFromPath(docs.fiche_visite_path) },
      ficheControle: { present: !!docs.fiche_controle, fileName: fileNameFromPath(docs.fiche_controle_path) },
    },
    bareme: {
      seniorityGeneralPts: b.pts_anciennete_generale ?? 0,
      seniorityEtablissementPts: b.pts_anciennete_etablissement ?? 0,
      scalePts: b.pts_echelle ?? 0,
      maritalPts: b.pts_situation_familiale ?? 0,
      soleIncomePts: b.pts_salaire_unique ?? 0,
      childrenPts: b.pts_enfants ?? 0,
      responsibilityBonus: b.bonus_responsabilite ?? 0,
      performancePts: b.pts_merdoudia ?? 0,
      ruralBonusPts: b.pts_milieu_rural ?? 0,
      totalPts: b.total_points ?? 0,
    },
    auditHistory: (api.historique || []).map((h: any, i: number) => ({
      stage: inferAuditStage(h.decision || '', i) as any,
      date: h.date_action,
      actor: h.acteur,
      decision: h.decision,
      comment: h.commentaire || '',
    })),
    dpAudit: {
      bordereauNumber: api.numero_bordereau_dp || undefined,
      transmissionDate: api.date_transmission_aref ? String(api.date_transmission_aref).slice(0, 10) : undefined,
      // The DP audit is confirmed once the dossier reaches under_review_dp
      // (or beyond); the backend has no separate audit-completed flag.
      isComplete: ['under_review_dp', 'transmitted_aref', 'approved'].includes(api.statut_dossier),
    },
    arefDecision: {
      decisionNumber: api.numero_decision_aref || undefined,
      commissionDate: api.date_commission_aref ? String(api.date_commission_aref).slice(0, 10) : undefined,
    },
  };
}

function buildCreatePayload(dossier: HousingDossier) {
  const c = dossier.candidate;
  const f = dossier.situationFamiliale;
  const h = dossier.housingRequest;
  const bareme = dossier.bareme;
  const docs = dossier.documents;

  return {
    candidat: {
      ppr: c.ppr,
      cin: c.cin,
      gender: c.gender,
      nom_ar: c.fullNameAr,
      nom_fr: c.fullNameFr,
      telephone: c.phone,
      email: c.email,
      cadre: c.grade,
      echelle: c.scale,
      echelon: c.echelon,
      anciennete_generale: c.seniorityGeneral,
      anciennete_etablissement: c.seniorityEtablissement,
      date_installation: c.installationDate,
      etablissement_actuel: c.currentEtablissement,
      type_etablissement: c.etablissementType,
      commune: c.commune,
      direction_provinciale: c.directionProvinciale,
      aref: c.aref,
      situation_familiale: f.maritalStatus,
      // مسطرة السكن الوظيفي لا تسأل عن مهنة الزوج(ة) ولا عدد الأطفال: لا تُخزَّن قيم لم تُدخل.
      nom_conjoint: h.housingType === 'fonction' ? null : f.spouseName,
      conjoint_fonctionnaire: h.housingType === 'fonction' ? false : f.spouseIsPublicOfficial,
      administration_conjoint: h.housingType === 'fonction' ? null : f.spouseAdministration,
      ppr_conjoint: h.housingType === 'fonction' ? null : f.spousePPR,
      nombre_enfants: h.housingType === 'fonction' ? 0 : f.childrenCount,
      merdoudia: c.performanceRating ?? null,
      milieu_rural: !!c.isRuralArea,
      franchise_rurale: !!c.isRuralBranch,
      responsabilite: h.housingType === 'fonction' ? 'none' : (c.responsibility ?? 'none'),
      conjoint_situation: h.housingType === 'fonction' ? null : (f.spouseOccupation ?? null),
      salaire_unique: h.housingType === 'fonction' ? false : !!f.soleFamilyIncome,
      // المرحلة أ من المذكرة 40: شروط الترشح الثلاثة (لا تُسال في مسطرة السكن الوظيفي).
      travaille_meme_ville: h.housingType === 'fonction' ? null : (c.worksInSameCity ?? null),
      possede_logement: h.housingType === 'fonction' ? null : (c.ownsPersonalHousing ?? null),
      sanction_disciplinaire: h.housingType === 'fonction' ? null : (c.hasDisciplinarySanction ?? null),
    },
    type_logement: h.housingType,
    etablissement_cible: h.targetEtablissement,
    registre_logement_id: dossier.registreLogementId ?? null,
    categorie_logement: h.housingCategory,
    adresse_logement: h.housingAddress,
    numero_logement: h.housingNumber,
    statut_logement: HOUSING_STATUS_TO_API[h.housingStatus] || 'vacant',
    statut_dossier: dossier.status,
    date_creation: dossier.creationDate,
    reasons: h.reasons,
    // نقط شبكة التنقيط لا تُرسل: يحتسبها الخادم من معطيات المترشح (المذكرة 40).
    documents: {
      demande_manuscrite: docs.demandeManuscrite.present,
      copie_cin: docs.copieCIN.present,
      attestation_travail: docs.attestationTravail.present,
      situation_familiale: docs.situationFamiliale.present,
      engagement_honneur: docs.engagementHonneur.present,
      pv_installation: docs.pvInstallation.present,
      attestation_non_propriete: docs.attestationNonPropriete?.present ?? false,
      date_attestation_non_propriete: docs.attestationNonPropriete?.date || null,
      fiche_visite: docs.ficheVisite?.present ?? false,
      fiche_controle: docs.ficheControle?.present ?? false,
    },
  };
}

export async function fetchDossiers(): Promise<HousingDossier[]> {
  // The API paginates at 15 per page; walk every page so the full register
  // (including old closed dossiers used by the archive) is loaded.
  const all: any[] = [];
  let page = 1;
  for (;;) {
    const body = await request(`/assignments?page=${page}`);
    all.push(...(body.data || []));
    if (!body.next_page_url) break;
    page += 1;
  }
  return all.map(mapApiToDossier);
}

export async function fetchDossier(id: string): Promise<HousingDossier> {
  const body = await request(`/assignments/${id}`);
  return mapApiToDossier(body);
}

export async function createDossier(dossier: HousingDossier, acteur?: string): Promise<HousingDossier> {
  const body = await request('/assignments', {
    method: 'POST',
    body: JSON.stringify({ ...buildCreatePayload(dossier), acteur, commentaire: `إيداع الملف من طرف ${acteur || ''}` }),
  });
  return mapApiToDossier(body.data);
}

export async function updateDossierStatus(
  id: string,
  changes: {
    status?: DossierStatus;
    comment?: string;
    acteur?: string;
    numero_bordereau_dp?: string;
    date_transmission_aref?: string;
    numero_decision_aref?: string;
    date_commission_aref?: string;
    reasons?: string;
  }
): Promise<HousingDossier> {
  const { comment, ...rest } = changes;
  const body = await request(`/assignments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ ...rest, commentaire: comment }),
  });
  return mapApiToDossier(body.data);
}

// Uploads one of the 6 Dossier de Demande supporting documents so the
// DP agent can inspect it afterwards. docKey is a frontend document field
// name from SUPPORTING_DOC_KEYS (e.g. copieCIN).
export async function uploadDossierDocument(
  dossierId: string,
  docKey: string,
  file: File
): Promise<{ fileName: string }> {
  const backendKey = SUPPORTING_DOC_KEYS[docKey];
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/assignments/${dossierId}/documents/${backendKey}`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...authHeaders() },
    body: formData,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) handleUnauthorized(`/assignments/documents`);
    throw new Error(body?.message || `${res.status} ${res.statusText}`);
  }
  return body;
}

// Uploads all staged birth certificates (عقود الازدياد) for a dossier in
// one request — one file per child — as `files[]` on the children key.
export async function uploadChildrenCertificates(
  dossierId: string,
  files: File[]
): Promise<{ fileNames: string[] }> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files[]', file));

  const res = await fetch(`${API_BASE}/assignments/${dossierId}/documents/situation_familiale_enfants`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...authHeaders() },
    body: formData,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) handleUnauthorized(`/assignments/documents`);
    throw new Error(body?.message || `${res.status} ${res.statusText}`);
  }
  return body;
}

// URL to view/download an already-uploaded supporting document.
// `index` selects one file when the key stores several (birth certificates).
// الجلسة تُمرَّر عبر ?t= لأن هذه الروابط تُفتح مباشرة (صور/روابط) ولا تُرسل ترويسة.
export function getDossierDocumentUrl(dossierId: string, docKey: string, index?: number): string {
  const backendKey = SUPPORTING_DOC_KEYS[docKey];
  const params = new URLSearchParams();
  if (index !== undefined) params.set('index', String(index));
  const token = getAuthToken();
  if (token) params.set('t', token);
  const query = params.toString();
  const url = `${API_BASE}/assignments/${dossierId}/documents/${backendKey}`;
  return query ? `${url}?${query}` : url;
}

export type PdfSaveResult = { saved?: string; cancelled?: boolean };

// تحميل PDF مطابق للورقة المعروضة: الواجهة تولّد الملف ثم ترسله مرمَّزًا Base64،
// والخادم يفتحه في نافذة حفظ النظام ويكتبه في المسار الذي يختاره المستخدم.
export async function saveDocumentPdf(pdfBase64: string, filename: string): Promise<PdfSaveResult> {
  const res = await fetch(`${API_BASE}/documents/save-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...authHeaders() },
    body: JSON.stringify({ pdf: pdfBase64, filename, save: true }),
  });

  if (res.status === 401) handleUnauthorized('/documents/save-pdf');

  // خادم بلا تطبيق مكتبي يرجّع الملف نفسه عوض نافذة الحفظ: يُتجاهل ويُحمّل من الواجهة.
  if ((res.headers.get('content-type') || '').includes('application/pdf')) return {};

  const body = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(body?.message || `تعذّر حفظ ملف PDF (${res.status})`);
  return body as PdfSaveResult;
}

// ===== مساطر الإفراغ (المحور 4 من المذكرة 40) =====
// الأجل (deadline_months / deadline_date) يحتسب في الخادم حسب الحالة الموجبة.

export async function fetchEvictions(): Promise<EvictionProcedure[]> {
  const body = await request('/evictions');
  return body.data || [];
}

export async function createEviction(
  payload: Partial<EvictionProcedure> & { numero_dossier: string; case_type: string; trigger_date: string }
): Promise<EvictionProcedure> {
  const body = await request('/evictions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return body.data;
}

export async function updateEviction(
  id: number,
  changes: Partial<EvictionProcedure>
): Promise<EvictionProcedure> {
  const body = await request(`/evictions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
  return body.data;
}

export async function deleteEviction(id: number): Promise<void> {
  await request(`/evictions/${id}`, { method: 'DELETE' });
}

// ===== المسجل المركزي للمساكن (Registre des Logements) =====

export async function fetchLogements(params?: {
  dp?: string;
  statut?: string;
  type?: string;
  q?: string;
}): Promise<{ data: RegistreLogement[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.dp) qs.set('dp', params.dp);
  if (params?.statut) qs.set('statut', params.statut);
  if (params?.type) qs.set('type', params.type);
  if (params?.q) qs.set('q', params.q);
  const query = qs.toString();
  const body = await request(`/logements${query ? `?${query}` : ''}`);
  return { data: body.data, total: body.total ?? body.data?.length ?? 0 };
}

export async function createLogement(
  data: Partial<RegistreLogement>
): Promise<RegistreLogement> {
  const body = await request('/logements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return body.data ?? body;
}

export async function updateLogement(
  id: number,
  changes: Partial<RegistreLogement>
): Promise<RegistreLogement> {
  const body = await request(`/logements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
  return body.data ?? body;
}

export async function deleteLogement(id: number): Promise<void> {
  await request(`/logements/${id}`, { method: 'DELETE' });
}

// ===== المصادقة، الحسابات وسجلّ الدخول =====

export interface ApiUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
  dp_code?: string | null;
  dp_name_ar?: string | null;
  title?: string | null;
  is_active: boolean;
  has_password: boolean;
  last_login_at?: string | null;
}

export interface AuthSession {
  token: string;
  user: ApiUser;
}

export interface AuthLogEntry {
  id: number;
  username: string | null;
  event: string;
  success: boolean;
  reason: string | null;
  target_username: string | null;
  role: string | null;
  dp_code: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
}

export async function fetchAuthStatus(): Promise<{ needs_setup: boolean; username: string | null }> {
  return request('/auth/status');
}

export async function setupAdministrator(input: {
  username: string;
  full_name: string;
  password: string;
}): Promise<AuthSession> {
  const body = await request('/auth/setup', { method: 'POST', body: JSON.stringify(input) });
  return body.data;
}

export async function apiSignIn(username: string, password: string): Promise<AuthSession> {
  const body = await request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  return body.data;
}

export async function apiSignOut(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}

export async function fetchCurrentUser(): Promise<ApiUser> {
  const body = await request('/auth/me');
  return body.data;
}

export async function changeOwnPassword(currentPassword: string, password: string): Promise<void> {
  await request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, password }),
  });
}

export async function fetchAuthLogs(params: {
  event?: string;
  username?: string;
  success?: string;
  page?: number;
} = {}): Promise<{ data: AuthLogEntry[]; total: number }> {
  const qs = new URLSearchParams();
  if (params.event) qs.set('event', params.event);
  if (params.username) qs.set('username', params.username);
  if (params.success) qs.set('success', params.success);
  if (params.page) qs.set('page', String(params.page));
  const query = qs.toString();
  return request(`/auth/logs${query ? `?${query}` : ''}`);
}

export async function fetchUsers(): Promise<ApiUser[]> {
  const body = await request('/users');
  return body.data || [];
}

export async function createUserAccount(input: {
  username: string;
  full_name: string;
  role: string;
  dp_code?: string | null;
  dp_name_ar?: string | null;
  title?: string | null;
  password: string;
  is_active?: boolean;
}): Promise<ApiUser> {
  const body = await request('/users', { method: 'POST', body: JSON.stringify(input) });
  return body.data;
}

export async function updateUserAccount(
  id: number,
  changes: Partial<Pick<ApiUser, 'full_name' | 'role' | 'dp_code' | 'dp_name_ar' | 'title' | 'is_active'>>
): Promise<ApiUser> {
  const body = await request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
  return body.data;
}

export async function resetUserPassword(id: number, password: string): Promise<void> {
  await request(`/users/${id}/password`, { method: 'POST', body: JSON.stringify({ password }) });
}

export async function deleteUserAccount(id: number): Promise<void> {
  await request(`/users/${id}`, { method: 'DELETE' });
}