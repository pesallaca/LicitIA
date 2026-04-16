import type { Tab } from './Sidebar';

const TITLES: Record<Tab, string> = {
  new: 'Análisis Estratégico de Licitaciones',
  history: 'Historial de Consultas',
  insights: 'Inteligencia de Mercado',
};

export default function Header({ activeTab }: { activeTab: Tab }) {
  return (
    <header className="h-16 bg-white border-b border-[#141414] flex items-center justify-between px-8">
      <h1 className="font-serif italic text-lg opacity-50 uppercase tracking-widest">
        {TITLES[activeTab]}
      </h1>
      <div className="flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          SISTEMA ACTIVO
        </div>
        <div className="opacity-50">V1.0.4-BETA</div>
      </div>
    </header>
  );
}
