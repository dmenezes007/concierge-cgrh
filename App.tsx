import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ChevronRight, ExternalLink, ArrowRight, LucideIcon, Volume2, VolumeX, Star } from 'lucide-react';
import * as Icons from 'lucide-react';
import Card from './components/Card';
import ContentRenderer from './components/ContentRenderer';
import database from './src/database.json';

// --- Types ---
interface ListItem {
  text: string;
  html?: string;
  links?: any[];
}

interface Section {
  type: 'heading' | 'paragraph' | 'highlight' | 'list' | 'table';
  level?: number;
  content?: string;
  html?: string;
  items?: string[] | ListItem[];
  ordered?: boolean;
  links?: any[];
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

interface Rating {
  documentId: string;
  ratings: number[];
  average: number;
  count: number;
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
  const [isListening, setIsListening] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [userRating, setUserRating] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Carregar avaliações do documento atual
  useEffect(() => {
    if (selectedItem) {
      loadRatings(selectedItem.id);
      
      // Carregar avaliação do usuário do localStorage
      const userRatingKey = `user-rating-${selectedItem.id}`;
      const savedUserRating = localStorage.getItem(userRatingKey);
      setUserRating(savedUserRating ? parseInt(savedUserRating) : 0);
    }
  }, [selectedItem]);

