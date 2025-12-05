import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_FILE = path.join(__dirname, '../src/database.json');

console.log('🔍 Verificando coerência das keywords...\n');

const database = JSON.parse(fs.readFileSync(DATABASE_FILE, 'utf-8'));

database.forEach((doc, index) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 Documento ${index + 1}: ${doc.title}`);
  console.log(`${'='.repeat(80)}`);
  
  console.log(`\n📝 Descrição:\n   ${doc.description}`);
  
  console.log(`\n🏷️  Keywords: ${doc.keywords}`);
  
  // Análise de coerência
  const keywords = doc.keywords.split(' ').filter(k => k.length > 0);
  const titleLower = doc.title.toLowerCase();
  const descriptionLower = doc.description.toLowerCase();
  
  console.log('\n✅ Keywords que aparecem no título ou descrição:');
  const relevant = keywords.filter(kw => 
    titleLower.includes(kw.toLowerCase()) || 
    descriptionLower.includes(kw.toLowerCase())
  );
  relevant.forEach(kw => console.log(`   ✓ ${kw}`));
  
  console.log('\n⚠️  Keywords que NÃO aparecem no título ou descrição:');
  const irrelevant = keywords.filter(kw => 
    !titleLower.includes(kw.toLowerCase()) && 
    !descriptionLower.includes(kw.toLowerCase())
  );
  if (irrelevant.length > 0) {
    irrelevant.forEach(kw => console.log(`   ✗ ${kw}`));
  } else {
    console.log('   (Nenhuma - todas são relevantes!)');
  }
  
  // Estatísticas
  const relevancePercent = ((relevant.length / keywords.length) * 100).toFixed(1);
  console.log(`\n📊 Coerência: ${relevant.length}/${keywords.length} keywords relevantes (${relevancePercent}%)`);
});

console.log(`\n\n${'='.repeat(80)}`);
console.log('✨ Verificação concluída!');
console.log(`${'='.repeat(80)}\n`);
