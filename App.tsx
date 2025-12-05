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

// --- Main App Component ---
export default function App() {
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
    const lowerQuery = query.toLowerCase();
    return (database as DatabaseItem[]).filter(item => 
      item.title.toLowerCase().includes(lowerQuery) || 
      item.keywords.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      
      {/* Fixed Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logos/inpi.png" alt="INPI" className="h-10" />
          </div>
        </div>
      </header>

      {/* Main Content Area with Hero Section */}
      <div 
        className={`flex-1 flex flex-col items-center justify-center px-4 w-full transition-all duration-700 ease-in-out
          ${hasSelection ? 'pt-24 pb-12' : 'pt-32 pb-20'}`}
      >
        {!hasSelection && (
          <div className="max-w-4xl w-full text-center mb-12 animate-fadeIn">
            {/* Icon and Title */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 blur-xl opacity-30"></div>
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl text-white shadow-2xl">
                  <i className="fas fa-bell-concierge text-3xl"></i>
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 tracking-tight">
                Concierge Digital
              </h1>
            </div>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-600 font-light leading-relaxed max-w-3xl mx-auto mb-12">
              Os serviços de gestão de pessoas na palma da sua mão
            </p>
          </div>
        )}

        {hasSelection && (
          <div className="max-w-4xl w-full text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl text-white shadow-lg">
                <i className="fas fa-bell-concierge text-lg"></i>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Concierge Digital
              </h1>
            </div>
          </div>
        )}

        {/* Search Container */}
        <div className="w-full max-w-3xl relative z-20 mb-8" ref={searchContainerRef}>
          <div 
            className={`
              relative flex items-center w-full transition-all duration-300
              ${isFocused ? 'shadow-2xl ring-2 ring-blue-500/20' : 'shadow-xl hover:shadow-2xl'}
              bg-white rounded-2xl border-2 ${isFocused ? 'border-blue-500' : 'border-slate-200'}
            `}
          >
            <div className="pl-6 text-slate-400">
              <Search size={22} />
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
              className="w-full py-5 px-5 bg-transparent outline-none text-lg text-slate-700 placeholder:text-slate-400 rounded-2xl font-medium"
              autoComplete="off"
            />
            {query && (
              <button 
                onClick={handleClear}
                className="pr-5 text-slate-300 hover:text-slate-500 transition-colors p-2"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          <div 
            className={`
              absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 origin-top
              ${(isFocused && query && suggestions.length > 0) ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'}
            `}
          >
            <div className="max-h-[400px] overflow-y-auto">
              {suggestions.map((item) => {
                const IconComponent = getIconComponent(item.icon);
                const gradient = COLOR_GRADIENTS[item.color.bg] || COLOR_GRADIENTS.blue;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group flex items-start gap-4"
                  >
                    <div 
                      className="p-2 rounded-lg transition-colors flex-shrink-0"
                      style={{
                        backgroundColor: `${gradient.from}15`,
                        color: gradient.to
                      }}
                    >
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 flex-shrink-0 mt-2" />
                  </button>
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
          <main className="w-full max-w-4xl px-6 py-12 animate-fadeIn">
            {/* Header Card with Icon */}
            <Card className="mb-8">
              <div className="flex items-start gap-4 mb-6">
                <div 
                  className="p-3 rounded-xl text-white shadow-lg"
                  style={{
                    background: `linear-gradient(to bottom right, ${COLOR_GRADIENTS[selectedItem.color.bg]?.from || '#3b82f6'}, ${COLOR_GRADIENTS[selectedItem.color.bg]?.to || '#2563eb'})`
                  }}
                >
                  {React.createElement(getIconComponent(selectedItem.icon), { size: 32 })}
                </div>
                <div className="flex-1">
                  <span 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3"
                    style={{
                      backgroundColor: `${COLOR_GRADIENTS[selectedItem.color.bg]?.from || '#3b82f6'}15`,
                      color: COLOR_GRADIENTS[selectedItem.color.bg]?.to || '#2563eb'
                    }}
                  >
                    RH / {selectedItem.title}
                  </span>
                  <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                    {selectedItem.title}
                  </h2>
                </div>
              </div>
              <p className="text-lg text-slate-500 font-light leading-relaxed border-l-2 border-slate-200 pl-4">
                {selectedItem.description}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
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
              <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
                <a 
                  href={selectedItem.externalLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-white"
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
                  Acessar Documentação Original
                  <ExternalLink size={16} className="group-hover:hidden" />
                  <ArrowRight size={16} className="hidden group-hover:block animate-pulse" />
                </a>
              </div>
            )}
          </main>
        )}
      </div>

      {/* Footer with Sliding Logos */}
      <footer className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-8 px-4 overflow-hidden">
        {/* Animated Logos Slider */}
        <div className="mb-6 relative">
          <div className="flex items-center gap-12 animate-slideLogos whitespace-nowrap">
            <img src="/logos/dirad.png" alt="DIRAD" className="h-10 opacity-70 hover:opacity-100 transition-opacity inline-block" />
            <img src="/logos/cgrh.png" alt="CGRH" className="h-10 opacity-70 hover:opacity-100 transition-opacity inline-block" />
            <img src="/logos/acad.png" alt="ACAD" className="h-10 opacity-70 hover:opacity-100 transition-opacity inline-block" />
            <img src="/logos/cetec.png" alt="CETEC" className="h-10 opacity-70 hover:opacity-100 transition-opacity inline-block" />
            {/* Duplicate for seamless loop */}
            <img src="/logos/dirad.png" alt="DIRAD" className="h-10 opacity-70 hover:opacity-100 transition-opacity inline-block" />
            <img src="/logos/cgrh.png" alt="CGRH" className="h-10 opacity-70 hover:opacity-100 transition-opacity inline-block" />
            <img src="/logos/acad.png" alt="ACAD" className="h-10 opacity-70 hover:opacity-100 transition-opacity inline-block" />
            <img src="/logos/cetec.png" alt="CETEC" className="h-10 opacity-70 hover:opacity-100 transition-opacity inline-block" />
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-6"></div>
        
        {/* Copyright and Info */}
        <div className="text-center">
          <p className="text-slate-300 text-sm font-medium mb-2">
            &copy; 2025 Academia de Propriedade Intelectual, Inovação e Desenvolvimento
          </p>
          <p className="text-slate-500 text-xs">
            {(database as DatabaseItem[]).length} documentos disponíveis
          </p>
        </div>
      </footer>
    </div>
  );
}
