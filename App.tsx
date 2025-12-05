import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ChevronRight, ExternalLink, ArrowRight, LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import Card from './components/Card';
import ContentRenderer from './components/ContentRenderer';
import database from './src/database.json';

// --- Types ---
interface Section {
  type: 'heading' | 'paragraph' | 'highlight' | 'list' | 'table';
  level?: number;
  content?: string;
  items?: string[];
  ordered?: boolean;
}

interface DatabaseItem {
  id: string;
  title: string;
  keywords: string;
  description: string;
  icon: string;
  color: {
    bg: string;
    text: string;
  };
  sections: Section[];
  externalLink: string;
  lastModified: string;
}

// --- Helper to get Icon Component ---
function getIconComponent(iconName: string): LucideIcon {
  // Converter kebab-case para PascalCase (ex: "dollar-sign" -> "DollarSign")
  const pascalCase = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  // @ts-ignore - Dynamic icon import
  return Icons[pascalCase] || Icons.FileText;
}

// --- Color mapping for gradients ---
const COLOR_GRADIENTS: Record<string, { from: string; to: string; hover: string }> = {
  blue: { from: '#3b82f6', to: '#2563eb', hover: '#1d4ed8' },
  green: { from: '#10b981', to: '#059669', hover: '#047857' },
  purple: { from: '#a855f7', to: '#9333ea', hover: '#7e22ce' },
  indigo: { from: '#6366f1', to: '#4f46e5', hover: '#4338ca' },
  amber: { from: '#f59e0b', to: '#d97706', hover: '#b45309' },
  rose: { from: '#f43f5e', to: '#e11d48', hover: '#be123c' },
  slate: { from: '#64748b', to: '#475569', hover: '#334155' },
  cyan: { from: '#06b6d4', to: '#0891b2', hover: '#0e7490' },
  violet: { from: '#8b5cf6', to: '#7c3aed', hover: '#6d28d9' },
  orange: { from: '#f97316', to: '#ea580c', hover: '#c2410c' },
  emerald: { from: '#10b981', to: '#059669', hover: '#047857' },
  red: { from: '#ef4444', to: '#dc2626', hover: '#b91c1c' },
  teal: { from: '#14b8a6', to: '#0d9488', hover: '#0f766e' },
  sky: { from: '#0ea5e9', to: '#0284c7', hover: '#0369a1' },
  fuchsia: { from: '#d946ef', to: '#c026d3', hover: '#a21caf' },
};

// --- Normalize text for search (remove accents and special chars) ---
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .toLowerCase();
}

