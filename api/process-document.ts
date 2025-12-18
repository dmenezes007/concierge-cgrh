import { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import mammoth from 'mammoth';

interface DocumentData {
  id: string;
  title: string;
  keywords: string;
  description: string;
  content: string;
  sections: any[];
  createdAt: string;
  blobUrl?: string;
}

// Função auxiliar para extrair texto de seções
function extractText(sections: any[]): string {
  return sections
    .map(section => {
      if (section.type === 'paragraph' || section.type === 'heading') {
        return section.content || '';
      }
      if (section.type === 'list') {
        return section.items?.map((item: any) => item.text || '').join(' ') || '';
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

// Função para gerar ID a partir do título
function generateId(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blobUrl, filename } = req.body;

    if (!blobUrl) {
      return res.status(400).json({ error: 'blobUrl é obrigatório' });
    }

    console.log('🔄 Processando documento:', filename || blobUrl);

    // 1. Baixar o arquivo do Blob Storage
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Falha ao baixar arquivo: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Converter .docx para HTML com mammoth
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;

    // 3. Processar HTML e extrair estrutura
    const sections = parseHtmlToSections(html);
    
    // 4. Gerar metadados
    const title = extractTitle(sections) || filename?.replace('.docx', '') || 'Documento sem título';
    const id = generateId(title);
    const content = extractText(sections);
    const keywords = generateKeywords(content);
    const description = generateDescription(content);

    const documentData: DocumentData = {
      id,
      title,
      keywords,
      description,
      content,
      sections,
      createdAt: new Date().toISOString(),
      blobUrl
    };

    // 5. Salvar no Vercel KV
    await kv.hset(`doc:${id}`, documentData);
    
    // 6. Adicionar à lista de documentos
    await kv.sadd('docs:all', id);

    // 7. Indexar para busca (criar índices de palavras-chave)
    const words = keywords.split(' ').filter(w => w.length > 3);
    for (const word of words) {
      await kv.sadd(`search:${word.toLowerCase()}`, id);
    }

    console.log('✅ Documento processado e indexado:', id);

    return res.status(200).json({
      success: true,
      document: {
        id,
        title,
        description
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar documento:', error);
    return res.status(500).json({
      error: 'Erro ao processar documento',
      details: error.message
    });
  }
}

// Função para extrair título (primeiro heading ou primeira linha)
function extractTitle(sections: any[]): string {
  const heading = sections.find(s => s.type === 'heading');
  if (heading) return heading.content;
  
  const firstParagraph = sections.find(s => s.type === 'paragraph');
  if (firstParagraph) {
    const content = firstParagraph.content;
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }
  
  return '';
}

// Função para gerar keywords
function generateKeywords(content: string): string {
  const words = content
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  // Contar frequência
  const freq: Record<string, number> = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  
  // Pegar top 20 palavras
  const topWords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
  
  return topWords.join(' ');
}

// Função para gerar descrição
function generateDescription(content: string): string {
  const firstSentence = content.split(/[.!?]/)[0];
  return firstSentence.length > 200 
    ? firstSentence.substring(0, 200) + '...'
    : firstSentence;
}

// Função para processar HTML em seções
function parseHtmlToSections(html: string): any[] {
  const sections: any[] = [];
  const lines = html.split(/\r?\n/).filter(l => l.trim());

  lines.forEach(line => {
    // Heading
    if (line.match(/<h[1-6]>/)) {
      const level = parseInt(line.match(/<h([1-6])>/)?.[1] || '1');
      const content = line.replace(/<\/?h[1-6]>/g, '').trim();
      sections.push({ type: 'heading', level, content });
    }
    // Lista
    else if (line.includes('<li>')) {
      const text = line.replace(/<\/?li>/g, '').replace(/<[^>]+>/g, '').trim();
      if (text) {
        const lastSection = sections[sections.length - 1];
        if (lastSection?.type === 'list') {
          lastSection.items.push({ text, html: line });
        } else {
          sections.push({
            type: 'list',
            ordered: line.includes('<ol>'),
            items: [{ text, html: line }]
          });
        }
      }
    }
    // Parágrafo
    else if (line.match(/<p>/)) {
      const content = line.replace(/<\/?p>/g, '').replace(/<[^>]+>/g, '').trim();
      if (content) {
        sections.push({ type: 'paragraph', content });
      }
    }
  });

  return sections;
}
