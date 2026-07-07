import { useEffect, useMemo, useState } from 'react';
import { GraduationCap, ExternalLink, ChevronRight, Lightbulb, ArrowRight } from 'lucide-react';
import { secciones, totalArticulos, type Articulo } from '../data/guia';
import { cn } from '../lib/cn';

/**
 * Academia: la guía para empezar de cero en contratación pública.
 * Menú (secciones) + submenú (artículos) a la izquierda, contenido a la derecha.
 * Contenido propio en lenguaje llano + enlaces a fuentes oficiales verificadas.
 */
export default function AcademiaPage({
  target,
  onGoTo,
}: {
  target?: string | null;
  onGoTo?: (tab: 'profile' | 'new' | 'insights') => void;
}) {
  const primero = secciones[0].articulos[0].id;
  const [activo, setActivo] = useState<string>(target || primero);

  useEffect(() => {
    if (target) setActivo(target);
  }, [target]);

  const articulo: Articulo = useMemo(() => {
    for (const s of secciones) {
      const a = s.articulos.find((a) => a.id === activo);
      if (a) return a;
    }
    return secciones[0].articulos[0];
  }, [activo]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl italic flex items-center gap-3">
          <GraduationCap /> Academia del licitador
        </h2>
        <p className="text-sm opacity-60 mt-2">
          Contratación pública explicada para humanos, en {totalArticulos} lecciones cortas.
          Con enlaces a las guías oficiales de PLACSP para profundizar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Menú y submenús */}
        <nav className="bg-white border border-[#141414] p-4 space-y-4 lg:sticky lg:top-4">
          {secciones.map((s) => (
            <div key={s.id}>
              <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{s.titulo}</p>
              <ul>
                {s.articulos.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => setActivo(a.id)}
                      className={cn(
                        'w-full text-left text-sm py-1.5 px-2 flex items-center gap-1 transition-colors',
                        a.id === activo
                          ? 'bg-[#141414] text-[#E4E3E0] font-bold'
                          : 'hover:bg-[#F5F5F3]'
                      )}
                    >
                      <ChevronRight size={12} className="shrink-0" />
                      <span className="min-w-0">{a.titulo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Contenido del artículo */}
        <article className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <h3 className="font-serif text-2xl italic">{articulo.titulo}</h3>
          <p className="text-sm opacity-60 mt-1 mb-6">{articulo.resumen}</p>

          <div className="space-y-4 text-sm leading-relaxed">
            {articulo.cuerpo.map((linea, i) => {
              if (linea.startsWith('## ')) {
                return <h4 key={i} className="font-bold text-base pt-2">{linea.slice(3)}</h4>;
              }
              if (linea.startsWith('- ')) {
                return (
                  <p key={i} className="flex gap-2 pl-1">
                    <span className="font-bold shrink-0">·</span>
                    <span>{linea.slice(2)}</span>
                  </p>
                );
              }
              if (linea.startsWith('! ')) {
                return (
                  <div key={i} className="border-l-4 border-[#141414] bg-[#F5F5F3] p-3 flex gap-2">
                    <Lightbulb size={16} className="shrink-0 mt-0.5" />
                    <span>{linea.slice(2)}</span>
                  </div>
                );
              }
              return <p key={i}>{linea}</p>;
            })}
          </div>

          {articulo.enlaces && articulo.enlaces.length > 0 && (
            <div className="mt-8 border-t border-[#141414]/20 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Fuentes oficiales</p>
              <ul className="space-y-1">
                {articulo.enlaces.map((e) => (
                  <li key={e.url}>
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm underline hover:no-underline"
                    >
                      <ExternalLink size={13} className="shrink-0" /> {e.etiqueta}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {articulo.cta && onGoTo && (
            <button
              onClick={() => onGoTo(articulo.cta!.tab)}
              className="mt-8 flex items-center gap-2 px-5 py-3 bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase tracking-wider hover:bg-[#333] transition-colors"
            >
              {articulo.cta.texto} <ArrowRight size={14} />
            </button>
          )}
        </article>
      </div>
    </div>
  );
}
