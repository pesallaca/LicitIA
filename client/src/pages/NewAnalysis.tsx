import { useState } from 'react';
import AnalysisForm from '../components/analysis/AnalysisForm';
import AnalysisResult from '../components/analysis/AnalysisResult';

export default function NewAnalysis() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<number | undefined>();

  const handleResult = (markdown: string, id?: number) => {
    setAnalysis(markdown);
    if (id) setAnalysisId(id);
  };

  const handleDownloadPdf = () => {
    if (!analysisId) return;
    window.open(`/api/pdf/${analysisId}`, '_blank');
  };

  const handleShare = async () => {
    if (!analysisId) return;
    try {
      const res = await fetch(`/api/share/${analysisId}`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      await navigator.clipboard.writeText(window.location.origin + '/api/share/' + data.token);
      alert('Enlace copiado al portapapeles');
    } catch {
      alert('Error al generar enlace');
    }
  };

  if (analysis) {
    return (
      <AnalysisResult
        markdown={analysis}
        analysisId={analysisId}
        onBack={() => { setAnalysis(null); setAnalysisId(undefined); }}
        onDownloadPdf={handleDownloadPdf}
        onShare={handleShare}
      />
    );
  }

  return <AnalysisForm onResult={handleResult} />;
}
