import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, '../docs/Projeto Concierge Digital PRONTA.xlsx');
const wb = XLSX.readFile(excelPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Colunas disponíveis:', Object.keys(data[0]));
console.log('\nPrimeiros 3 registros:');
console.log(JSON.stringify(data.slice(0, 3), null, 2));
