import { ChevronRight } from 'lucide-react';

export default function InfoBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-[#141414] text-[#E4E3E0] p-6 border border-[#141414]">
      <h3 className="font-serif italic text-xl mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs opacity-80 font-mono">
            <ChevronRight size={14} className="mt-0.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
