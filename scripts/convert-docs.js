import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import XLSX from 'xlsx';
import { list } from '@vercel/blob';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');
const OUTPUT_FILE = path.join(__dirname, '../src/database.json');
const EXCEL_FILE = path.join(__dirname, '../docs/Projeto Concierge Digital PRONTA.xlsx');

// Mapeamento de ícones por categoria/palavra-chave
const ICON_MAP = {
  'férias': 'calendar',
  'pagamento': 'dollar-sign',
  'frequência': 'clock',
  'capacitação': 'graduation-cap',
  'licenças': 'file-text',
  'aposentadoria': 'home',
  'dados cadastrais': 'user',
  'estágio probatório': 'briefcase',
  'programa': 'target',
  'remoção': 'map-pin',
  'retribuição': 'award',
  'saúde': 'heart',
  'seleção': 'users',
  'sougov': 'monitor',
  'carta': 'book-open'
};

// Mapeamento de cores por categoria
const COLOR_MAP = {
  'férias': { bg: 'blue', text: 'blue' },
  'pagamento': { bg: 'green', text: 'green' },
  'frequência': { bg: 'purple', text: 'purple' },
  'capacitação': { bg: 'indigo', text: 'indigo' },
  'licenças': { bg: 'amber', text: 'amber' },
  'aposentadoria': { bg: 'rose', text: 'rose' },
  'dados cadastrais': { bg: 'slate', text: 'slate' },
  'estágio probatório': { bg: 'cyan', text: 'cyan' },
  'programa': { bg: 'violet', text: 'violet' },
  'remoção': { bg: 'orange', text: 'orange' },
  'retribuição': { bg: 'emerald', text: 'emerald' },
  'saúde': { bg: 'red', text: 'red' },
  'seleção': { bg: 'teal', text: 'teal' },
  'sougov': { bg: 'sky', text: 'sky' },
  'carta': { bg: 'fuchsia', text: 'fuchsia' }
};

function getIconForTitle(title) {
  const lowerTitle = title.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lowerTitle.includes(key)) {
      return icon;
    }
  }
  return 'file-text'; // Ícone padrão
}

function getColorForTitle(title) {
  const lowerTitle = title.toLowerCase();
  for (const [key, color] of Object.entries(COLOR_MAP)) {
    if (lowerTitle.includes(key)) {
      return color;
    }
  }
  return { bg: 'slate', text: 'slate' }; // Cor padrão
}

function extractKeywords(html, title) {
  const $ = cheerio.load(html);
  const text = $.text().toLowerCase();
  
  // Lista de palavras-chave relevantes para RH
  const commonKeywords = [
    'marcação', 'agendamento', 'homologação', 'prazo', 'solicitação',
    'remuneração', 'contracheque', 'salário', 'gratificação', 'auxílio',
    'ponto', 'sisref', 'sougov', 'presença', 'ausência', 'banco de horas',
    'treinamento', 'curso', 'pdp', 'proamb', 'cetec', 'capacitação',
    'licença', 'saúde', 'doença', 'perícia', 'atestado', 'cônjuge',
    'aposentadoria', 'abono', 'permanência', 'voluntária', 'tempo',
    'cadastro', 'atualização', 'dados', 'pessoais', 'perfil',
    'avaliação', 'desempenho', 'probatório', 'estágio',
    'remoção', 'lotação', 'transferência', 'titulação', 'retribuição'
  ];
  
  const foundKeywords = commonKeywords.filter(keyword => 
    text.includes(keyword) || title.toLowerCase().includes(keyword)
  );
  
  return [...new Set(foundKeywords)].slice(0, 10).join(' ');
}

