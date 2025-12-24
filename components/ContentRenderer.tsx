import React from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  List, 
  ListOrdered,
  ExternalLink,
  Calendar,
  FileText,
  Mail,
  Phone,
  Clock,
  Shield,
  AlertTriangle,
  Lightbulb,
  Quote
} from 'lucide-react';

interface Link {
  text: string;
  url: string;
}

interface ListItem {
  text: string;
  html?: string;
  links?: Link[];
}

interface Section {
  type: 'heading' | 'paragraph' | 'highlight' | 'list' | 'table' | 'callout' | 'blockquote' | 'divider' | 'card' | 'contact' | 'timeline';
  level?: number;
  content?: string;
  html?: string;
  links?: Link[];
  items?: ListItem[];
  ordered?: boolean;
  variant?: 'info' | 'warning' | 'success' | 'error' | 'tip' | 'note' | 'deadline' | 'important';
  title?: string;
  author?: string;
}

interface ContentRendererProps {
  sections: Section[];
  color?: { bg: string; text: string };
}

// Helper para renderizar texto com links
function renderTextWithLinks(text: string, links?: Link[], html?: string) {
  if (!links || links.length === 0) {
    return text;
  }
  
  // Se tiver HTML, usar dangerouslySetInnerHTML para preservar links
  if (html) {
    return (
      <span 
        dangerouslySetInnerHTML={{ __html: html }}
        className="[&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1"
      />
    );
  }
  
  return text;
}