  // Função para carregar avaliações (API ou localStorage)
  const loadRatings = async (documentId: string) => {
    try {
      // Tentar carregar da API primeiro
      const response = await fetch(`/api/ratings?documentId=${documentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setRatings(prev => ({
          ...prev,
          [documentId]: data
        }));
      } else {
        // Fallback para localStorage
        loadRatingsFromLocalStorage(documentId);
      }
    } catch (error) {
      // Fallback para localStorage em caso de erro
      loadRatingsFromLocalStorage(documentId);
    }
  };

  // Carregar avaliações do localStorage
  const loadRatingsFromLocalStorage = (documentId: string) => {
    const storedRatings = localStorage.getItem('concierge-ratings');
    if (storedRatings) {
      try {
        const allRatings = JSON.parse(storedRatings);
        if (allRatings[documentId]) {
          setRatings(prev => ({
            ...prev,
            [documentId]: allRatings[documentId]
          }));
        }
      } catch (e) {
        console.error('Erro ao carregar avaliações do localStorage:', e);
      }
    }
  };

  // Função para adicionar avaliação
  const handleRate = async (rating: number) => {
    if (!selectedItem) return;

    const documentId = selectedItem.id;
    
    try {
      // Tentar salvar na API
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId, rating })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Atualizar estado com dados da API
        setRatings(prev => ({
          ...prev,
          [documentId]: data
        }));
        
        // Salvar avaliação do usuário no localStorage
        setUserRating(rating);
        localStorage.setItem(`user-rating-${documentId}`, rating.toString());
      } else {
        // Fallback para localStorage
        saveRatingToLocalStorage(documentId, rating);
      }
    } catch (error) {
      console.error('API indisponível, usando localStorage:', error);
      // Fallback para localStorage
      saveRatingToLocalStorage(documentId, rating);
    }
  };

  // Salvar avaliação no localStorage
  const saveRatingToLocalStorage = (documentId: string, rating: number) => {
    const storedRatings = localStorage.getItem('concierge-ratings');
    let allRatings: Record<string, Rating> = {};
    
    if (storedRatings) {
      try {
        allRatings = JSON.parse(storedRatings);
      } catch (e) {
        console.error('Erro ao parsear ratings:', e);
      }
    }

    const currentRatings = allRatings[documentId] || { documentId, ratings: [], average: 0, count: 0 };
    const newRatings = [...currentRatings.ratings, rating];
    const newAverage = newRatings.reduce((sum, r) => sum + r, 0) / newRatings.length;
    
    const updatedRating: Rating = {
      documentId,
      ratings: newRatings,
      average: Math.round(newAverage * 10) / 10,
      count: newRatings.length
    };

    allRatings[documentId] = updatedRating;
    localStorage.setItem('concierge-ratings', JSON.stringify(allRatings));
    
    setRatings(prev => ({
      ...prev,
      [documentId]: updatedRating
    }));
    
    setUserRating(rating);
    localStorage.setItem(`user-rating-${documentId}`, rating.toString());
  };

  // Text-to-Speech handlers
  const handleReadText = () => {
    if (!selectedItem) return;

    // Verificar suporte do navegador
    if (!('speechSynthesis' in window)) {
      alert('Desculpe, seu navegador não suporta leitura de texto. Experimente usar Chrome, Edge ou Safari.');
      return;
    }

    if (isReading) {
      // Parar leitura
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    // Função para extrair apenas texto puro de uma seção
    const extractPlainText = (section: Section): string => {
      if (section.type === 'paragraph' || section.type === 'highlight') {
        // Se tem HTML, extrair apenas texto
        if (section.html) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = section.html;
          return tempDiv.textContent || '';
        }
        return section.content || '';
      }
      
      if (section.type === 'list' && section.items) {
        return section.items.map(item => {
          if (typeof item === 'string') return item;
          if (item.text) return item.text;
          return '';
        }).join('. ');
      }
      
      if (section.type === 'heading') {
        return section.content || '';
      }
      
      return '';
    };

    // Função para limpar texto antes da leitura
    const cleanTextForSpeech = (text: string): string => {
      return text
        // Remover tags HTML restantes
        .replace(/<[^>]*>/g, ' ')
        // Remover ícones e emojis (Unicode)
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
        // Remover símbolos visuais
        .replace(/[📎📋📄📁🔗⚠️ℹ️✓✔✅❌⭐🔔●■□▪▫◆◇○◦•‣⁃]/g, '')
        // Remover referências a elementos visuais
        .replace(/\b(clique aqui|veja abaixo|acima|imagem|figura|anexo|ícone)\b/gi, '')
        // Remover e-mails
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'e-mail')
        // Remover URLs completas
        .replace(/https?:\/\/[^\s]+/g, '')
        .replace(/www\.[^\s]+/g, '')
        // Remover caminhos de arquivo
        .replace(/[A-Za-z]:\\[^\s]+/g, '')
        .replace(/\/[^\s]+\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|zip)/gi, '')
        // Remover entidades HTML
        .replace(/&[a-z]+;/gi, ' ')
        // Remover caracteres especiais isolados (mantém pontuação normal)
        .replace(/[^\w\sáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ.,!?;:()\-]/g, ' ')
        // Remover múltiplos espaços
        .replace(/\s+/g, ' ')
        // Remover espaços antes de pontuação
        .replace(/\s+([.,!?;:])/g, '$1')
        // Adicionar pausas naturais
        .replace(/\./g, '. ')
        .replace(/:/g, ': ')
        .trim();
    };

    // Extrair texto puro de todas as seções
    const textParts = [
      selectedItem.title,
      selectedItem.description
    ];

    // Processar cada seção individualmente
    selectedItem.sections.forEach(section => {
      const plainText = extractPlainText(section);
      if (plainText && plainText.trim().length > 0) {
        textParts.push(plainText);
      }
    });

    const rawText = textParts.join('. ');
    const textToRead = cleanTextForSpeech(rawText);

    // Limitar tamanho do texto (alguns navegadores têm limite)
    const maxLength = 4000;
    const finalText = textToRead.length > maxLength 
      ? textToRead.substring(0, maxLength) + '... Texto muito longo, leitura truncada.'
      : textToRead;

    const utterance = new SpeechSynthesisUtterance(finalText);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    window.speechSynthesis.speak(utterance);
  };

  // Parar leitura quando trocar de documento
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setIsReading(false);
    };
  }, [selectedItem]);

  // Voice recognition handler
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Reconhecimento de voz não suportado neste navegador. Use Chrome ou Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setSelectedItem(null);
      setIsFocused(true);
    };

    recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento de voz:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert('Permissão de microfone negada. Permita o acesso ao microfone nas configurações do navegador.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

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
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);
    
    return (database as DatabaseItem[]).filter(item => {
      // Para cada palavra da busca, verifica se existe no título, keywords ou conteúdo
      return queryWords.every(word => {
        const titleMatch = normalizeText(item.title).includes(word);
        const keywordsMatch = normalizeText(item.keywords).includes(word);
        const contentMatch = item.sections?.some(section => 
          section?.content && normalizeText(section.content).includes(word)
        ) || false;
        
        return titleMatch || keywordsMatch || contentMatch;
      });
    });
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
          <img src="/logos/inpi-branco.png" alt="INPI" className="h-8 sm:h-10 md:h-12 opacity-90" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      
      {/* Fixed Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-4 md:px-6 py-3 flex items-center justify-center">
          <img src="/logos/inpi.png" alt="INPI" className="h-8 mt-2" />
        </div>
      </header>

      {/* Main Content Area with Hero Section */}
      <div 
        className={`flex-1 flex flex-col items-center px-12 sm:px-6 w-full transition-all duration-700 ease-in-out
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
        <div className="w-full max-w-3xl relative z-50 mb-2 sm:mb-4 md:mb-6 px-2 sm:px-0" ref={searchContainerRef}>
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
            
            {/* Voice Search Button */}
            <button 
              onClick={handleVoiceSearch}
              className={`px-3 text-slate-400 hover:text-blue-500 transition-colors ${isListening ? 'animate-pulse text-red-500' : ''}`}
              title="Pesquisar por voz"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
            </button>
            
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
              absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 origin-top mx-2 sm:mx-0 z-[100]
              ${(isFocused && query && suggestions.length > 0) ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'}
            `}
          >
            <div className="h-[180px] sm:h-[240px] overflow-y-scroll">
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
          
          {/* Aviso sobre IA */}
          <div className="mt-3 text-center px-4">
            <p className="text-xs sm:text-sm text-slate-500 flex items-center justify-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              <strong>AVISO:</strong> Não utilizamos recursos de IA. Digite palavras-chave para encontrar a informação que você procura.
            </p>
          </div>
        </div>
      </div>

      {/* Content Display Area */}
      <div className={`flex-1 flex justify-center w-full bg-white relative z-20 transition-opacity duration-700 delay-100 ${hasSelection ? 'opacity-100' : 'opacity-0 hidden'}`}>
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
                  
                  {/* Botões de ação */}
                  <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                    {/* Botão Ler Texto */}
                    <button
                      onClick={handleReadText}
                      className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105"
                      style={{
                        background: isReading 
                          ? `linear-gradient(to right, ${COLOR_GRADIENTS[selectedItem.color.bg]?.hover || '#1d4ed8'}, ${COLOR_GRADIENTS[selectedItem.color.bg]?.hover || '#1d4ed8'})`
                          : `linear-gradient(to right, ${COLOR_GRADIENTS[selectedItem.color.bg]?.to || '#2563eb'}, ${COLOR_GRADIENTS[selectedItem.color.bg]?.hover || '#1d4ed8'})`,
                        color: '#ffffff'
                      }}
                      title={isReading ? 'Parar leitura' : 'Ler texto'}
                    >
                      {isReading ? <VolumeX size={14} className="sm:w-4 sm:h-4" /> : <Volume2 size={14} className="sm:w-4 sm:h-4" />}
                      {isReading ? 'PARAR' : 'LER TEXTO'}
                    </button>
                    
                    {/* Botão Acessar na Intranet */}
                    {selectedItem.externalLink && selectedItem.externalLink !== '#' && (
                      <a 
                        href={selectedItem.externalLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 no-underline"
                        style={{
                          background: `linear-gradient(to right, ${COLOR_GRADIENTS[selectedItem.color.bg]?.to || '#2563eb'}, ${COLOR_GRADIENTS[selectedItem.color.bg]?.hover || '#1d4ed8'})`,
                          color: '#ffffff',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={14} className="sm:w-4 sm:h-4" />
                        ACESSAR NA INTRANET
                      </a>
                    )}
                  </div>
                  
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

            {/* Rating Component - Top */}
            <Card className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm sm:text-base font-medium text-slate-700">Avalie este conteúdo:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          size={24}
                          className={`${
                            star <= (hoveredStar || userRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-300'
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                {ratings[selectedItem.id] && ratings[selectedItem.id].count > 0 && (
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <Star size={20} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-slate-900">{ratings[selectedItem.id].average.toFixed(1)}</span>
                    <span className="text-slate-500">({ratings[selectedItem.id].count} {ratings[selectedItem.id].count === 1 ? 'avaliação' : 'avaliações'})</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Content Card */}
            <Card className="prose prose-slate prose-lg max-w-none">
              <ContentRenderer sections={selectedItem.sections as any} color={selectedItem.color} />
            </Card>

            {/* Rating Component - Bottom */}
            <Card className="mt-6 sm:mt-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm sm:text-base font-medium text-slate-700">Avalie este conteúdo:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          size={24}
                          className={`${
                            star <= (hoveredStar || userRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-300'
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                {ratings[selectedItem.id] && ratings[selectedItem.id].count > 0 && (
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <Star size={20} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-slate-900">{ratings[selectedItem.id].average.toFixed(1)}</span>
                    <span className="text-slate-500">({ratings[selectedItem.id].count} {ratings[selectedItem.id].count === 1 ? 'avaliação' : 'avaliações'})</span>
                  </div>
                )}
              </div>
            </Card>
          </main>
        )}
      </div>

      {/* Footer with Sliding Logos */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-slate-200 py-3 sm:py-8 md:py-10 px-4 overflow-hidden">
        {/* Animated Logos Slider */}
        <div className="mb-2 sm:mb-6 md:mb-8 relative overflow-hidden">
          <div className="flex items-center gap-8 sm:gap-12 md:gap-16 animate-slideLogos whitespace-nowrap">
            {/* First set */}
            <img src="/logos/dirad.png" alt="DIRAD" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/cgrh.png" alt="CGRH" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/coarh.png" alt="COARH" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/acad.png" alt="ACAD" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            <img src="/logos/cetec.png" alt="CETEC" className="h-8 sm:h-10 opacity-40 hover:opacity-100 transition-opacity inline-block grayscale hover:grayscale-0 flex-shrink-0" />
            {/* Second set - seamless duplicate for infinite loop */}
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
          <p className="text-blue-600 text-sm sm:text-base font-bold mb-2 sm:mb-3">
            Projeto de Gestão do Conhecimento
          </p>
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
