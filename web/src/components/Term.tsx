import { useState, useRef, useEffect, type ReactNode } from 'react';
import { glossary } from '../data/glossary';
import { HugeiconsIcon } from '@hugeicons/react';
import { MapPinIcon } from '@hugeicons/core-free-icons';

interface TermProps {
  id: string;
  children?: ReactNode;
}

export default function Term({ id, children }: TermProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const info = glossary[id] || {
    abbr: id,
    fullName: id,
    category: 'Hardware',
    location: 'Componente de Arquitetura',
    description: 'Termo técnico fundamental de computação.',
  };

  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <span
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center border-b border-dashed border-lake-blue text-lake-blue font-medium hover:border-off-black hover:text-off-black transition-colors cursor-help px-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lake-blue"
      >
        <span>{children || id}</span>
      </button>

      {/* Floating Monad Tooltip Card (fechado nem renderiza; aberto cabe na
          viewport: lâmina fixa com margens no mobile, ancoragem no desktop) */}
      {isOpen && (
        <div
          role="tooltip"
          className="z-50 rounded-card border border-ash bg-white p-4 shadow-xl text-left font-sans max-sm:fixed max-sm:left-2 max-sm:right-2 max-sm:bottom-2 max-sm:top-auto max-sm:w-auto max-sm:translate-x-0 sm:absolute sm:bottom-full sm:left-1/2 sm:-translate-x-1/2 sm:mb-2 sm:w-80 w-72"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-ash/70 pb-2.5 mb-2.5">
            <div>
              <div className="font-serif text-sm font-normal text-off-black leading-tight">
                {info.fullName}
              </div>
            </div>
            <span className="rounded-full bg-[#2b59d1]/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-lake-blue border border-lake-blue/20 whitespace-nowrap">
              {info.category}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-[11px] text-graphite mb-2 font-mono">
            <HugeiconsIcon icon={MapPinIcon} className="h-3.5 w-3.5 text-lake-blue shrink-0" />
            <span className="truncate">{info.location}</span>
          </div>

          {/* Description */}
          <p className="text-xs text-graphite font-sans leading-relaxed">
            {info.description}
          </p>

          {/* Tooltip Arrow (só no desktop ancorado) */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-ash max-sm:hidden" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-4 border-transparent border-t-white max-sm:hidden" />
        </div>
      )}
    </span>
  );
}
