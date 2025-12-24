/**
 * Processador Avançado de Documentos DOCX
 * Extrai formatação rica, estrutura e metadados
 */

import mammoth from 'mammoth';

interface ProcessedSection {
  type: 'heading' | 'paragraph' | 'highlight' | 'list' | 'table' | 'callout' | 'blockquote' | 'divider' | 'card' | 'contact' | 'timeline';
  level?: number;
  content?: string;
  html?: string;
  links?: Array<{ text: string; url: string }>;
  items?: Array<{ text: string; html?: string; links?: any[] }>;
  ordered?: boolean;
  variant?: 'info' | 'warning' | 'success' | 'error' | 'tip' | 'note' | 'deadline' | 'important';
  title?: string;
  author?: string;
}

interface ProcessedDocument {
  content: string; // Texto puro para indexação
  html: string; // HTML completo
  sections: ProcessedSection[];
  metadata: {
    hasImages: boolean;
    hasTables: boolean;
    hasLinks: boolean;
    wordCount: number;
    paragraphCount: number;
  };
}

/**
 * Detecta o tipo de seção baseado no conteúdo e formatação
 */
function detectSectionType(text: string, style: string): ProcessedSection['type'] {
  const textLower = text.toLowerCase();
  
  // Detectar títulos
  if (style.includes('Heading') || style.includes('Title')) {
    return 'heading';
  }
  
  // Detectar highlights/callouts
  if (/^(atenção|importante|nota|dica|observação|cuidado)/i.test(text)) {
    return 'highlight';
  }
  
  // Detectar contatos
  if (/@/.test(text) || /\b(tel|telefone|ramal|email|e-mail|contato):/i.test(text)) {
    return 'contact';
  }
  
  // Detectar citações
  if (/^[""]/.test(text) || /^—/.test(text)) {
    return 'blockquote';
  }
  
  // Detectar dividers
  if (/^[-_*]{3,}$/.test(text.trim())) {
    return 'divider';
  }
  
  // Detectar timeline
  if (/^\d{1,2}[./]\d{1,2}[./]\d{2,4}/.test(text) || /^(passo|etapa|fase)\s+\d+/i.test(text)) {
    return 'timeline';
  }
  
  return 'paragraph';
}

/**
 * Detecta variant de highlight baseado no conteúdo
 */
function detectVariant(text: string): ProcessedSection['variant'] {
  const textLower = text.toLowerCase();
  
  if (/\b(atenção|cuidado|alerta)\b/i.test(text)) return 'warning';
  if (/\b(importante|obrigatório|necessário|essencial)\b/i.test(text)) return 'important';
  if (/\b(prazo|data limite|vencimento|encerramento)\b/i.test(text)) return 'deadline';
  if (/\b(sucesso|aprovado|concluído|deferido)\b/i.test(text)) return 'success';
  if (/\b(erro|negado|indeferido|rejeitado|falha)\b/i.test(text)) return 'error';
  if (/\b(dica|sugestão|recomenda|tip)\b/i.test(text)) return 'tip';
  if (/\b(nota|observação|note)\b/i.test(text)) return 'note';
  
  return 'info';
}

/**
 * Extrai links de um HTML
 */
function extractLinks(html: string): Array<{ text: string; url: string }> {
  const links: Array<{ text: string; url: string }> = [];
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    links.push({
      url: match[1],
      text: match[2].replace(/<[^>]+>/g, '')
    });
  }
  
  return links;
}

/**
 * Remove tags HTML mantendo o texto
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Processa listas (ul/ol) em formato estruturado
 */
function processList(listHtml: string, ordered: boolean): ProcessedSection {
  const items: Array<{ text: string; html?: string; links?: any[] }> = [];
  const itemRegex = /<li[^>]*>(.*?)<\/li>/gis;
  let match;
  
  while ((match = itemRegex.exec(listHtml)) !== null) {
    const itemHtml = match[1];
    const text = stripHtml(itemHtml);
    const links = extractLinks(itemHtml);
    
    items.push({
      text,
      html: itemHtml,
      links: links.length > 0 ? links : undefined
    });
  }
  
  return {
    type: 'list',
    items,
    ordered
  };
}

