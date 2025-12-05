import React from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  List, 
  ListOrdered 
} from 'lucide-react';

interface Section {
  type: 'heading' | 'paragraph' | 'highlight' | 'list' | 'table';
  level?: number;
  content?: string;
  items?: string[];
  ordered?: boolean;
}

interface ContentRendererProps {
  sections: Section[];
  color?: { bg: string; text: string };
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
            {section.content}
          </p>
        );
      
      case 'highlight':
        // Detectar tipo de alerta baseado no conteúdo
        const isWarning = /atenção|cuidado|importante/i.test(section.content || '');
        const isDeadline = /prazo|data limite|encerramento/i.test(section.content || '');
        const isSuccess = /sucesso|aprovado|concluído/i.test(section.content || '');
        
        let alertColor = 'blue';
        let AlertIcon = Info;
        
        if (isWarning) {
          alertColor = 'amber';
          AlertIcon = AlertCircle;
        } else if (isDeadline) {
          alertColor = 'red';
          AlertIcon = AlertCircle;
        } else if (isSuccess) {
          alertColor = 'green';
          AlertIcon = CheckCircle;
        }
        
        return (
          <div 
            key={index} 
            className={`
              p-5 rounded-xl border-l-4 mb-6 shadow-sm
              ${alertColor === 'blue' ? 'bg-blue-50 border-blue-500' : ''}
              ${alertColor === 'amber' ? 'bg-amber-50 border-amber-500' : ''}
              ${alertColor === 'red' ? 'bg-red-50 border-red-500' : ''}
              ${alertColor === 'green' ? 'bg-green-50 border-green-500' : ''}
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                mt-0.5
                ${alertColor === 'blue' ? 'text-blue-600' : ''}
                ${alertColor === 'amber' ? 'text-amber-600' : ''}
                ${alertColor === 'red' ? 'text-red-600' : ''}
                ${alertColor === 'green' ? 'text-green-600' : ''}
              `}>
                <AlertIcon size={20} />
              </div>
              <p className={`
                flex-1 font-medium
                ${alertColor === 'blue' ? 'text-blue-900' : ''}
                ${alertColor === 'amber' ? 'text-amber-900' : ''}
                ${alertColor === 'red' ? 'text-red-900' : ''}
                ${alertColor === 'green' ? 'text-green-900' : ''}
              `}>
                {section.content}
              </p>
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
                      {item}
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
                  className="prose prose-slate prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.content || '' }}
                />
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