export default function ContentRenderer({ sections, color = { bg: 'blue', text: 'blue' } }: ContentRendererProps) {
  
  const renderSection = (section: Section, index: number) => {
    switch (section.type) {
      case 'heading':
        const level = section.level || 3;
        const headingClasses = level === 1 
          ? 'text-3xl font-bold text-slate-900 mb-4 mt-8 first:mt-0'
          : level === 2
          ? 'text-2xl font-semibold text-slate-800 mb-3 mt-6 first:mt-0'
          : 'text-xl font-semibold text-slate-800 mb-3 mt-5 first:mt-0';
        
        if (level === 1) return <h1 key={index} className={headingClasses}>{section.content}</h1>;
        if (level === 2) return <h2 key={index} className={headingClasses}>{section.content}</h2>;
        if (level === 3) return <h3 key={index} className={headingClasses}>{section.content}</h3>;
        return <h4 key={index} className={headingClasses}>{section.content}</h4>;
      
      case 'paragraph':
        return (
          <p key={index} className="mb-4 text-slate-600 leading-relaxed">
            {renderTextWithLinks(section.content || '', section.links, section.html)}
          </p>
        );
      
      case 'highlight':
        // Detectar tipo de alerta baseado no conteúdo e variant
        const content = section.content || '';
        const variant = section.variant || 'info';
        
        // Auto-detecção se variant não foi especificado
        let alertType = variant;
        if (variant === 'info') {
          if (/atenção|cuidado/i.test(content)) alertType = 'warning';
          else if (/importante|obrigatório|necessário/i.test(content)) alertType = 'important';
          else if (/prazo|data limite|encerramento|vencimento/i.test(content)) alertType = 'deadline';
          else if (/sucesso|aprovado|concluído|deferido/i.test(content)) alertType = 'success';
          else if (/erro|negado|indeferido|rejeitado/i.test(content)) alertType = 'error';
          else if (/dica|sugestão|recomenda/i.test(content)) alertType = 'tip';
        }
        
        // Configuração de cores e ícones por tipo
        const alertConfig: Record<string, { color: string; bg: string; border: string; Icon: any }> = {
          info: { color: 'text-blue-900', bg: 'bg-blue-50', border: 'border-blue-500', Icon: Info },
          warning: { color: 'text-amber-900', bg: 'bg-amber-50', border: 'border-amber-500', Icon: AlertCircle },
          success: { color: 'text-green-900', bg: 'bg-green-50', border: 'border-green-500', Icon: CheckCircle },
          error: { color: 'text-red-900', bg: 'bg-red-50', border: 'border-red-500', Icon: AlertTriangle },
          tip: { color: 'text-purple-900', bg: 'bg-purple-50', border: 'border-purple-500', Icon: Lightbulb },
          note: { color: 'text-slate-900', bg: 'bg-slate-50', border: 'border-slate-500', Icon: FileText },
          deadline: { color: 'text-red-900', bg: 'bg-red-50', border: 'border-red-500', Icon: Calendar },
          important: { color: 'text-orange-900', bg: 'bg-orange-50', border: 'border-orange-500', Icon: Shield }
        };
        
        const config = alertConfig[alertType] || alertConfig.info;
        const AlertIcon = config.Icon;
        
        return (
          <div 
            key={index} 
            className={`p-5 rounded-xl border-l-4 mb-6 shadow-sm ${config.bg} ${config.border}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${config.color.replace('900', '600')}`}>
                <AlertIcon size={20} />
              </div>
              <div className={`flex-1 font-medium ${config.color}`}>
                {renderTextWithLinks(section.content || '', section.links, section.html)}
              </div>
            </div>
          </div>
        );
      
      case 'list':
        const ListIcon = section.ordered ? ListOrdered : List;
        const ListTag = section.ordered ? 'ol' : 'ul';
        
        return (
          <div key={index} className="mb-6">
            <div className={`
              bg-gradient-to-r from-${color.bg}-50 to-transparent p-4 rounded-lg border-l-2 border-${color.bg}-300
            `}>
              <div className="flex items-start gap-3">
                <div className={`text-${color.text}-600 mt-1`}>
                  <ListIcon size={18} />
                </div>
                <ListTag className={`flex-1 space-y-2 ${section.ordered ? 'list-decimal list-inside' : ''}`}>
                  {section.items?.map((item, i) => (
                    <li key={i} className="text-slate-700 leading-relaxed">
                      {section.ordered ? '' : (
                        <span className={`inline-block w-1.5 h-1.5 bg-${color.bg}-500 rounded-full mr-2`}></span>
                      )}
                      {typeof item === 'string' ? item : renderTextWithLinks(item.text, item.links, item.html)}
                    </li>
                  ))}
                </ListTag>
              </div>
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div key={index} className="mb-6 overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-slate-200 rounded-lg shadow-sm">
                <div 
                  className="prose prose-slate prose-sm max-w-none [&_table]:w-full [&_th]:bg-slate-100 [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold [&_td]:p-3 [&_td]:border-t [&_td]:border-slate-200"
                  dangerouslySetInnerHTML={{ __html: section.content || '' }}
                />
              </div>
            </div>
          </div>
        );
      
      case 'blockquote':
        return (
          <div key={index} className="mb-6 pl-4 border-l-4 border-slate-300 bg-slate-50 py-4 pr-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Quote className="text-slate-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-slate-700 italic leading-relaxed mb-2">
                  {renderTextWithLinks(section.content || '', section.links, section.html)}
                </p>
                {section.author && (
                  <p className="text-sm text-slate-500 font-medium">— {section.author}</p>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'divider':
        return (
          <div key={index} className="my-8 flex items-center">
            <div className="flex-1 border-t border-slate-200"></div>
            {section.content && (
              <>
                <span className="px-4 text-sm text-slate-500 font-medium">{section.content}</span>
                <div className="flex-1 border-t border-slate-200"></div>
              </>
            )}
          </div>
        );
      
      case 'card':
        return (
          <div key={index} className="mb-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {section.title && (
              <div className={`px-6 py-4 bg-gradient-to-r from-${color.bg}-50 to-${color.bg}-100 border-b border-slate-200`}>
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className={`text-${color.text}-600`} size={18} />
                  {section.title}
                </h4>
              </div>
            )}
            <div className="px-6 py-5">
              <p className="text-slate-600 leading-relaxed">
                {renderTextWithLinks(section.content || '', section.links, section.html)}
              </p>
            </div>
          </div>
        );
      
      case 'contact':
        // Detectar tipo de contato
        const contentLower = (section.content || '').toLowerCase();
        const isEmail = /@/.test(contentLower) || /email|e-mail/.test(contentLower);
        const isPhone = /\d{4,}|\btel|telefone|ramal/.test(contentLower);
        const ContactIcon = isEmail ? Mail : isPhone ? Phone : Info;
        
        return (
          <div key={index} className="mb-4 flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-blue-600">
              <ContactIcon size={20} />
            </div>
            <div className="flex-1">
              <p className="text-slate-700 font-medium">
                {renderTextWithLinks(section.content || '', section.links, section.html)}
              </p>
            </div>
          </div>
        );
      
      case 'timeline':
        return (
          <div key={index} className="mb-6">
            <div className="relative pl-8 pb-8 border-l-2 border-blue-200 last:pb-0">
              <div className="absolute left-0 top-0 -translate-x-[9px] w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
              <div className="flex items-start gap-2 mb-2">
                <Clock className="text-blue-600 mt-0.5" size={16} />
                {section.title && (
                  <h4 className="font-semibold text-slate-900">{section.title}</h4>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed">
                {renderTextWithLinks(section.content || '', section.links, section.html)}
              </p>
            </div>
          </div>
        );
      
      case 'callout':
        // Callout especial para informações destacadas
        const calloutVariant = section.variant || 'info';
        const calloutConfig: Record<string, { color: string; bg: string; Icon: any }> = {
          info: { color: 'text-blue-600', bg: 'bg-gradient-to-r from-blue-50 to-blue-100', Icon: Info },
          tip: { color: 'text-purple-600', bg: 'bg-gradient-to-r from-purple-50 to-purple-100', Icon: Lightbulb },
          warning: { color: 'text-amber-600', bg: 'bg-gradient-to-r from-amber-50 to-amber-100', Icon: AlertTriangle },
          success: { color: 'text-green-600', bg: 'bg-gradient-to-r from-green-50 to-green-100', Icon: CheckCircle }
        };
        
        const calloutCfg = calloutConfig[calloutVariant] || calloutConfig.info;
        const CalloutIcon = calloutCfg.Icon;
        
        return (
          <div key={index} className={`mb-6 p-6 rounded-xl ${calloutCfg.bg} border-2 border-${calloutVariant}-200 shadow-sm`}>
            <div className="flex items-start gap-4">
              <div className={`${calloutCfg.color} p-2 rounded-lg bg-white shadow-sm`}>
                <CalloutIcon size={24} />
              </div>
              <div className="flex-1">
                {section.title && (
                  <h4 className="font-bold text-slate-900 mb-2 text-lg">{section.title}</h4>
                )}
                <div className="text-slate-700 leading-relaxed">
                  {renderTextWithLinks(section.content || '', section.links, section.html)}
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-2">
      {sections.map((section, index) => renderSection(section, index))}
    </div>
  );
}
