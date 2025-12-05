# 🎯 Concierge RH Digital - Integração com Documentos

## ✨ O que mudou?

A aplicação agora **lê automaticamente** os arquivos `.docx` da pasta `docs/` e os converte para uma interface moderna com:

- 🎨 **Ícones coloridos** por categoria
- 📦 **Cards estilizados** com design moderno
- 🔍 **Busca aprimorada** em todo o conteúdo
- 🎭 **Destaques automáticos** (alertas, prazos, listas)
- 📅 **Data de última modificação**
- 🚀 **Build automatizado**

## 🏗️ Arquitetura

```
docs/*.docx  →  Script de Conversão  →  database.json  →  React App
```

### Fluxo de Atualização

1. **Edite** o documento `.docx` na pasta `docs/`
2. **Commit** as mudanças
3. **Push** para o GitHub
4. **Deploy automático** (Vercel/Netlify)
   - Script `convert-docs.js` roda automaticamente antes do build
   - Converte todos os `.docx` para JSON
   - Build do Vite gera app otimizado

## 📁 Estrutura de Arquivos

```
concierge-cgrh/
├── docs/                          # 📄 Documentos Word (.docx)
│   ├── Férias.docx
│   ├── Pagamento.docx
│   └── ...
├── scripts/
│   └── convert-docs.js            # 🔄 Script de conversão
├── components/
│   ├── Card.tsx                   # 🃏 Componente de card
│   └── ContentRenderer.tsx        # 🎨 Renderizador de conteúdo
├── src/
│   ├── database.json              # 📊 Dados gerados (auto-gerado)
│   └── index.css
└── App.tsx                        # 🖥️ Aplicação principal
```

## 🎨 Funcionalidades da UI

### Cards com Ícones Dinâmicos
Cada documento recebe automaticamente:
- Ícone apropriado (calendar, dollar-sign, clock, etc.)
- Cor temática (blue, green, purple, etc.)
- Badge de categoria

### Renderização Inteligente
O `ContentRenderer` detecta e estiliza:

- **📋 Títulos** (h1, h2, h3, h4)
- **📝 Parágrafos** normais
- **⚠️ Destaques** (atenção, importante, prazo)
- **📃 Listas** (ordenadas e não-ordenadas)
- **📊 Tabelas**

### Alertas Automáticos
Palavras-chave detectadas:
- 🟦 **Info**: padrão
- 🟨 **Warning**: "atenção", "cuidado", "importante"
- 🟥 **Deadline**: "prazo", "data limite"
- 🟩 **Success**: "aprovado", "concluído"

## 🚀 Comandos

```bash
# Converter documentos manualmente
npm run convert-docs

# Desenvolvimento (não precisa converter manualmente)
npm run dev

# Build (converte automaticamente antes de buildar)
npm run build
```

## 📝 Como Adicionar Novo Documento

1. Salve o arquivo `.docx` na pasta `docs/`
2. O script detectará automaticamente no próximo build
3. Nenhuma alteração de código necessária! 🎉

## 🎯 Mapeamento de Ícones

| Palavra-chave | Ícone | Cor |
|---------------|-------|-----|
| férias | calendar | blue |
| pagamento | dollar-sign | green |
| frequência | clock | purple |
| capacitação | graduation-cap | indigo |
| licenças | file-text | amber |
| aposentadoria | home | rose |
| dados | user | slate |
| estágio | briefcase | cyan |
| programa | target | violet |
| remoção | map-pin | orange |
| retribuição | award | emerald |
| saúde | heart | red |
| seleção | users | teal |
| sougov | monitor | sky |

## 📊 Estatísticas Atuais

- **15 documentos** convertidos
- **594 seções** estruturadas
- **~169 KB** de dados JSON
- **Busca em 100%** do conteúdo

## 🔧 Tecnologias Utilizadas

- `mammoth` - Conversão de .docx para HTML
- `cheerio` - Parsing e estruturação de HTML
- `lucide-react` - Biblioteca de ícones
- `tailwindcss` - Estilização
- `vite` - Build tool

## 💡 Dicas para Editores

### Formatação nos Documentos Word

Para melhor renderização, use no Word:

- **Títulos**: Use estilos H1, H2, H3
- **Destaques**: Use negrito para informações importantes
- **Listas**: Use listas numeradas ou com marcadores
- **Tabelas**: Serão preservadas

### Palavras-chave para Alertas

Para criar destaques coloridos automaticamente, use palavras como:
- "Atenção:", "Importante:", "Cuidado:"
- "Prazo:", "Data limite:", "Encerramento:"
- "Aprovado", "Concluído", "Sucesso"

## 🎉 Resultado

A aplicação agora é:
- ✅ **Autônoma** - RH atualiza documentos sem código
- ✅ **Escalável** - Novos documentos = apenas salvar arquivo
- ✅ **Moderna** - Interface rica e responsiva
- ✅ **Manutenível** - Conteúdo separado do código
- ✅ **Buscável** - Busca em todo o texto dos documentos
