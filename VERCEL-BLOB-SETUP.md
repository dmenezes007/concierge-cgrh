# Configuração do Vercel Blob Storage

## 🎯 O que é o Vercel Blob Storage?

O Vercel Blob Storage é um serviço de armazenamento de arquivos que permite fazer upload, download e deletar arquivos diretamente em produção, resolvendo a limitação do sistema de arquivos read-only da Vercel.

## 📋 Pré-requisitos

- Conta Vercel (gratuita ou paga)
- Projeto `concierge-cgrh` deployado na Vercel
- Acesso ao Dashboard da Vercel

## 🚀 Passo a Passo para Configuração

### 1. Criar Blob Store na Vercel

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto: **concierge-cgrh**
3. Vá para a aba **Storage**
4. Clique em **Create Database**
5. Selecione **Blob**
6. Dê um nome: `concierge-docs` (ou qualquer nome)
7. Clique em **Create**

### 2. Conectar ao Projeto

1. Após criar o Blob Store, clique em **Connect to Project**
2. Selecione o projeto **concierge-cgrh**
3. Clique em **Connect**

### 3. Variável de Ambiente Criada Automaticamente

A Vercel criará automaticamente a variável de ambiente:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

✅ **Esta variável já está configurada automaticamente!**

### 4. Verificar Configuração

1. Vá em **Settings** → **Environment Variables**
2. Confirme que existe a variável `BLOB_READ_WRITE_TOKEN`
3. Se não existir, crie manualmente:
   - Nome: `BLOB_READ_WRITE_TOKEN`
   - Valor: (copie do Blob Store criado)
   - Ambientes: Production, Preview, Development

### 5. Fazer Redeploy

Após configurar a variável:

```bash
# Opção 1: Trigger redeploy via GitHub
git commit --allow-empty -m "trigger redeploy"
git push origin main

# Opção 2: Redeploy manual no Dashboard da Vercel
# Vá em Deployments → [...] → Redeploy
```

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
