import XLSX from 'xlsx';

const wb = XLSX.readFile('docs/Projeto Concierge Digital PRONTA.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('=== ANÁLISE DA PLANILHA ===\n');
console.log('Colunas:', Object.keys(data[0]));
console.log('Total registros:', data.length);
console.log('\n=== PRIMEIROS 3 REGISTROS ===\n');

data.slice(0, 3).forEach((row, i) => {
  console.log(`\n📄 Registro ${i + 1}:`);
  console.log(JSON.stringify(row, null, 2));
});

console.log('\n=== TODOS OS NOMES DE PÁGINA ===\n');
data.forEach((row, i) => {
  const pagina = row['Pagina'] || row['Página'] || row['pagina'];
  const desc = row['Descrição'] || row['descricao'] || row['Descricao'];
  const link = row['Link'] || row['link'];
  
  console.log(`${i + 1}. "${pagina}"`);
  console.log(`   Descrição: ${desc ? desc.substring(0, 50) + '...' : 'NÃO DEFINIDA'}`);
  console.log(`   Link: ${link || 'NÃO DEFINIDO'}\n`);
});
