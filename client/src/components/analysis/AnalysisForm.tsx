import { useState, useRef } from 'react';
import {
  FileText, ShieldAlert, BarChart3, ChevronRight,
  Upload, Loader2, ExternalLink, File, Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';
import { apiStream } from '../../lib/api';
import StatCard from './StatCard';
import InfoBox from './InfoBox';

interface Props {
  onResult: (markdown: string, analysisId?: number) => void;
}

export default function AnalysisForm({ onResult }: Props) {
  const [tenderText, setTenderText] = useState('');
  const [tenderUrl, setTenderUrl] = useState('');
  const [useUrl, setUseUrl] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedFile({ name: file.name, data: base64.split(',')[1], mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    const hasInput = (useUrl && tenderUrl.trim()) || (!useUrl && tenderText.trim()) || selectedFile;
    if (!hasInput) return;

    // Validar que hay contenido real para analizar
    const textContent = tenderText.trim();
    const urlContent = tenderUrl.trim();

    if (!useUrl && !textContent && !selectedFile) {
      onResult("Error: Debes pegar el texto del pliego en el editor antes de ejecutar el análisis.");
      return;
    }
    if (useUrl && !urlContent && !textContent && !selectedFile) {
      onResult("Error: Debes proporcionar una URL o pegar el texto del pliego.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const body: Record<string, unknown> = {
        inputType: selectedFile ? 'file' : useUrl ? 'url' : 'text',
      };

      // Siempre enviar el texto si hay contenido, independientemente del modo
      if (textContent) {
        body.text = textContent;
      }
      if (useUrl && urlContent) {
        body.url = urlContent;
      }
      if (selectedFile) {
        body.file = { data: selectedFile.data, mimeType: selectedFile.mimeType, name: selectedFile.name };
      }

      console.log('[AnalysisForm] Enviando al backend:', {
        inputType: body.inputType,
        textLength: typeof body.text === 'string' ? body.text.length : 0,
        url: body.url || null,
        file: body.file ? 'sí' : 'no',
      });

      const { text, analysisId } = await apiStream('/api/analysis', body, (partial) => {
        onResult(partial);
      });
      onResult(text, analysisId);
    } catch (error: any) {
      onResult("Error al analizar el pliego: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.txt" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<FileText className="text-blue-600" />} title="Análisis de Pliegos" desc="PCAP, PPT y Anexos" />
        <StatCard icon={<ShieldAlert className="text-orange-600" />} title="Riesgos Jurídicos" desc="Detección de cláusulas abusivas" />
        <StatCard icon={<BarChart3 className="text-emerald-600" />} title="Viabilidad Económica" desc="Cálculo de márgenes y bajas" />
      </div>

      <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
        <h2 className="font-serif text-2xl mb-6 italic">Iniciar Nuevo Análisis Estratégico</h2>
        <p className="text-sm opacity-70 mb-6 font-sans leading-relaxed">
          Pegue el contenido de los pliegos de contratación (PCAP/PPT), proporcione un enlace directo o suba el archivo oficial.
        </p>

        <div className="space-y-4">
          <div className="flex border-b border-[#141414]">
            <button onClick={() => setUseUrl(false)} className={cn("px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all", !useUrl ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#F5F5F3]")}>
              Texto del Pliego
            </button>
            <button onClick={() => setUseUrl(true)} className={cn("px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2", useUrl ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#F5F5F3]")}>
              <ExternalLink size={14} /> Link de Internet
            </button>
          </div>

          {useUrl ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 p-4 bg-[#F5F5F3] border border-[#141414]">
                <ExternalLink size={18} className="opacity-50" />
                <input type="url" value={tenderUrl} onChange={(e) => setTenderUrl(e.target.value)} placeholder="https://contrataciondelestado.es/wps/portal/..." className="flex-1 bg-transparent focus:outline-none font-mono text-sm" />
              </div>
              <p className="text-[10px] font-mono opacity-50 uppercase">* El sistema accederá al contenido del enlace para realizar el análisis estratégico.</p>
            </div>
          ) : (
            <textarea value={tenderText} onChange={(e) => setTenderText(e.target.value)} placeholder="Pegue aquí el texto del pliego..." className="w-full h-64 p-4 bg-[#F5F5F3] border border-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414] font-mono text-sm resize-none" />
          )}

          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded">
              <div className="flex items-center gap-3">
                <File className="text-emerald-600" size={20} />
                <div>
                  <p className="text-sm font-bold text-emerald-900">{selectedFile.name}</p>
                  <p className="text-[10px] font-mono text-emerald-600 uppercase">Archivo cargado para análisis</p>
                </div>
              </div>
              <button onClick={() => setSelectedFile(null)} className="p-2 hover:bg-emerald-100 rounded text-emerald-600 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all text-xs font-bold uppercase tracking-wider">
                <Upload size={14} /> Subir PDF
              </button>
              <button onClick={() => { setTenderText(''); setTenderUrl(''); setSelectedFile(null); }} className="px-4 py-2 border border-[#141414] hover:bg-red-50 transition-all text-xs font-bold uppercase tracking-wider">
                Limpiar
              </button>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!useUrl && !tenderText.trim() && !selectedFile) || (useUrl && !tenderUrl.trim() && !selectedFile)}
              className={cn(
                "flex items-center gap-2 px-8 py-3 bg-[#141414] text-[#E4E3E0] font-bold uppercase tracking-widest text-sm transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed",
                isAnalyzing && "animate-pulse"
              )}
            >
              {isAnalyzing ? (<><Loader2 className="animate-spin" size={18} /> Procesando...</>) : (<>Ejecutar Análisis Maestro <ChevronRight size={18} /></>)}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoBox title="Fuentes de Información" items={[
          "Tribunal Administrativo Central de Recursos Contractuales (TACRC)",
          "Observatorio de la Contratación Pública",
          "Oficina Independiente de Regulación de la Contratación (OIReCon)",
          "Ley 9/2017 de Contratos del Sector Público (LCSP)"
        ]} />
        <InfoBox title="Metodología de Venta" items={[
          "Detección de necesidades reales del mercado",
          "Optimización de la propuesta de valor",
          "Análisis de competencia y barreras de entrada",
          "Estrategia de puntuación en criterios subjetivos"
        ]} />
      </div>
    </motion.div>
  );
}
