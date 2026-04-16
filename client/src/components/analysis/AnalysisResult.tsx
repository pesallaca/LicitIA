import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface Props {
  markdown: string;
  analysisId?: number;
  onBack: () => void;
  onDownloadPdf: () => void;
  onShare: () => void;
}

export default function AnalysisResult({ markdown, onBack, onDownloadPdf, onShare }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:underline">
          <ChevronRight className="rotate-180" size={14} /> Volver al editor
        </button>
        <div className="flex gap-2">
          <button onClick={onDownloadPdf} className="px-4 py-2 border border-[#141414] bg-white hover:bg-[#141414] hover:text-[#E4E3E0] transition-all text-xs font-bold uppercase tracking-wider">
            Descargar PDF
          </button>
          <button onClick={onShare} className="px-4 py-2 bg-[#141414] text-[#E4E3E0] hover:bg-[#333] transition-all text-xs font-bold uppercase tracking-wider">
            Compartir Informe
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#141414] p-10 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] prose prose-slate max-w-none">
        <div className="markdown-body">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
