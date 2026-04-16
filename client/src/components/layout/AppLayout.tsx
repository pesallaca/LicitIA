import { useState } from 'react';
import Sidebar, { type Tab } from './Sidebar';
import Header from './Header';
import NewAnalysis from '../../pages/NewAnalysis';
import HistoryPage from '../../pages/HistoryPage';
import MarketPage from '../../pages/MarketPage';

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('new');

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header activeTab={activeTab} />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'new' && <NewAnalysis />}
            {activeTab === 'history' && <HistoryPage />}
            {activeTab === 'insights' && <MarketPage />}
          </div>
        </div>
      </main>
    </div>
  );
}
