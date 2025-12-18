# 📝 Fluxo Completo de Upload de Documentos

Este guia explica como o sistema de upload e indexação de documentos funciona no Concierge RH Digital.

## 🔄 Fluxo Automatizado

```
┌─────────────────────────────────────────────────────────────┐
│  1. UPLOAD VIA PAINEL ADMIN                                 │
│     - Usuário envia .docx                                   │
│     - Arquivo salvo no Vercel Blob Storage                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. SINCRONIZAÇÃO AUTOMÁTICA                                │
│     $ npm run convert-docs                                  │
│     - Script conecta ao Vercel Blob                         │
│     - Baixa documentos novos/atualizados                    │
│     - Salva na pasta docs/ local                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. PROCESSAMENTO                                           │
│     - Converte .docx → HTML                                 │
│     - Extrai conteúdo estruturado                           │
│     - Gera keywords para busca                              │
│     - Atribui ícones e cores                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. INDEXAÇÃO                                               │
│     - Atualiza src/database.json                            │
│     - Documento agora está pesquisável                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. DEPLOY                                                  │
│     $ git add src/database.json docs/                       │
│     $ git commit -m "chore: add new document"               │
│     $ git push                                              │
│     - Vercel faz deploy automático                          │
│     - Documento disponível na aplicação                     │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Passo a Passo Rápido

### Para Adicionar um Novo Documento:

1. **Upload via painel admin**
   ```
   https://seu-dominio.vercel.app/admin/login.html
   → Login com senha
   → Selecionar arquivo .docx
   → Enviar
   ```

2. **Processar localmente**
   ```bash
   # No seu ambiente local
   npm run convert-docs
   ```
   
   Saída esperada:
   ```
   🚀 Iniciando conversão de documentos...
   
   ☁️  Buscando documentos do Vercel Blob Storage...
   
      📦 Encontrados X documentos no Blob Storage
      ⬇️  Baixando: NovoDocumento.docx
      ✅ NovoDocumento.docx - baixado com sucesso
   
   📁 Encontrados X documentos:
   
      ⏳ Convertendo: NovoDocumento.docx
      ✅ NovoDocumento.docx → XX seções extraídas
   
   ✨ Conversão concluída!
   📝 X documentos convertidos
   ```

3. **Deploy**
   ```bash
   git add src/database.json docs/
   git commit -m "chore: add NovoDocumento to database"
   git push
   ```

## ⚙️ Configuração Necessária

### Variáveis de Ambiente (.env)

```env
# OBRIGATÓRIO para upload via painel admin
BLOB_READ_WRITE_TOKEN=vercel_blob_token_aqui

# OBRIGATÓRIO para processar documentos localmente
# (mesmo token usado acima)
```

### Como Obter o Token:

1. Acesse https://vercel.com/dashboard/stores
2. Crie um **Blob Storage** (se não existir)
3. Copie o **Read/Write Token**
4. Adicione ao `.env` local E às variáveis do Vercel

## 🔍 Verificação

### Confirmar que o documento está indexado:

1. Abra `src/database.json`
2. Procure pelo ID do documento (ex: `"novo-documento"`)
3. Verifique se há seções extraídas

### Testar a busca:

1. Acesse a aplicação
2. Digite palavras-chave do documento
3. O documento deve aparecer nos resultados

## ❌ Problemas Comuns

### Documento não aparece na busca

**Problema**: Arquivo foi enviado mas não processado

**Solução**:
```bash
# 1. Verificar se o token do Blob está configurado
echo $BLOB_READ_WRITE_TOKEN  # deve mostrar o token

# 2. Rodar o script manualmente
npm run convert-docs

# 3. Verificar se database.json foi atualizado
git status  # deve mostrar src/database.json modificado

# 4. Fazer deploy
git add src/database.json docs/
git commit -m "chore: update database"
git push
```

### Script não baixa documentos do Blob

**Problema**: Token não configurado ou inválido

**Solução**:
1. Verifique se `BLOB_READ_WRITE_TOKEN` está no `.env`
2. Confirme que o token é válido no Vercel Dashboard
3. Tente regenerar o token se necessário

### Erro ao processar documento

**Problema**: Arquivo .docx corrompido ou formato inválido

**Solução**:
1. Abra o documento no Word/LibreOffice
2. Salve novamente como .docx
3. Tente fazer upload novamente

## 🚀 Automação Futura

Em desenvolvimento:
- ✅ Sincronização automática via GitHub Actions
- ✅ Processamento no próprio Vercel (Edge Functions)
- ✅ Webhook para atualizar database automaticamente após upload

Por enquanto, o processo manual garante controle total sobre o conteúdo indexado.