function parseStructuredContent(html) {
  const $ = cheerio.load(html);
  const sections = [];
  
  // Procurar por títulos e parágrafos
  $('h1, h2, h3, h4, p, ul, ol, table, strong').each((i, elem) => {
    const tagName = elem.tagName.toLowerCase();
    const text = $(elem).text().trim();
    
    if (!text) return;
    
    if (tagName.match(/^h[1-4]$/)) {
      sections.push({
        type: 'heading',
        level: parseInt(tagName[1]),
        content: text
      });
    } else if (tagName === 'p') {
      // Detectar se é uma nota importante (texto em negrito ou com palavras-chave)
      const isImportant = $(elem).find('strong').length > 0 || 
                          /atenção|importante|prazo|data limite|obrigatório/i.test(text);
      
      // Extrair links do parágrafo
      const links = [];
      $(elem).find('a').each((j, link) => {
        const href = $(link).attr('href');
        const linkText = $(link).text().trim();
        if (href) {
          links.push({ text: linkText, url: href });
        }
      });
      
      sections.push({
        type: isImportant ? 'highlight' : 'paragraph',
        content: text,
        html: $.html(elem), // Preservar HTML para links
        links: links.length > 0 ? links : undefined
      });
    } else if (tagName === 'ul' || tagName === 'ol') {
      const items = [];
      $(elem).find('li').each((j, li) => {
        const itemText = $(li).text().trim();
        const itemLinks = [];
        
        // Extrair links de cada item da lista
        $(li).find('a').each((k, link) => {
          const href = $(link).attr('href');
          const linkText = $(link).text().trim();
          if (href) {
            itemLinks.push({ text: linkText, url: href });
          }
        });
        
        items.push({
          text: itemText,
          html: $.html(li),
          links: itemLinks.length > 0 ? itemLinks : undefined
        });
      });
      sections.push({
        type: 'list',
        ordered: tagName === 'ol',
        items: items
      });
    } else if (tagName === 'table') {
      sections.push({
        type: 'table',
        content: $.html(elem)
      });
    }
  });
  
  return sections;
}

function generateShortDescription(sections) {
  // Pegar o primeiro parágrafo ou até 150 caracteres
  const firstParagraph = sections.find(s => s.type === 'paragraph');
  if (firstParagraph) {
    const content = firstParagraph.content;
    return content.length > 150 ? content.substring(0, 147) + '...' : content;
  }
  return 'Informações sobre recursos humanos.';
}

// Função para carregar dados da planilha
function loadExcelData() {
  if (!fs.existsSync(EXCEL_FILE)) {
    console.warn('⚠️  Planilha não encontrada, usando descrições automáticas');
    return {};
  }
  
  const workbook = XLSX.readFile(EXCEL_FILE);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  // Criar um mapa de título -> {descrição, link}
  const excelMap = {};
  data.forEach(row => {
    const pagina = row['Pagina'] || row['Página'] || row['pagina'];
    const descricao = row['Descrição'] || row['descricao'] || row['Descricao'];
    const link = row['Link'] || row['link'];
    
    if (pagina) {
      // Normalizar o nome para matching
      const normalizedName = pagina.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      excelMap[normalizedName] = {
        originalName: pagina,
        description: descricao || 'Informações sobre recursos humanos.',
        externalLink: link || '#'
      };
    }
  });
  
  console.log(`📊 Carregados ${Object.keys(excelMap).length} registros da planilha\n`);
  return excelMap;
}

// Função para baixar arquivo de uma URL
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    protocol.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

// Função para buscar documentos do Vercel Blob Storage
async function fetchBlobDocuments() {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!blobToken) {
    console.log('⚠️  BLOB_READ_WRITE_TOKEN não configurado - buscando apenas arquivos locais\n');
    return [];
  }

  try {
    console.log('☁️  Buscando documentos do Vercel Blob Storage...\n');
    
    // Listar todos os blobs no prefixo 'docs/'
    const { blobs } = await list({
      prefix: 'docs/',
      token: blobToken
    });

    // Filtrar apenas arquivos .docx
    const docxBlobs = blobs.filter(blob => 
      blob.pathname.endsWith('.docx') && 
      !blob.pathname.includes('~$') // Ignorar arquivos temporários
    );

    console.log(`   📦 Encontrados ${docxBlobs.length} documentos no Blob Storage\n`);

    // Baixar cada documento para a pasta docs/ temporariamente
    const tempDir = path.join(__dirname, '../docs');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const downloadedFiles = [];
    
    for (const blob of docxBlobs) {
      const filename = path.basename(blob.pathname);
      const localPath = path.join(tempDir, filename);
      
      // Verificar se já existe localmente (evitar download duplicado)
      if (fs.existsSync(localPath)) {
        const localStats = fs.statSync(localPath);
        const blobDate = new Date(blob.uploadedAt);
        const localDate = new Date(localStats.mtime);
        
        // Se o arquivo local é mais recente ou igual, pular download
        if (localDate >= blobDate) {
          console.log(`   ⏭️  ${filename} - já existe localmente (atualizado)`);
          continue;
        }
      }
      
      try {
        console.log(`   ⬇️  Baixando: ${filename}`);
        await downloadFile(blob.url, localPath);
        downloadedFiles.push(filename);
        console.log(`   ✅ ${filename} - baixado com sucesso`);
      } catch (error) {
        console.error(`   ❌ Erro ao baixar ${filename}:`, error.message);
      }
    }

    if (downloadedFiles.length > 0) {
      console.log(`\n   ✨ ${downloadedFiles.length} novos documentos baixados do Blob\n`);
    } else {
      console.log(`\n   ℹ️  Nenhum novo documento para baixar\n`);
    }

    return downloadedFiles;
  } catch (error) {
    console.error('❌ Erro ao buscar documentos do Blob:', error.message);
    return [];
  }
}

