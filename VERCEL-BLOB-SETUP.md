# 🗄️ Configuração do Vercel Blob Storage - Guia Detalhado

## 🎯 O que é o Vercel Blob Storage?

O Vercel Blob Storage é um serviço de armazenamento de arquivos que permite fazer upload, download e deletar arquivos diretamente em produção, resolvendo a limitação do sistema de arquivos read-only da Vercel.

## 📋 Pré-requisitos

- Conta Vercel (gratuita ou paga)
- Projeto `concierge-cgrh` deployado na Vercel
- Acesso ao Dashboard da Vercel

---

## 🚀 PASSO A PASSO COMPLETO

### 📍 Passo 1: Acessar a Área de Storage

**Opção 1 - Via Projeto:**
1. Acesse https://vercel.com/dashboard
2. Clique no projeto **concierge-cgrh**
3. No topo da página, procure pela aba **Storage** (entre Deployments e Settings)

**Opção 2 - Via Menu Stores (RECOMENDADO):**
1. Acesse https://vercel.com/dashboard/stores
2. Você verá todos os seus storages (KV, Postgres, Blob, etc.)

### 📦 Passo 2: Criar ou Acessar Blob Storage

#### Se AINDA NÃO tem Blob Storage:

1. Na página Storage/Stores, clique no botão **Create Database** (azul, canto superior direito)
   
2. Você verá várias opções:
   - **Postgres** (banco de dados)
   - **KV** (Redis)
   - **Blob** ← **SELECIONE ESTA**
   - Edge Config
   
3. Clique em **Blob**

4. Configure:
   - **Name**: `concierge-blob` ou `docs-storage` (qualquer nome)
   - Clique em **Create**

5. **IMPORTANTE**: Na próxima tela, você verá:
   ```
   ✅ Blob created successfully
   
   Connect to a project to get started
   ```

6. Clique em **Connect Project** ou **Connect to Project**

7. Na lista, marque o checkbox ao lado de **concierge-cgrh**

8. Clique em **Connect**

#### Se JÁ tem Blob Storage:

1. Na página https://vercel.com/dashboard/stores
2. Procure por um item com ícone 📦 ou tipo "Blob"
3. Clique no nome dele para abrir

### 🔑 Passo 3: OBTER O TOKEN (AQUI ESTÁ!)

Depois de criar/abrir o Blob Storage:

1. Você estará na página de detalhes do Blob Storage
   
2. Procure pela seção **.env.local** ou **Quickstart** ou **Environment Variables**
   - Geralmente está logo abaixo do título do Blob

3. Você verá um box com código, algo assim:
   ```bash
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxx"
   ```

4. À direita deste box, há um botão **Copy Snippet** ou ícone 📋
   - Clique para copiar TODO o conteúdo

5. **OU** você pode ver o token em:
   - Aba **Settings** (⚙️) → **Tokens**
   - Procure por "Read/Write Token"
   - Clique no ícone 👁️ (olho) para revelar
   - Clique no ícone 📋 (copiar)

### 💾 Passo 4: Adicionar o Token ao Projeto

#### A) No Vercel (Variáveis de Ambiente da Aplicação)

1. Volte para o projeto: https://vercel.com/dmenezes007/concierge-cgrh

2. Clique em **Settings** (menu superior)

3. No menu lateral, clique em **Environment Variables**

4. Procure se JÁ existe `BLOB_READ_WRITE_TOKEN`
   - Se existir, você pode pular esta parte (já está configurado!)
   - Se NÃO existir, continue:

5. Clique em **Add New** (ou **New Variable**)

6. Preencha:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Cole o token completo (vercel_blob_rw_...)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development (marque todos)

7. Clique em **Save**

#### B) No Arquivo Local (.env)

1. Abra o projeto no VS Code

2. Abra o arquivo `.env` na raiz

3. Procure pela linha:
   ```env
   BLOB_READ_WRITE_TOKEN=
   ```

4. Cole o token:
   ```env
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_seu_token_completo_aqui
   ```

5. Salve o arquivo (Ctrl+S)

⚠️ **NUNCA commite o arquivo .env no Git!**

### 🔄 Passo 5: Redeploy (se necessário)

Se você adicionou/alterou a variável `BLOB_READ_WRITE_TOKEN` no Vercel:

```bash
# Trigger redeploy via GitHub
git commit --allow-empty -m "trigger redeploy"
git push origin main

# OU: Redeploy manual no Dashboard da Vercel
# Vá em Deployments → ⋯ → Redeploy
```

---

## ✅ TESTAR SE ESTÁ FUNCIONANDO

### Teste 1: Verificar Token no Vercel

1. Acesse: https://vercel.com/dmenezes007/concierge-cgrh/settings/environment-variables
2. Procure por `BLOB_READ_WRITE_TOKEN`
3. Se aparecer, está configurado! ✅

### Teste 2: Upload via Painel Admin

1. Acesse: `https://seu-dominio.vercel.app/admin/login.html`
2. Faça login (senha padrão: `admin123`)
3. Tente fazer upload de um arquivo .docx
4. Se aparecer "✅ Documento enviado com sucesso!", funciona!

### Teste 3: Sincronização Local

No terminal (PowerShell) do projeto:

```powershell
# Verificar se o token está no ambiente
$env:BLOB_READ_WRITE_TOKEN

# Se aparecer o token (vercel_blob_rw_...), está OK!
# Se aparecer vazio, adicione manualmente:
$env:BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_seu_token_aqui"

# Testar o script
npm run convert-docs
```