/**
 * Processa tabelas preservando estrutura
 */
function processTable(tableHtml: string): ProcessedSection {
  return {
    type: 'table',
    content: tableHtml,
    html: tableHtml
  };
}

/**
 * Converte HTML do Mammoth em seções estruturadas
 */
function parseHtmlToSections(html: string): ProcessedSection[] {
  const sections: ProcessedSection[] = [];
  
  // Dividir por tags de bloco principais
  const blockRegex = /<(h[1-6]|p|ul|ol|table|blockquote)[^>]*>(.*?)<\/\1>/gis;
  let match;
  let lastIndex = 0;
  
  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2];
    const text = stripHtml(content);
    
    if (!text.trim()) continue;
    
    // Processar diferentes tipos de tags
    if (tag.startsWith('h')) {
      const level = parseInt(tag[1]);
      sections.push({
        type: 'heading',
        level,
        content: text
      });
    } else if (tag === 'p') {
      const sectionType = detectSectionType(text, '');
      const links = extractLinks(content);
      
      if (sectionType === 'highlight') {
        sections.push({
          type: 'highlight',
          content: text,
          html: content,
          links: links.length > 0 ? links : undefined,
          variant: detectVariant(text)
        });
      } else if (sectionType === 'contact') {
        sections.push({
          type: 'contact',
          content: text,
          html: content,
          links: links.length > 0 ? links : undefined
        });
      } else if (sectionType === 'timeline') {
        sections.push({
          type: 'timeline',
          content: text,
          html: content,
          links: links.length > 0 ? links : undefined
        });
      } else {
        sections.push({
          type: 'paragraph',
          content: text,
          html: content,
          links: links.length > 0 ? links : undefined
        });
      }
    } else if (tag === 'ul') {
      sections.push(processList(match[0], false));
    } else if (tag === 'ol') {
      sections.push(processList(match[0], true));
    } else if (tag === 'table') {
      sections.push(processTable(match[0]));
    } else if (tag === 'blockquote') {
      sections.push({
        type: 'blockquote',
        content: text,
        html: content
      });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  return sections;
}

/**
 * Função principal para processar documento DOCX
 */
export async function processDocx(buffer: Buffer): Promise<ProcessedDocument> {
  // Converter para HTML com opções avançadas
  const result = await mammoth.convertToHtml({ 
    buffer,
    styleMap: [
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh",
      "p[style-name='Heading 4'] => h4:fresh",
      "p[style-name='Title'] => h1.title:fresh",
      "p[style-name='Subtitle'] => h2.subtitle:fresh",
      "p[style-name='Quote'] => blockquote:fresh",
      "p[style-name='Intense Quote'] => blockquote.intense:fresh"
    ],
    convertImage: mammoth.images.imgElement((image) => {
      return image.read("base64").then((imageBuffer) => {
        return {
          src: "data:" + image.contentType + ";base64," + imageBuffer
        };
      });
    })
  } as any);
  
  const html = result.value;
  const plainText = stripHtml(html);
  
  // Parsear HTML em seções estruturadas
  const sections = parseHtmlToSections(html);
  
  // Calcular metadados
  const metadata = {
    hasImages: /<img/i.test(html),
    hasTables: /<table/i.test(html),
    hasLinks: /<a/i.test(html),
    wordCount: plainText.split(/\s+/).filter(w => w.length > 0).length,
    paragraphCount: sections.filter(s => s.type === 'paragraph').length
  };
  
  return {
    content: plainText,
    html,
    sections,
    metadata
  };
}

/**
 * Converte seções processadas em JSON para armazenamento
 */
export function sectionsToJson(sections: ProcessedSection[]): string {
  return JSON.stringify(sections);
}

/**
 * Converte JSON em seções processadas
 */
export function jsonToSections(json: string): ProcessedSection[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}
