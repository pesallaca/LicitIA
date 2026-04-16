import { useState, useEffect } from 'react';
import { ChevronRight, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { apiGet, apiDelete } from '../lib/api';

interface Analysis {
  id: number;
  title: string | null;
  input_type: string;
  result_markdown: string | null;
  llm_provider: string;
  llm_model: string;
  duration_ms: number | null;
  created_at: string;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Analysis | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ analyses: Analysis[]; total: number }>('/api/analysis');
      setAnalyses(data.analyses);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este análisis?')) return;
    try {
      await apiDelete(`/api/analysis/${id}`);
      setAnalyses(prev => prev.filter(a => a.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (selected) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:underline">
            <ChevronRight className="rotate-180" size={14} /> Volver al historial
          </button>
          <div className="flex gap-2">
            <button onClick={() => window.open(`/api/pdf/${selected.id}`, '_blank')} className="px-4 py-2 border border-[#141414] bg-white hover:bg-[#141414] hover:text-[#E4E3E0] transition-all text-xs font-bold uppercase tracking-wider">
              Descargar PDF
            </button>
          </div>
        </div>
        <div className="bg-white border border-[#141414] p-10 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] prose prose-slate max-w-none">
          <div className="markdown-body">
            <ReactMarkdown>{selected.result_markdown || ''}</ReactMarkdown>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-3xl italic">Historial de Licitaciones Analizadas</h2>
        {total > 0 && <span className="text-xs font-mono opacity-50">{total} análisis</span>}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : analyses.length === 0 ? (
        <div className="bg-white border border-[#141414] p-8 text-center">
          <p className="text-sm opacity-60 font-mono uppercase">No hay análisis guardados todavía</p>
          <p className="text-xs opacity-40 mt-2">Los análisis se guardarán automáticamente aquí</p>
        </div>
      ) : (
        <AnimatePresence>
          {analyses.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(a)}
              className="bg-white border border-[#141414] p-6 flex items-center justify-between hover:bg-[#F5F5F3] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-xl shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg truncate">{a.title || 'Análisis sin título'}</h3>
                  <p className="text-xs font-mono opacity-50 uppercase tracking-wider">
                    {a.input_type} • {a.llm_model} • {new Date(a.created_at).toLocaleDateString('es-ES')}
                    {a.duration_ms && ` • ${Math.round(a.duration_ms / 1000)}s`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleDelete(a.id, e)}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded text-red-500 transition-all"
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