**✅ Saída esperada com token configurado:**
```
🚀 Iniciando conversão de documentos...

☁️  Buscando documentos do Vercel Blob Storage...

   📦 Encontrados X documentos no Blob Storage
   ⬇️  Baixando: documento.docx
   ✅ documento.docx - baixado com sucesso
```

**❌ Saída se token NÃO estiver configurado:**
```
⚠️  BLOB_READ_WRITE_TOKEN não configurado - buscando apenas arquivos locais
```

---

## 🆘 RESOLUÇÃO DE PROBLEMAS

### "Não encontro o Storage no menu"

**Solução:**
- Tente acessar diretamente: https://vercel.com/dashboard/stores
- Ou procure por "Stores" no menu lateral (pode ter nome diferente)

### "Não vejo o token/código para copiar"

**Solução:**
1. Na página do Blob Storage, procure por estas seções:
   - **Quickstart**
   - **.env.local**
   - **Getting Started**
   - **Environment Variables**

2. Se não encontrar, tente:
   - Aba **Settings** → campo "Token"
   - Aba **Connect** → código de exemplo

3. **ALTERNATIVA**: Verificar nas variáveis do projeto
   - Se o Blob está conectado ao projeto, o token JÁ está lá!
   - Acesse: Settings → Environment Variables
   - Procure `BLOB_READ_WRITE_TOKEN`
   - Clique no ícone 👁️ para revelar
   - Clique no ícone 📋 para copiar

### "Token não funciona no script local"

**PowerShell - Configuração Permanente:**

```powershell
# Editar arquivo .env
notepad .env

# Adicionar linha:
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_seu_token_aqui

# Salvar e fechar

# Reabrir terminal ou recarregar:
# (não é necessário no PowerShell, o Node lerá do .env)
```

### "Upload funciona mas script não baixa"

**Problema**: Token no Vercel OK, mas não está no `.env` local

**Solução:**
1. Copie o token do Vercel
2. Cole no arquivo `.env` local
3. Rode novamente: `npm run convert-docs`

---

## 💰 Custos

### Tier Gratuito (Hobby)
- ✅ **500 MB de storage** gratuito
- ✅ Upload/download ilimitados no free tier
- ✅ Perfeito para documentos .docx

### Tier Pago (Pro)
- **$0.15/GB-month** de armazenamento
- **$0.30/GB** de transferência
- Para 15 documentos (~2-3 MB cada) = ~45 MB
- Custo estimado: **$0.01/mês** (praticamente gratuito)

**📊 Estimativa para seu caso:**
- 15 documentos .docx (~50 MB total)
- Custo mensal: **~$0.01 USD**
- Totalmente dentro do free tier! ✅

## 🔧 Como Funciona Agora

### Upload
```
1. Usuário faz upload no painel admin
2. Arquivo é enviado para Vercel Blob Storage
3. Arquivo fica disponível via URL pública
4. ✅ Funciona em produção!
```

### Delete
```
1. Usuário clica em delete no painel admin
2. Arquivo é removido do Blob Storage
3. ✅ Funciona em produção!
```

### Download
```
1. Usuário clica em download
2. Sistema busca no Blob Storage primeiro
3. Se não encontrar, busca em docs/ (Git)
4. ✅ Funciona para ambos!
```

### Listar Documentos
```
1. Sistema lista arquivos do Blob Storage
2. Sistema lista arquivos de docs/ (Git)
3. Combina ambos e remove duplicatas
4. ✅ Mostra todos os documentos!
```

## 📝 Observações Importantes

### Documentos em Dois Locais

Agora você tem documentos em dois lugares:

1. **Blob Storage** (Vercel)
   - Arquivos enviados via painel admin
   - Podem ser deletados pelo painel
   - Não aparecem no sistema de busca automaticamente
   
2. **Git Repository** (docs/)
   - Arquivos commitados no repositório
   - Aparecem no sistema de busca
   - Não podem ser deletados pelo painel

### Para Incluir Documentos do Blob no Sistema de Busca

Se você fizer upload via painel e quiser que o documento apareça no sistema de busca:

1. Baixe o documento do Blob
2. Adicione na pasta `docs/` localmente
3. Execute `npm run convert-docs`
4. Faça commit e push

## ✅ Checklist de Configuração

- [ ] Criar Blob Store na Vercel
- [ ] Conectar ao projeto concierge-cgrh
- [ ] Verificar variável BLOB_READ_WRITE_TOKEN
- [ ] Fazer redeploy do projeto
- [ ] Testar upload no painel admin
- [ ] Testar delete no painel admin
- [ ] Testar download

## 🆘 Troubleshooting

### Erro: "Missing BLOB_READ_WRITE_TOKEN"

**Solução:**
1. Verifique se criou o Blob Store
2. Verifique se conectou ao projeto
3. Verifique a variável de ambiente
4. Faça redeploy

### Upload não funciona

**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Verifique o console do navegador (F12)
3. Verifique os logs da Vercel
4. Confirme que fez redeploy após configurar

### Delete retorna erro 403

**Possíveis causas:**
1. Documento está no Git (docs/), não no Blob
   - Solução: Delete do repositório localmente
2. Token não configurado
   - Solução: Verifique BLOB_READ_WRITE_TOKEN

## 📚 Documentação Oficial

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Blob API Reference](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)
- [Pricing](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing)

## 🎉 Pronto!

Após seguir estes passos, seu painel administrativo estará totalmente funcional com:

✅ Upload de documentos  
✅ Delete de documentos  
✅ Download de documentos  
✅ Listagem de todos os documentos  

Tudo funcionando em produção! 🚀
