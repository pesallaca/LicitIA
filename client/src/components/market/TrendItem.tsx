import { cn } from '../../lib/cn';

export default function TrendItem({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[#141414]/10 pb-2">
      <span className="text-sm font-medium">{label}</span>
      <span className={cn("font-mono font-bold", positive ? "text-emerald-600" : "text-red-600")}>{value}</span>
    </div>
  );
}
