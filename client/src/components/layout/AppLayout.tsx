import { useState } from 'react';
import Sidebar, { type Tab } from './Sidebar';
import Header from './Header';
import NewAnalysis from '../../pages/NewAnalysis';
import HistoryPage from '../../pages/HistoryPage';
import MarketPage from '../../pages/MarketPage';
import ProfilePage from '../../pages/ProfilePage';
import AcademiaPage from '../../pages/AcademiaPage';

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('new');
  // Deep-link interno a un artículo concreto de la Academia (ayuda contextual)
  const [academiaTarget, setAcademiaTarget] = useState<string | null>(null);

  const irAAcademia = (articulo: string) => {
    setAcademiaTarget(articulo);
    setActiveTab('academy');
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header activeTab={activeTab} />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'new' && <NewAnalysis />}
            {activeTab === 'history' && <HistoryPage />}
            {activeTab === 'insights' && <MarketPage onGoToProfile={() => setActiveTab('profile')} />}
            {activeTab === 'profile' && <ProfilePage onAyudaCpv={() => irAAcademia('cpv')} />}
            {activeTab === 'academy' && (
              <AcademiaPage target={academiaTarget} onGoTo={(tab) => setActiveTab(tab)} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