async function convertDocxToJson(docxPath, excelData = {}) {
  try {
    const result = await mammoth.convertToHtml({ path: docxPath });
    const html = result.value;
    
    const fileName = path.basename(docxPath, '.docx');
    const id = fileName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, '-');
    
    const sections = parseStructuredContent(html);
    const keywords = extractKeywords(html, fileName);
    const icon = getIconForTitle(fileName);
    const color = getColorForTitle(fileName);
    
    // Normalizar nome do arquivo para buscar na planilha
    const normalizedFileName = fileName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Mapeamento manual para casos especiais
    const manualMapping = {
      'selecao interna e externa': 'selecao interna/externa'
    };
    
    const searchName = manualMapping[normalizedFileName] || normalizedFileName;
    
    // Buscar por correspondência exata ou parcial
    let excelInfo = excelData[searchName];
    
    // Se não encontrou, tentar buscar por substring (ex: "Programa de Gestão" em "Programa de Gestão e Desempenho")
    if (!excelInfo) {
      const matchingKey = Object.keys(excelData).find(key => 
        searchName.includes(key) || key.includes(searchName) ||
        searchName.replace(/\//g, ' ').includes(key) || // Tentar substituir / por espaço
        key.replace(/\//g, ' ').includes(searchName)
      );
      if (matchingKey) {
        excelInfo = excelData[matchingKey];
      }
    }
    
    const description = excelInfo?.description || generateShortDescription(sections);
    const externalLink = excelInfo?.externalLink || '#';
    
    // Log de matching para debug
    if (excelInfo) {
      console.log(`   ✅ ${fileName} → Planilha encontrada: "${excelInfo.originalName}"`);
    } else {
      console.log(`   ⚠️  ${fileName} → Sem match na planilha, usando descrição automática`);
    }
    
    return {
      id,
      title: fileName,
      keywords,
      description,
      icon,
      color,
      sections,
      externalLink,
      lastModified: fs.statSync(docxPath).mtime.toISOString()
    };
  } catch (error) {
    console.error(`Erro ao processar ${docxPath}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Iniciando conversão de documentos...\n');
  
  // Carregar dados da planilha Excel
  const excelData = loadExcelData();
  
  // Buscar e baixar documentos do Vercel Blob Storage
  await fetchBlobDocuments();
  
  // Verificar se a pasta docs existe
  if (!fs.existsSync(DOCS_DIR)) {
    console.error('❌ Pasta docs/ não encontrada!');
    process.exit(1);
  }
  
  // Listar todos os arquivos .docx
  const files = fs.readdirSync(DOCS_DIR)
    .filter(file => file.endsWith('.docx') && !file.startsWith('~$')); // Ignorar arquivos temporários
  
  if (files.length === 0) {
    console.log('⚠️  Nenhum arquivo .docx encontrado na pasta docs/');
    process.exit(0);
  }
  
  console.log(`📁 Encontrados ${files.length} documentos:\n`);
  
  const database = [];
  
  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file);
    console.log(`   ⏳ Convertendo: ${file}`);
    
    const data = await convertDocxToJson(filePath, excelData);
    if (data) {
      database.push(data);
      console.log(`   ✅ ${file} → ${data.sections.length} seções extraídas`);
    }
  }
  
  // Criar pasta src se não existir
  const srcDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }
  
  // Salvar o JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2), 'utf-8');
  
  console.log(`\n✨ Conversão concluída!`);
  console.log(`📝 ${database.length} documentos convertidos`);
  console.log(`💾 Arquivo gerado: ${OUTPUT_FILE}`);
  console.log(`📦 Tamanho: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB\n`);
}

main().catch(console.error);
