# 🚀 Guia de Ativação - Indexação Automática de Documentos

## 📋 O Que Mudou?

✅ **ANTES:** Upload → Manual: npm run convert-docs → commit → push  
✅ **AGORA:** Upload → ✨ Indexação Automática → Busca Instantânea!

## 🎯 Arquivos Criados/Modificados

### Novos Arquivos
- `api/process-document.ts` - Processa .docx automaticamente
- `api/search.ts` - Nova API de busca usando Vercel KV
- `scripts/migrate-to-kv.js` - Migra documentos existentes
- `GUIA-ATIVACAO-AUTOMATICA.md` - Este arquivo

### Arquivos Modificados
- `api/admin/upload.ts` - Agora chama processamento automático
- `App.tsx` - Usa nova API de busca (híbrida: KV + fallback local)
- `admin/dashboard.tsx` - Removida mensagem de indexação manual
- `package.json` - Adicionado script `migrate-to-kv`

## 🔧 Passo a Passo de Ativação

### 1️⃣ Configurar Vercel KV (5 minutos)

#### Criar Database KV
1. Acesse https://vercel.com/dashboard
2. Clique em **Storage**
3. Clique em **Create Database**
4. Escolha **KV (Redis)**
5. Nome sugerido: `concierge-docs`
6. Clique em **Create**

#### Conectar ao Projeto
7. Na página do KV, clique em **Connect Project**
8. Selecione `concierge-cgrh`
9. Clique em **Connect**
10. As variáveis serão adicionadas automaticamente

#### Verificar Configuração
11. Vá em **Settings** → **Environment Variables**
12. Confirme que existem:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 2️⃣ Baixar Variáveis Localmente (para migração)

```bash
# Instalar Vercel CLI (se não tiver)
npm install -g vercel

# Login no Vercel
vercel login

# Vincular projeto
vercel link

# Baixar variáveis de ambiente
vercel env pull .env.local
```

**Importante:** Copie as variáveis `KV_*` do `.env.local` para o `.env` para usar no script de migração.

### 3️⃣ Migrar Documentos Existentes

```bash
# Executar migração
npm run migrate-to-kv
```

Isso irá:
- Ler os 17 documentos do `database.json`
- Salvá-los no Vercel KV
- Criar índices de busca para cada documento
- Mostrar progresso em tempo real

**Output esperado:**
```
✅ Sucesso: 17 documentos
❌ Erros: 0 documentos
📚 Total: 17 documentos
```

### 4️⃣ Fazer Commit e Deploy

```bash
# Adicionar arquivos
git add .

# Commit
git commit -m "feat: implement automatic document indexing with Vercel KV

- Add automatic document processing on upload
- Create KV-based search API with local fallback
- Add migration script for existing documents
- Update admin dashboard to reflect automatic indexing
- Documents now searchable immediately after upload"

# Push
git push origin main
```

O Vercel fará deploy automático (~2-3 minutos).

## ✅ Testar o Sistema

### Teste 1: Busca de Documentos Existentes
1. Acesse o concierge-cgrh
2. Busque por "aposentadoria"
3. Deve retornar resultados instantaneamente

### Teste 2: Upload de Novo Documento
1. Acesse `/admin` (login: admin123)
2. Faça upload de um arquivo .docx
3. Aguarde mensagem: "✅ Documento enviado e indexado automaticamente!"
4. Faça uma busca pelo título do documento
5. Deve aparecer imediatamente nos resultados

### Teste 3: Verificar Fallback
1. Se o KV estiver inacessível, o sistema usa `database.json` automaticamente
2. Não haverá interrupção do serviço

## 🔍 Troubleshooting

### Problema: Migração falha com erro de autenticação
**Solução:** Verifique se copiou as variáveis `KV_*` do `.env.local` para `.env`

### Problema: Upload não indexa automaticamente
**Solução:** Verifique se as variáveis KV estão configuradas no Vercel:
```bash
vercel env ls
```

### Problema: Busca não retorna documentos do KV
**Solução:** Verifique os logs da API:
```bash
vercel logs --follow
```

### Problema: "KV not configured"
**Solução:** 
1. Verifique se o database KV foi criado e conectado ao projeto
2. Faça novo deploy: `git commit --allow-empty -m "redeploy" && git push`

## 📊 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────┐
│                   UPLOAD FLOW                        │
└─────────────────────────────────────────────────────┘

Admin Dashboard
       │
       ▼
Upload .docx → Vercel Blob Storage
       │
       ▼
api/admin/upload.ts → POST api/process-document
       │
       ▼
Download from Blob → Process with mammoth
       │
       ▼
Extract: title, keywords, content, sections
       │
       ▼
Save to Vercel KV:
  - doc:{id} → document data
  - docs:all → list of IDs
  - search:{word} → document IDs
       │
       ▼
✅ Document indexed and searchable!


┌─────────────────────────────────────────────────────┐
│                   SEARCH FLOW                        │
└─────────────────────────────────────────────────────┘

User types query in search box
       │
       ▼
App.tsx → GET api/search?q={query}
       │
       ▼
api/search.ts:
  1. Normalize query → extract words
  2. Search KV: search:{word} → get doc IDs
  3. Fetch documents: doc:{id}
  4. Calculate relevance score
  5. Sort by score
       │
       ▼
Return results to frontend
       │
       ▼
Display in UI (with fallback to database.json)
```

## 🎉 Benefícios

- ✅ **Zero operação manual** após upload
- ✅ **Busca instantânea** (sem rebuild/deploy)
- ✅ **Escalável** (Redis suporta milhares de docs)
- ✅ **Resiliente** (fallback automático para database.json)
- ✅ **Gratuito** (Vercel KV free tier: 256 MB, 30K ops/dia)

## 📞 Suporte

Se tiver problemas:
1. Confira logs: `vercel logs`
2. Verifique variáveis: `vercel env ls`
3. Re-migre documentos: `npm run migrate-to-kv`
4. Faça redeploy: `git push --force`

---

**Desenvolvido com ❤️ para automatizar o Concierge CGRH**
