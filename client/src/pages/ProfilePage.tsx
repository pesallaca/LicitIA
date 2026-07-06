import { useState, useEffect } from 'react';
import { Building2, Loader2, Save, Gauge } from 'lucide-react';
import { apiGet, apiPut } from '../lib/api';

interface Profile {
  cpv_prefixes: string;
  keywords: string;
  min_budget: number | null;
  max_budget: number | null;
}

interface Usage {
  plan: string;
  planLabel: string;
  used: number;
  limit: number;
  remaining: number;
}

export default function ProfilePage() {
  const [cpv, setCpv] = useState('');
  const [keywords, setKeywords] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiGet<{ profile: Profile }>('/api/profile'),
      apiGet<{ usage: Usage }>('/api/profile/usage'),
    ])
      .then(([{ profile }, { usage }]) => {
        setCpv(profile.cpv_prefixes);
        setKeywords(profile.keywords);
        setMinBudget(profile.min_budget != null ? String(profile.min_budget) : '');
        setMaxBudget(profile.max_budget != null ? String(profile.max_budget) : '');
        setUsage(usage);
      })
      .catch(() => setError('No se pudo cargar el perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await apiPut('/api/profile', {
        cpvPrefixes: cpv,
        keywords,
        minBudget: minBudget ? Number(minBudget) : null,
        maxBudget: maxBudget ? Number(maxBudget) : null,
      });
      setMsg('Perfil guardado. La pestaña Mercado ya muestra tus licitaciones relevantes.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="font-serif text-3xl italic flex items-center gap-3">
          <Building2 /> Mi Empresa
        </h2>
        <p className="text-sm opacity-60 mt-2">
          Define el perfil de tu PYME y LicitIA cruzará automáticamente las licitaciones
          de PLACSP con tu actividad. Cuanto más preciso, mejores resultados.
        </p>
      </div>

      {usage && (
        <div className="bg-white border border-[#141414] p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gauge className="opacity-60" />
            <div>
              <p className="text-xs font-mono uppercase opacity-50">Plan {usage.planLabel}</p>
              <p className="font-bold">
                {usage.used} de {usage.limit > 100000 ? '∞' : usage.limit} análisis usados este mes
              </p>
            </div>
          </div>
          <span className="font-mono text-2xl font-bold">
            {usage.limit > 100000 ? '∞' : usage.remaining}
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-6">
        {msg && <div className="p-3 bg-green-50 border border-green-300 text-green-800 text-sm">{msg}</div>}
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-2">
            Códigos CPV de tu actividad (prefijos, separados por comas)
          </label>
          <input
            type="text"
            value={cpv}
            onChange={(e) => setCpv(e.target.value)}
            className="w-full p-3 bg-[#F5F5F3] border border-[#141414] focus:outline-none font-mono text-sm"
            placeholder="Ej: 72, 79 (72=informática, 79=servicios a empresas)"
          />
          <p className="text-xs opacity-50 mt-1">
            El CPV clasifica los contratos públicos. Basta el prefijo: «72» cubre todo lo informático.
          </p>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-2">
            Palabras clave (separadas por comas)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full p-3 bg-[#F5F5F3] border border-[#141414] focus:outline-none font-mono text-sm"
            placeholder="Ej: mantenimiento, jardinería, formación"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-2">Presupuesto mínimo (€)</label>
            <input
              type="number"
              min="0"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              className="w-full p-3 bg-[#F5F5F3] border border-[#141414] focus:outline-none font-mono text-sm"
              placeholder="Ej: 10000"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-2">Presupuesto máximo (€)</label>
            <input
              type="number"
              min="0"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="w-full p-3 bg-[#F5F5F3] border border-[#141414] focus:outline-none font-mono text-sm"
              placeholder="Ej: 500000"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-[#141414] text-[#E4E3E0] font-bold uppercase tracking-widest text-sm hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="animate-spin" size={18} /> Guardando...</> : <><Save size={16} /> Guardar perfil</>}
        </button>
      </form>
    </div>
  );
}
