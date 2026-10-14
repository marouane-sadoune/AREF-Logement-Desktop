import React, { useMemo, useState } from 'react';
import { Building, Trophy, FileCheck } from 'lucide-react';
import { HousingDossier } from '../types/housing';
import { compareBareme } from '../utils/bareme';

interface CompareViewProps {
  dossiers: HousingDossier[];
}

export const CompareView: React.FC<CompareViewProps> = ({ dossiers }) => {
  const groups = useMemo(() => {
    const map = new Map<string, HousingDossier[]>();
    for (const d of dossiers) {
      // السكن الوظيفي يُسند بحكم المسؤولية: لا يخضع للتنقيط ولا للترتيب
      if (d.housingRequest.housingType === 'fonction') continue;
      const name = d.housingRequest.targetEtablissement || d.candidate.currentEtablissement || '—';
      // Same establishment name can exist in several DPs/cities — keep them separate
      const key = `${name} · ${d.candidate.commune || '—'} · ${d.candidate.directionProvinciale}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    // Only establishments with 2+ candidates are interesting for comparison
    return [...map.entries()]
      .filter(([, list]) => list.length >= 2)
      .map(([etab, list]) => [etab, list.sort(compareBareme)] as [string, HousingDossier[]]);
  }, [dossiers]);

  const [selectedEtab, setSelectedEtab] = useState<string | null>(groups[0]?.[0] || null);
  const current = groups.find(([e]) => e === selectedEtab) || groups[0];

  const countDocs = (d: HousingDossier) =>
    Object.values(d.documents).filter((doc: any) => doc?.present).length;

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-extrabold text-slate-900 mb-1">مقارنة المترشحين على نفس المؤسسة</h1>
        <p className="text-xs text-slate-600">
          مقارنة النقط والوثائق بين المترشحين المتنافسين على نفس السكن/المؤسسة التعليمية، مرتبين من الأعلى نقطاً.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-500">
          لا توجد حالياً مؤسسة يتنافس عليها أكثر من مترشح واحد.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {groups.map(([etab, list]) => (
              <button
                key={etab}
                onClick={() => setSelectedEtab(etab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  current?.[0] === etab
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building className="w-3.5 h-3.5 inline ml-1" />
                {etab} ({list.length})
              </button>
            ))}
          </div>

          {current && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="p-3 text-right">الترتيب</th>
                    <th className="p-3 text-right">المترشح</th>
                    <th className="p-3 text-right">الإطار</th>
                    <th className="p-3 text-center">الأقدمية</th>
                    <th className="p-3 text-center">الأطفال</th>
                    <th className="p-3 text-center">الوثائق</th>
                    <th className="p-3 text-center">النقط</th>
                    <th className="p-3 text-right">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {current[1].map((d, idx) => (
                    <tr key={d.id} className={`border-b border-slate-100 ${idx === 0 ? 'bg-emerald-50/50' : ''}`}>
                      <td className="p-3 font-bold">
                        {idx === 0 ? <Trophy className="w-4 h-4 text-amber-500 inline" /> : idx + 1}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{d.candidate.fullNameAr}</td>
                      <td className="p-3 text-slate-600">{d.candidate.grade}</td>
                      <td className="p-3 text-center font-mono">{d.candidate.seniorityGeneral} سنة</td>
                      <td className="p-3 text-center font-mono">{d.situationFamiliale.childrenCount}</td>
                      <td className="p-3 text-center">
                        <span className={`font-mono ${countDocs(d) === 6 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {countDocs(d)}/6
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-800">{d.bareme.totalPts}</td>
                      <td className="p-3 text-slate-600">{d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
