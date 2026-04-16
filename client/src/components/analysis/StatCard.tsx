export default function StatCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white border border-[#141414] p-6 hover:translate-y-[-4px] transition-all cursor-default">
      <div className="mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-xs opacity-60 font-mono uppercase">{desc}</p>
    </div>
  );
}
