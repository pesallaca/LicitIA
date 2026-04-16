import { useState } from 'react';
import { Briefcase, LayoutDashboard, History, TrendingUp, Menu, X, LogOut } from 'lucide-react';
import NavItem from '../ui/NavItem';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/cn';

export type Tab = 'new' | 'history' | 'insights';

export default function Sidebar({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
  const [open, setOpen] = useState(true);
  const { logout } = useAuth();

  return (
    <aside className={cn(
      "bg-[#141414] text-[#E4E3E0] transition-all duration-300 flex flex-col border-r border-[#141414]",
      open ? "w-64" : "w-20"
    )}>
      <div className="p-6 flex items-center gap-3 border-b border-[#E4E3E0]/10">
        <div className="w-8 h-8 bg-[#E4E3E0] rounded flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-[#141414]" />
        </div>
        {open && <span className="font-bold text-xl tracking-tight">LicitAI</span>}
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        <NavItem icon={<LayoutDashboard size={20} />} label="Nuevo Análisis" active={activeTab === 'new'} collapsed={!open} onClick={() => onTabChange('new')} />
        <NavItem icon={<History size={20} />} label="Historial" active={activeTab === 'history'} collapsed={!open} onClick={() => onTabChange('history')} />
        <NavItem icon={<TrendingUp size={20} />} label="Mercado" active={activeTab === 'insights'} collapsed={!open} onClick={() => onTabChange('insights')} />
      </nav>

      <div className="p-4 border-t border-[#E4E3E0]/10 space-y-2">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 p-2 hover:bg-red-500/20 rounded transition-colors text-sm"
        >
          <LogOut size={18} />
          {open && <span className="text-xs uppercase tracking-wider">Salir</span>}
        </button>
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-center p-2 hover:bg-[#E4E3E0]/10 rounded transition-colors">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </aside>
  );
}
