import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ChevronRight, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import Card from './components/Card'; // Import the Card component

// --- Types ---
interface DatabaseItem {
  id: string;
  title: string;
  keywords: string;
  csvDescription: string;
  externalLink: string;
  content: React.ReactNode;
}

// --- Database ---
const DATABASE: DatabaseItem[] = [
  {
    id: 'ferias',
    title: 'Férias',
    keywords: 'marcacão agendamento homologação prazo devolução adiantamento',
    csvDescription: 'Marcação e agendamento de férias exigem homologação tempestiva.',
    externalLink: 'http://intranet.inpi.gov.br/index.php/recursos-humanos-gestao-de-pessoas/todos-os-servicos?view=article&layout=edit&id=496:ferias-cgrh&catid=20',
    content: (
      <>
        <p className="mb-4 text-slate-600 leading-relaxed">A Divisão de Registros Funcionais informa e orienta sobre: marcação de férias, alteração de férias e homologação das férias pela chefia imediata.</p>
        <div className="bg-blue-50 p-5 rounded-xl border-l-4 border-blue-500 mb-8 shadow-sm">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Comunicado sobre Prazo de Homologações
          </h3>
          <p className="text-blue-800">Prazo para homologação de férias - Encerramento da folha em DEZEMBRO/2025 - <strong>Data limite: 09/12/2025</strong></p>
        </div>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Marcação de Férias</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">A marcação é feita pelo SouGov (www.gov.br/sougov). No menu "autoatendimento", clique em "férias" e depois "programar férias".</p>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Homologação (Atenção Chefias)</h3>
        <ul className="space-y-3 text-slate-600">
           <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span>Somente com a homologação há o efetivo registro.</li>
           <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span>Após o prazo, não serão aceitos ofícios para marcação retroativa.</li>
           <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span>Alterações fora do prazo podem gerar devolução de parcelas financeiras.</li>
        </ul>
      </>
    )
  },
  {
    id: 'pagamento',
    title: 'Pagamento',
    keywords: 'remuneração contracheque 13 salario auxilio transporte',
    csvDescription: 'Temas ligados à remuneração do servidor, 13º salário e gratificações.',
    externalLink: 'http://intranet.inpi.gov.br/index.php/recursos-humanos-gestao-de-pessoas/pagamento',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">1) Gratificação Natalina</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">O contracheque definitivo com a gratificação natalina será disponibilizado após a homologação da folha em <strong>17/11/2025</strong>. A prévia de 13/11 não incluirá a gratificação.</p>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">2) Pagamento de Substituição</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Os dias de substituição de dezembro/2025 devem ser solicitados até 3 dias antes do fechamento da folha de janeiro/2026.</p>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Retribuição por Titulação (RT)</h3>
        <p className="text-slate-600 leading-relaxed">Necessário enviar requerimento, termo de compromisso e comprovante de conclusão para <code className="bg-slate-100 px-2 py-1 rounded text-slate-800 font-mono text-sm">secad@inpi.gov.br</code>.</p>
      </>
    )
  },
  {
    id: 'frequencia',
    title: 'Frequência',
    keywords: 'ponto sisref sougov presença ausência banco de horas',
    csvDescription: 'Gerenciamento da folha de ponto pelo SOUGOV Frequência.',
    externalLink: 'http://intranet.inpi.gov.br/index.php/recursos-humanos-gestao-de-pessoas?view=article&layout=edit&id=862:frequencia-2&catid=20',
    content: (
      <>
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl mb-6 shadow-sm">
           <p className="font-medium text-amber-800 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            O INPI implantou o SOUGOV frequência, inabilitando o SISREF.
           </p>
        </div>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Banco de Horas</h3>
        <ul className="space-y-3 mb-6 text-slate-600">
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span>Necessário ter acumulado previamente as horas excedentes.</li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span>Estabelecer prévia combinação com a chefia.</li>
        </ul>
        <p className="text-slate-600">A frequência deve ser homologada até o <strong>5º dia útil do mês subsequente</strong>.</p>
      </>
    )
  },
  {
    id: 'capacitacao',
    title: 'Capacitação',
    keywords: 'cetec treinamento curso proamb pdp',
    csvDescription: 'O CETEC gerencia o Plano de Desenvolvimento de Pessoas (PDP).',
    externalLink: 'http://intranet.inpi.gov.br/index.php/recursos-humanos-gestao-de-pessoas',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Cursos EAD Gratuitos</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">A EV.G disponibiliza cursos gratuitos em <a href="https://www.escolavirtual.gov.br" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">www.escolavirtual.gov.br</a>.</p>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">PROAMB</h3>
        <p className="text-slate-600 leading-relaxed">Programa de Ambientação e Formação de Novos Servidores, visando a correta lotação e integração durante o estágio probatório.</p>
      </>
    )
  },
  {
    id: 'licencas',
    title: 'Licenças',
    keywords: 'saude doença pericia atestado conjuge premio',
    csvDescription: 'Licenças médicas, saúde e acompanhamento de cônjuge.',
    externalLink: 'http://intranet.inpi.gov.br',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Licença Saúde (Sem Perícia)</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Dispensada de perícia para atestados de até 14 dias, se o total em 12 meses for inferior a 15 dias. Prazo de entrega: 5 dias.</p>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Licença Acompanhamento de Cônjuge</h3>
        <p className="text-slate-600 leading-relaxed">Sem remuneração e por prazo indeterminado, para acompanhar cônjuge deslocado.</p>
      </>
    )
  },
  {
    id: 'aposentadoria',
    title: 'Aposentadoria e Abono',
    keywords: 'abono permanencia voluntaria tempo serviço',
    csvDescription: 'Regras para aposentadoria voluntária e abono de permanência.',
    externalLink: 'http://intranet.inpi.gov.br',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Abono de Permanência</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Para quem já pode se aposentar mas opta por ficar. Requerer via <code className="bg-slate-100 px-2 py-1 rounded text-slate-800 font-mono text-sm">serap@inpi.gov.br</code>.</p>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Aposentadoria Voluntária</h3>
        <p className="text-slate-600 leading-relaxed">Conforme Emenda Constitucional nº 103/2019. Necessário formulário de requerimento e termo de opção.</p>
      </>
    )
  },
  {
    id: 'dados-cadastrais',
    title: 'Dados Cadastrais',
    keywords: 'atualização dados pessoais perfil sougov',
    csvDescription: 'Atualização anual de dados pessoais no SouGov.',
    externalLink: 'http://intranet.inpi.gov.br',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Atualização Obrigatória</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">A validação anual ocorre entre <strong>1º de março e 30 de abril</strong> pelo SouGov (Menu "Meu Perfil").</p>
        <div className="bg-red-50 p-5 rounded-xl text-red-800 border border-red-200 shadow-sm">
          <p className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            A não atualização pode incorrer em vedação legal (Lei nº 8.112).
          </p>
        </div>
      </>
    )
  },
  {
    id: 'estagio-probatorio',
    title: 'Estágio Probatório',
    keywords: 'avaliacao desempenho 3 anos nomeação',
    csvDescription: 'Avaliação de desempenho nos primeiros 3 anos.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Prazos de Avaliação</h3>
        <ul className="space-y-3 text-slate-600">
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span><span><strong>12 e 24 meses:</strong> Chefia imediata e mediata.</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span><span><strong>30 meses:</strong> Comissão de Avaliação (CAEPS).</span></li>
        </ul>
        <p className="mt-6 text-slate-600">Necessário média superior a 6 (seis) para aprovação.</p>
      </>
    )
  },
  {
    id: 'aposentadoria-e-abono',
    title: 'Aposentadoria e Abono',
    keywords: 'aposentadoria abono',
    csvDescription: 'Documento sobre Aposentadoria e Abono.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Aposentadoria e Abono</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Aposentadoria e Abono.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'capacitacao-doc',
    title: 'Capacitação',
    keywords: 'capacitacao',
    csvDescription: 'Documento sobre Capacitação.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Capacitação</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Capacitação.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'carta-de-servicos',
    title: 'Carta de Serviços',
    keywords: 'carta servicos',
    csvDescription: 'Documento sobre Carta de Serviços.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Carta de Serviços</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Carta de Serviços.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'dados-cadastrais-doc',
    title: 'Dados Cadastrais',
    keywords: 'dados cadastrais',
    csvDescription: 'Documento sobre Dados Cadastrais.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Dados Cadastrais</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Dados Cadastrais.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'estagio-probatorio-doc',
    title: 'Estágio Probatório',
    keywords: 'estagio probatorio',
    csvDescription: 'Documento sobre Estágio Probatório.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Estágio Probatório</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Estágio Probatório.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'ferias-doc',
    title: 'Férias',
    keywords: 'ferias',
    csvDescription: 'Documento sobre Férias.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Férias</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Férias.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'frequencia-doc',
    title: 'Frequência',
    keywords: 'frequencia',
    csvDescription: 'Documento sobre Frequência.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Frequência</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Frequência.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'licencas-doc',
    title: 'Licenças',
    keywords: 'licencas',
    csvDescription: 'Documento sobre Licenças.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Licenças</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Licenças.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'pagamento-doc',
    title: 'Pagamento',
    keywords: 'pagamento',
    csvDescription: 'Documento sobre Pagamento.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Pagamento</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Pagamento.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'programa-gestao-desempenho',
    title: 'Programa de Gestão e Desempenho',
    keywords: 'programa gestao desempenho',
    csvDescription: 'Documento sobre Programa de Gestão e Desempenho.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Programa de Gestão e Desempenho</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Programa de Gestão e Desempenho.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'remocao',
    title: 'Remoção',
    keywords: 'remocao',
    csvDescription: 'Documento sobre Remoção.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Remoção</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Remoção.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'retribuicao-por-titulacao',
    title: 'Retribuição por Titulação',
    keywords: 'retribuicao titulacao',
    csvDescription: 'Documento sobre Retribuição por Titulação.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Retribuição por Titulação</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Retribuição por Titulação.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'saude-ocupacional',
    title: 'Saúde Ocupacional',
    keywords: 'saude ocupacional',
    csvDescription: 'Documento sobre Saúde Ocupacional.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Saúde Ocupacional</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Saúde Ocupacional.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'selecao-interna-e-externa',
    title: 'Seleção Interna e Externa',
    keywords: 'selecao interna externa',
    csvDescription: 'Documento sobre Seleção Interna e Externa.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Seleção Interna e Externa</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Seleção Interna e Externa.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  },
  {
    id: 'utilizacao-sougov',
    title: 'Utilização do SouGov',
    keywords: 'utilizacao sougov',
    csvDescription: 'Documento sobre Utilização do SouGov.',
    externalLink: '#',
    content: (
      <>
        <h3 className="text-xl font-semibold mb-3 text-slate-800">Utilização do SouGov</h3>
        <p className="mb-6 text-slate-600 leading-relaxed">Conteúdo do documento 'Utilização do SouGov.docx' seria exibido aqui.</p>
        <p className="text-sm text-slate-500 italic">Este é um placeholder. O conteúdo real do documento Word (.docx) precisaria ser convertido para um formato web (HTML, Markdown ou texto simples) para ser exibido dinamicamente.</p>
      </>
    )
  }
];

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
    return DATABASE.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) || 
      item.keywords.toLowerCase().includes(lowerQuery)
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      
      {/* Header / Logo Area - Dynamically positions based on state */}
      <div 
        className={`transition-all duration-700 ease-in-out flex flex-col items-center justify-center px-4 w-full
          ${hasSelection ? 'pt-8 pb-6' : 'min-h-[60vh]'}`}
      >
        <div className={`transition-all duration-700 flex flex-col items-center ${hasSelection ? 'scale-75 mb-4' : 'scale-100 mb-8'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/30">
              <Sparkles size={24} />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">
              Concierge RH Digital
            </h1>
          </div>
          {!hasSelection && (
            <p className="text-slate-400 text-sm font-medium tracking-wide uppercase mt-2">
              Base de Conhecimento Interna
            </p>
          )}
        </div>

        {/* Search Container */}
        <div className="w-full max-w-2xl relative z-20" ref={searchContainerRef}>
          <div 
            className={`
              relative flex items-center w-full transition-all duration-300
              ${isFocused ? 'shadow-2xl scale-[1.01]' : 'shadow-lg hover:shadow-xl'}
              bg-white rounded-2xl border border-slate-100
            `}
          >
            <div className="pl-5 text-slate-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedItem(null); // Reset selection on type to allow new search
                setIsFocused(true);
              }}
              onFocus={() => setIsFocused(true)}
              placeholder="Como posso ajudar você hoje?"
              className="w-full py-4 px-4 bg-transparent outline-none text-lg text-slate-700 placeholder:text-slate-300 rounded-2xl"
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
            <div className="max-h-[300px] overflow-y-auto">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{item.title}</span>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">{item.csvDescription}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
          
           {/* No results state in dropdown */}
           {(isFocused && query && suggestions.length === 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 text-center text-slate-400">
              Nenhum resultado encontrado para "{query}"
            </div>
          )}
        </div>
      </div>

      {/* Content Display Area */}
      <div className={`flex-1 flex justify-center w-full bg-white relative transition-opacity duration-700 delay-100 ${hasSelection ? 'opacity-100' : 'opacity-0 hidden'}`}>
         {/* Decorative gradient top border for content area */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        
        {selectedItem && (
          <main className="w-full max-w-3xl px-6 py-12 animate-fadeIn">
            <Card className="mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-4">
                RH / {selectedItem.title}
              </span>
              <h2 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">{selectedItem.title}</h2>
              <p className="text-lg text-slate-500 font-light leading-relaxed border-l-2 border-slate-200 pl-4">
                {selectedItem.csvDescription}
              </p>
            </Card>

            <Card className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-700">
              {selectedItem.content}
            </Card>

            {selectedItem.externalLink && selectedItem.externalLink !== '#' && (
              <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
                <a 
                  href={selectedItem.externalLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all hover:-translate-y-0.5"
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

      {/* Footer (Only visible when no selection to keep look clean) */}
      {!hasSelection && (
        <footer className="w-full py-6 text-center text-slate-300 text-sm">
          &copy; 2025 Departamento de Gestão de Pessoas
        </footer>
      )}
    </div>
  );
}