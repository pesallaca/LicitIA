import { cn } from '../../lib/cn';

export default function NavItem({ icon, label, active, collapsed, onClick }: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-3 transition-all rounded",
        active ? "bg-[#E4E3E0] text-[#141414]" : "text-[#E4E3E0]/60 hover:text-[#E4E3E0] hover:bg-[#E4E3E0]/5"
      )}
    >
      <div className="shrink-0">{icon}</div>
      {!collapsed && <span className="font-bold text-sm uppercase tracking-wider">{label}</span>}
    </button>
  );
}
