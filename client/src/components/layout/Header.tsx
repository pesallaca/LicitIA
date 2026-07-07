import { useEffect, useState } from 'react';
import type { Tab } from './Sidebar';
import { apiGet } from '../../lib/api';

const TITLES: Record<Tab, string> = {
  new: 'Análisis Estratégico de Licitaciones',
  history: 'Historial de Consultas',
  insights: 'Inteligencia de Mercado',
  profile: 'Perfil de Empresa',
  academy: 'Academia del Licitador',
};

export default function Header({ activeTab }: { activeTab: Tab }) {
  // Estado REAL del backend (no un badge decorativo)
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const [version, setVersion] = useState('');

  useEffect(() => {
    apiGet<{ status: string; version: string; maintenance?: boolean }>('/api/health')
      .then((h) => {
        setMaintenance(!!h.maintenance);
        setVersion(h.version);
      })
      .catch(() => setMaintenance(null));
  }, []);

  return (
    <header className="h-16 bg-white border-b border-[#141414] flex items-center justify-between px-8">
      <h1 className="font-serif italic text-lg opacity-50 uppercase tracking-widest">
        {TITLES[activeTab]}
      </h1>
      <div className="flex items-center gap-6 text-xs font-mono">
        {maintenance === null ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            SIN CONEXIÓN
          </div>
        ) : maintenance ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            MANTENIMIENTO
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            SISTEMA ACTIVO
          </div>
        )}
        <div className="opacity-50">{version ? `V${version}` : ''}</div>
      </div>
    </header>
  );
}
