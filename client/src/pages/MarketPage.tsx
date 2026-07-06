import { useState, useEffect } from 'react';
import { TrendingUp, Search, ExternalLink, Loader2, RefreshCw, Target, Building2 } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Tender {
  id: number;
  title: string;
  contracting_body: string | null;
  contract_type: string | null;
  budget_amount: number | null;
  submission_deadline: string | null;
  source_url: string | null;
  scraped_at: string;
  relevance?: number;
}

interface Stats {
  totalOpen: number;
  avgBudget: number;
  byType: { type: string; count: number }[];
  byProcedure: { type: string; count: number }[];
  lastScraped: string | null;
}

export default function MarketPage({ onGoToProfile }: { onGoToProfile?: () => void }) {
  const { user } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [relevant, setRelevant] = useState<Tender[]>([]);
  const [profileMissing, setProfileMissing] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tendersData, statsData, relevantData] = await Promise.all([
        apiGet<{ tenders: Tender[]; total: number }>('/api/market/tenders?limit=15'),
        apiGet<Stats>('/api/market/stats'),
        apiGet<{ tenders: Tender[]; profileMissing: boolean }>('/api/market/relevant?limit=10'),
      ]);
      setTenders(tendersData.tenders);
      setStats(statsData);
      setRelevant(relevantData.tenders);
      setProfileMissing(relevantData.profileMissing);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleScrape = async () => {
    setScraping(true);
    try {
      await apiPost('/api/market/scrape', {});
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setScraping(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-3xl italic">Inteligencia de Mercado</h2>
        {user?.is_admin && (
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="flex items-center gap-2 px-4 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <RefreshCw size={14} className={scraping ? 'animate-spin' : ''} />
            {scraping ? 'Actualizando...' : 'Actualizar datos'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : (
        <>
          {/* Para ti: matching perfil ↔ licitaciones (el corazón del SaaS) */}
          <div className="space-y-3">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Target className="text-green-700" /> Para ti
            </h3>
            {profileMissing ? (
              <div className="bg-white border border-dashed border-[#141414] p-8 text-center">
                <Building2 className="mx-auto mb-3 opacity-40" size={28} />
                <p className="text-sm font-bold">Aún no conocemos tu empresa</p>
                <p className="text-xs opacity-60 mt-1 mb-4">
                  Completa tu perfil (CPV, palabras clave, presupuesto) y te enseñaremos
                  solo las licitaciones que encajan contigo.
                </p>
                {onGoToProfile && (
                  <button
                    onClick={onGoToProfile}
                    className="px-4 py-2 bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase tracking-wider hover:bg-[#333] transition-colors"
                  >
                    Completar mi perfil
                  </button>
                )}
              </div>
            ) : relevant.length === 0 ? (
              <div className="bg-white border border-[#141414] p-6 text-center">
                <p className="text-sm opacity-60">
                  Ninguna licitación reciente encaja con tu perfil. Prueba a ampliar tus CPV o palabras clave.
                </p>
              </div>
            ) : (
              relevant.map((t) => (
                <div key={t.id} className="bg-white border-2 border-[#141414] p-5 hover:bg-[#F5F5F3] transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm">{t.title}</h4>
                      <p className="text-xs font-mono opacity-50 mt-1">
                        {t.contracting_body && `${t.contracting_body} • `}
                        {t.contract_type && `${t.contract_type} • `}
                        {t.submission_deadline && `Límite: ${new Date(t.submission_deadline).toLocaleDateString('es-ES')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {typeof t.relevance === 'number' && (
                        <span className="px-2 py-1 bg-green-700 text-white text-xs font-mono font-bold" title="Relevancia para tu perfil">
                          ★ {t.relevance}
                        </span>
                      )}
                      {t.budget_amount != null && (
                        <span className="font-mono font-bold text-sm">{formatCurrency(t.budget_amount)}</span>
                      )}
                      {t.source_url && (
                        <a href={t.source_url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] rounded transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-[#141414] p-6">
                <p className="text-xs font-mono uppercase opacity-50 mb-1">Licitaciones abiertas</p>
                <p className="text-3xl font-bold">{stats.totalOpen}</p>
              </div>
              <div className="bg-white border border-[#141414] p-6">
                <p className="text-xs font-mono uppercase opacity-50 mb-1">Presupuesto medio</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.avgBudget)}</p>
              </div>
              <div className="bg-white border border-[#141414] p-6">
                <p className="text-xs font-mono uppercase opacity-50 mb-1">Última actualización</p>
                <p className="text-lg font-mono">
                  {stats.lastScraped ? new Date(stats.lastScraped).toLocaleString('es-ES') : 'Nunca'}
                </p>
              </div>
            </div>
          )}

          {/* Breakdown */}
          {stats && stats.byType.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-[#141414] p-8 space-y-4">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <TrendingUp className="text-blue-600" /> Por tipo de contrato
                </h3>
                {stats.byType.map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-[#141414]/10 pb-2">
                    <span className="text-sm">{item.type}</span>
                    <span className="font-mono font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-[#141414] p-8 space-y-4">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <Search className="text-orange-600" /> Por procedimiento
                </h3>
                {stats.byProcedure.map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-[#141414]/10 pb-2">
                    <span className="text-sm">{item.type}</span>
                    <span className="font-mono font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tenders list */}
          <div className="space-y-3">
            <h3 className="font-bold text-xl">Últimas licitaciones detectadas</h3>
            {tenders.length === 0 ? (
              <div className="bg-white border border-[#141414] p-8 text-center">
                <p className="text-sm opacity-60 font-mono uppercase">No hay datos de mercado disponibles</p>
                <p className="text-xs opacity-40 mt-2">Pulsa "Actualizar datos" para obtener licitaciones de PLACSP</p>
              </div>
            ) : (
              tenders.map((t) => (
                <div key={t.id} className="bg-white border border-[#141414] p-5 hover:bg-[#F5F5F3] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm truncate">{t.title}</h4>
                      <p className="text-xs font-mono opacity-50 mt-1">
                        {t.contracting_body && `${t.contracting_body} • `}
                        {t.contract_type && `${t.contract_type} • `}
                        {t.submission_deadline && new Date(t.submission_deadline).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {t.budget_amount && (
                        <span className="font-mono font-bold text-sm">{formatCurrency(t.budget_amount)}</span>
                      )}
                      {t.source_url && (
                        <a href={t.source_url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] rounded transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
