import PDFDocument from 'pdfkit';
import type { Readable } from 'stream';

interface AnalysisData {
  id: number;
  title: string | null;
  result_markdown: string;
  created_at: string;
}

export function generateAnalysisPdf(analysis: AnalysisData): PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: analysis.title || 'Análisis LicitIA',
      Author: 'LicitIA - Consultoría Estratégica',
      CreationDate: new Date(),
    },
  });

  // Header
  doc.fontSize(28).font('Helvetica-Bold').text('LicitIA', { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#666666')
    .text('Análisis Estratégico de Contratación Pública', { align: 'center' });
  doc.moveDown(0.5);

  // Line separator
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#141414').lineWidth(2).stroke();
  doc.moveDown(1);

  // Title
  if (analysis.title) {
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#141414').text(analysis.title);
    doc.moveDown(0.5);
  }

  // Date
  doc.fontSize(8).font('Helvetica').fillColor('#888888')
    .text(`Generado: ${new Date(analysis.created_at).toLocaleString('es-ES')} | ID: ${analysis.id}`);
  doc.moveDown(1);

  // Render markdown content
  renderMarkdown(doc, analysis.result_markdown);

  // Footer on each page
  const pageCount = doc.bufferedPageRange();
  doc.fontSize(7).font('Helvetica').fillColor('#999999');

  doc.end();
  return doc;
}

function renderMarkdown(doc: PDFDocument, markdown: string): void {
  const lines = markdown.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      doc.moveDown(0.3);
      continue;
    }

    // H1
    if (trimmed.startsWith('# ')) {
      doc.moveDown(0.5);
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#141414').text(trimmed.slice(2));
      doc.moveDown(0.3);
      // Underline
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.moveDown(0.3);
      continue;
    }

    // H2
    if (trimmed.startsWith('## ')) {
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#141414').text(trimmed.slice(3));
      doc.moveDown(0.3);
      continue;
    }

    // H3
    if (trimmed.startsWith('### ')) {
      doc.moveDown(0.3);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333').text(trimmed.slice(4));
      doc.moveDown(0.2);
      continue;
    }

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = cleanMarkdown(trimmed.slice(2));
      doc.fontSize(10).font('Helvetica').fillColor('#333333')
        .text(`  •  ${content}`, { indent: 10, lineGap: 2 });
      continue;
    }

    // Numbered items
    const numberedMatch = trimmed.match(/^(\d+[\.\)]\s?|[0-9️⃣🔟]+\s)/);
    if (numberedMatch) {
      const content = cleanMarkdown(trimmed.slice(numberedMatch[0].length));
      doc.fontSize(10).font('Helvetica').fillColor('#333333')
        .text(`${numberedMatch[0]}${content}`, { indent: 5, lineGap: 2 });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const content = cleanMarkdown(trimmed.slice(1).trim());
      doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666666')
        .text(`"${content}"`, { indent: 20, lineGap: 2 });
      continue;
    }

    // Regular paragraph
    const content = cleanMarkdown(trimmed);
    doc.fontSize(10).font('Helvetica').fillColor('#333333')
      .text(content, { lineGap: 2 });
  }
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}
