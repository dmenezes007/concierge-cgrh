/**
 * Processador Avançado de Documentos DOCX para Node.js
 * Versão para scripts (CommonJS)
 */

const mammoth = require('mammoth');

/**
 * Detecta o tipo de seção baseado no conteúdo e formatação
 */
function detectSectionType(text, style) {
  const textLower = text.toLowerCase();
  
  if (style.includes('Heading') || style.includes('Title')) {
    return 'heading';
  }
  
  if (/^(atenção|importante|nota|dica|observação|cuidado)/i.test(text)) {
    return 'highlight';
  }
  
  if (/@/.test(text) || /\b(tel|telefone|ramal|email|e-mail|contato):/i.test(text)) {
    return 'contact';
  }
  
  if (/^[""]/.test(text) || /^—/.test(text)) {
    return 'blockquote';
  }
  
  if (/^[-_*]{3,}$/.test(text.trim())) {
    return 'divider';
  }
  
  if (/^\d{1,2}[./]\d{1,2}[./]\d{2,4}/.test(text) || /^(passo|etapa|fase)\s+\d+/i.test(text)) {
    return 'timeline';
  }
  
  return 'paragraph';
}

/**
 * Detecta variant de highlight baseado no conteúdo
 */
function detectVariant(text) {
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
function extractLinks(html) {
  const links = [];
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
function stripHtml(html) {
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
function processList(listHtml, ordered) {
  const items = [];
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
 * Converte HTML do Mammoth em seções estruturadas
 */
function parseHtmlToSections(html) {
  const sections = [];
  
  const blockRegex = /<(h[1-6]|p|ul|ol|table|blockquote)[^>]*>(.*?)<\/\1>/gis;
  let match;
  
  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2];
    const text = stripHtml(content);
    
    if (!text.trim()) continue;
    
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
      sections.push({
        type: 'table',
        content: match[0],
        html: match[0]
      });
    } else if (tag === 'blockquote') {
      sections.push({
        type: 'blockquote',
        content: text,
        html: content
      });
    }
  }
  
  return sections;
}

/**
 * Função principal para processar documento DOCX
 */
async function processDocx(buffer) {
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
    ]
  });
  
  const html = result.value;
  const plainText = stripHtml(html);
  const sections = parseHtmlToSections(html);
  
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

module.exports = {
  processDocx,
  sectionsToJson: (sections) => JSON.stringify(sections),
  jsonToSections: (json) => {
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  }
};