// --- Main App Component ---
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<DatabaseItem | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter logic
  const suggestions = useMemo(() => {
    if (!query) return [];
    const normalizedQuery = normalizeText(query);
    return (database as DatabaseItem[]).filter(item => 
      normalizeText(item.title).includes(normalizedQuery) || 
      normalizeText(item.keywords).includes(normalizedQuery)
    );
  }, [query]);

  const handleSelect = (item: DatabaseItem) => {
    setSelectedItem(item);
    setQuery(item.title);
    setIsFocused(false);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedItem(null);
    setIsFocused(true);
  };

  // Determine layout state
  const hasSelection = !!selectedItem;

  // Splash Screen
  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#002258] relative overflow-hidden flex items-center justify-center">
        {/* Grid Background */}
        <div 
          className="absolute inset-0 animate-grid-shine"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.25) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Logo INPI no topo */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
          <img src="/logos/inpi-branco.png" alt="INPI" className="h-12 sm:h-16 md:h-20 opacity-90" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center animate-fadeIn px-[75px]">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border border-white/20">
              <i className="fas fa-bell-concierge text-6xl text-white"></i>
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
            Concierge RH Digital
          </h1>
          
          <p className="text-white/70 text-lg md:text-xl mb-12 font-light">
            Os serviços de gestão de pessoas na palma da sua mão
          </p>
          
          {/* Access Button */}
          <button
            onClick={() => setShowSplash(false)}
            className="group relative px-12 py-4 animate-button-shimmer text-[#002258] rounded-full font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden"
          >
            <span className="relative z-10">ACESSAR</span>
          </button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col overflow-hidden">
      
      {/* Fixed Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-4 md:px-6 py-3 flex items-center justify-center">
          <img src="/logos/inpi.png" alt="INPI" className="h-8 mt-2" />
        </div>
      </header>

      {/* Main Content Area with Hero Section */}
      <div 
        className={`flex-1 flex flex-col items-center px-12 sm:px-6 w-full transition-all duration-700 ease-in-out overflow-y-auto max-h-screen
          ${hasSelection ? 'pt-16 sm:pt-24 pb-4 sm:pb-12 justify-start' : 'pt-16 sm:pt-32 pb-4 sm:pb-20 justify-center'}`}
      >
        {!hasSelection && (
          <div className="max-w-4xl w-full text-center mb-3 sm:mb-6 md:mb-10 animate-fadeIn">
            {/* Icon and Title */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3">
              <div className="relative mb-2 sm:mb-0">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 blur-xl opacity-30"></div>
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-3 sm:p-4 rounded-2xl text-white shadow-2xl">
                  <i className="fas fa-bell-concierge text-2xl sm:text-3xl"></i>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold animate-title-shine tracking-tight leading-tight pb-2">
                Concierge RH Digital
              </h1>
            </div>
            
            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-slate-600 font-light leading-relaxed max-w-3xl mx-auto mb-3 sm:mb-6 md:mb-10 px-4">
              Os serviços de gestão de pessoas na palma da sua mão
            </p>
          </div>
        )}

        {hasSelection && (
          <div className="max-w-4xl w-full text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-1.5 sm:p-2 rounded-xl text-white shadow-lg">
                <i className="fas fa-bell-concierge text-base sm:text-lg"></i>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Concierge RH Digital
              </h1>
            </div>
          </div>
        )}

        {/* Search Container */}
        <div className="w-full max-w-3xl relative z-20 mb-2 sm:mb-4 md:mb-6 px-2 sm:px-0" ref={searchContainerRef}>
          <div
            className={`
              relative flex items-center w-full transition-all duration-300 animate-shimmer
              ${isFocused ? 'shadow-2xl ring-2 ring-blue-500/20' : 'shadow-xl hover:shadow-2xl'}
              bg-white rounded-2xl border-2 ${isFocused ? 'border-blue-500' : 'border-slate-200'}
            `}
          >
            <div className="pl-4 sm:pl-6 text-slate-400">
              <Search size={20} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedItem(null);
                setIsFocused(true);
              }}
              onFocus={() => setIsFocused(true)}
              placeholder="Pesquisar em Recursos Humanos..."
              className="w-full py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-5 bg-transparent outline-none text-base sm:text-lg text-slate-700 placeholder:text-slate-400 rounded-2xl font-medium"
              autoComplete="off"
            />
            {query && (
              <button 
                onClick={handleClear}
                className="pr-3 sm:pr-5 text-slate-300 hover:text-slate-500 transition-colors p-2"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          <div 
            className={`
              absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 origin-top mx-2 sm:mx-0
              ${(isFocused && query && suggestions.length > 0) ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'}
            `}
          >
            <div className="max-h-[200px] sm:max-h-[280px] overflow-y-scroll">
              {suggestions.map((item) => {
                const IconComponent = getIconComponent(item.icon);
                const gradient = COLOR_GRADIENTS[item.color.bg] || COLOR_GRADIENTS.blue;
                return (
                  <div
                    key={item.id}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"
                  >
                    <button
                      onClick={() => handleSelect(item)}
                      className="w-full text-left flex items-start gap-3 sm:gap-4"
                    >
                      <div 
                        className="p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
                        style={{
                          backgroundColor: `${gradient.from}15`,
                          color: gradient.to
                        }}
                      >
                        <IconComponent size={18} className="sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm sm:text-base text-slate-700 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </span>
                        {/* Tags/Keywords */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.keywords.split(' ').slice(0, 5).map((keyword, idx) => (
                            <span 
                              key={idx}
                              className="inline-block px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium"
                              style={{
                                backgroundColor: `${gradient.from}10`,
                                color: gradient.to
                              }}
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* No results state in dropdown */}
          {(isFocused && query && suggestions.length === 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-6 text-center">
              <div className="text-slate-300 mb-2">
                <Search size={32} className="mx-auto" />
              </div>
              <p className="text-slate-600 font-medium">Nenhum resultado encontrado</p>
              <p className="text-sm text-slate-400 mt-1">Tente usar outras palavras-chave</p>
            </div>
          )}
        </div>
      </div>

      {/* Content Display Area */}
      <div className={`flex-1 flex justify-center w-full bg-white relative transition-opacity duration-700 delay-100 ${hasSelection ? 'opacity-100' : 'opacity-0 hidden'}`}>
        {/* Decorative gradient top border for content area */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        
        {selectedItem && (
          <main className="w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12 animate-fadeIn">
            {/* Header Card with Icon */}
            <Card className="mb-6 sm:mb-8">
              <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div 
                  className="p-2 sm:p-3 rounded-xl text-white shadow-lg flex-shrink-0"
                  style={{
                    background: `linear-gradient(to bottom right, ${COLOR_GRADIENTS[selectedItem.color.bg]?.from || '#3b82f6'}, ${COLOR_GRADIENTS[selectedItem.color.bg]?.to || '#2563eb'})`
                  }}
                >
                  {React.createElement(getIconComponent(selectedItem.icon), { size: 24, className: 'sm:w-8 sm:h-8' })}
                </div>
                <div className="flex-1 min-w-0">
                  <span 
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide uppercase mb-2 sm:mb-3"
                    style={{
                      backgroundColor: `${COLOR_GRADIENTS[selectedItem.color.bg]?.from || '#3b82f6'}15`,
                      color: COLOR_GRADIENTS[selectedItem.color.bg]?.to || '#2563eb'
                    }}
                  >
                    RH / {selectedItem.title}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                    {selectedItem.title}
                  </h2>
                  
                  {/* Botão Acessar na Intranet */}
                  {selectedItem.externalLink && selectedItem.externalLink !== '#' && (
                    <a 
                      href={selectedItem.externalLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 mt-3 sm:mt-4 rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105"
                      style={{
                        background: `linear-gradient(to right, ${COLOR_GRADIENTS[selectedItem.color.bg]?.to || '#2563eb'}, ${COLOR_GRADIENTS[selectedItem.color.bg]?.hover || '#1d4ed8'})`,
                        color: '#ffffff'
                      }}
                    >
                      <ExternalLink size={14} className="sm:w-4 sm:h-4" />
                      ACESSAR NA INTRANET
                    </a>
                  )}
                  
                  <p className="text-sm sm:text-base text-slate-600 mt-3 sm:mt-4 font-light">
                    {selectedItem.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center gap-2 text-[10px] sm:text-xs text-slate-400">
                <span>Última atualização:</span>
                <span className="font-medium text-slate-500">
                  {new Date(selectedItem.lastModified).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </Card>

            {/* Content Card */}
            <Card className="prose prose-slate prose-lg max-w-none">
              <ContentRenderer sections={selectedItem.sections} color={selectedItem.color} />
            </Card>

            {/* External Link */}
            {selectedItem.externalLink && selectedItem.externalLink !== '#' && (
              <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-100 flex justify-end">
                <a 
                  href={selectedItem.externalLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-white"
                  style={{
                    background: `linear-gradient(to right, ${COLOR_GRADIENTS[selectedItem.color.bg]?.to || '#2563eb'}, ${COLOR_GRADIENTS[selectedItem.color.bg]?.hover || '#1d4ed8'})`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `linear-gradient(to right, ${COLOR_GRADIENTS[selectedItem.color.bg]?.hover || '#1d4ed8'}, ${COLOR_GRADIENTS[selectedItem.color.bg]?.hover || '#1d4ed8'})`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `linear-gradient(to right, ${COLOR_GRADIENTS[selectedItem.color.bg]?.to || '#2563eb'}, ${COLOR_GRADIENTS[selectedItem.color.bg]?.hover || '#1d4ed8'})`;
                  }}
                >
                  <span className="hidden sm:inline">Acessar Documentação Original</span>
                  <span className="sm:hidden">Ver Documentação</span>
                  <ExternalLink size={14} className="sm:w-4 sm:h-4 group-hover:hidden" />
                  <ArrowRight size={14} className="sm:w-4 sm:h-4 hidden group-hover:block animate-pulse" />
                </a>
              </div>
            )}
          </main>
        )}
      </div>

      {/* Footer with Sliding Logos */}
      <footer className="relative bg-white border-t border-slate-200 py-3 sm:py-8 md:py-10 px-4 overflow-hidden">
        {/* Animated Logos Slider */}
        <div className="mb-2 sm:mb-6 md:mb-8 relative overflow-hidden">
          <div className="flex items-center gap-8 sm:gap-12 md:gap-16 animate-slideLogos whitespace-nowrap">
            {/* First set */}
            <img src="/logos/dirad.png" alt="DIRAD" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/cgrh.png" alt="CGRH" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/coarh.png" alt="COARH" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/acad.png" alt="ACAD" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/cetec.png" alt="CETEC" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            {/* Second set - seamless duplicate */}
            <img src="/logos/dirad.png" alt="DIRAD" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/cgrh.png" alt="CGRH" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/coarh.png" alt="COARH" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/acad.png" alt="ACAD" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/cetec.png" alt="CETEC" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            {/* Third set - extra buffer */}
            <img src="/logos/dirad.png" alt="DIRAD" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/cgrh.png" alt="CGRH" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/coarh.png" alt="COARH" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/acad.png" alt="ACAD" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/cetec.png" alt="CETEC" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-2 sm:mb-4 md:mb-6"></div>
        
        {/* Copyright and Info */}
        <div className="text-center px-4">
          <p className="text-slate-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
            &copy; 2025 Academia de Propriedade Intelectual, Inovação e Desenvolvimento
          </p>
          <p className="text-slate-400 text-[10px] sm:text-xs">
            {(database as DatabaseItem[]).length} documentos disponíveis
          </p>
        </div>
      </footer>
    </div>
  );
}
