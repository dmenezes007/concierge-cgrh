# 🔍 Diagnóstico e Correções - Painel Administrativo

## ✅ Correções Realizadas

### 1. **Script convert-docs.js** - CORRIGIDO ✅

**Problema**: Script não estava carregando as variáveis do arquivo `.env`

**Solução**: Adicionado `dotenv` para carregar variáveis de ambiente

**Resultado**:
```
☁️  Buscando documentos do Vercel Blob Storage...
   📦 Encontrados 3 documentos no Blob Storage
   ✅ 3 novos documentos baixados do Blob
```

---

## 🧪 Testes a Realizar

### Teste 1: Upload de Documento

1. Acesse: http://localhost:5173/admin/login.html (ou sua URL em produção)
2. Faça login (senha: `admin123`)
3. Tente fazer upload de um arquivo .docx
4. **Observar**:
   - Mensagem de sucesso/erro
   - Console do navegador (F12 → Console)
   - Erros retornados pela API

**Possíveis problemas**:

#### ❌ Erro: "CORS" ou "Network Error"
**Causa**: Requisição bloqueada por CORS
**Solução**: Já configurado nas APIs, mas pode precisar de ajuste no Vercel

#### ❌ Erro: "413 Payload Too Large"
**Causa**: Arquivo muito grande
**Limite**: 4.5 MB para serverless functions da Vercel
**Solução**: Usar client-side upload (vou implementar se necessário)

#### ❌ Erro: "Blob Storage não configurado"
**Causa**: Token não está nas variáveis de ambiente do Vercel
**Solução**: Adicionar `BLOB_READ_WRITE_TOKEN` no Vercel

### Teste 2: Download de Documento

1. No painel admin, clique no ícone de download
2. **Observar**:
   - Se o download inicia
   - Se recebe um erro
   - Console do navegador

**Possíveis problemas**:

#### ❌ Erro: "404 Not Found"
**Causa**: Arquivo não encontrado no Blob ou filesystem
**Solução**: Verificar se o arquivo realmente existe

#### ❌ Erro: "Não autenticado"
**Causa**: Token de sessão expirado
**Solução**: Fazer login novamente

---

## 🚀 Deploy das Correções

Para que as correções funcionem em produção, você precisa fazer deploy:

```bash
# Commitar as alterações
git add .
git commit -m "fix: add dotenv to load env variables in convert-docs script"
git push origin main
```

---

## 🔧 Configurações Necessárias no Vercel

### Variáveis de Ambiente Obrigatórias:

1. **BLOB_READ_WRITE_TOKEN** ✅ (já configurado localmente)
   - Também precisa estar no Vercel!
   - https://vercel.com/dmenezes007/concierge-cgrh/settings/environment-variables

2. **ADMIN_PASSWORD_HASH** ✅
   - Senha do administrador

### Como Adicionar no Vercel:

1. Acesse: https://vercel.com/dmenezes007/concierge-cgrh/settings/environment-variables

2. Clique em **Add New**

3. Adicione:
   ```
   Name: BLOB_READ_WRITE_TOKEN
   Value: vercel_blob_rw_mu6nkHlfaKHTq65S_WA52XRdM329osw0Kaq4tIgn2R9yFiN
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

4. Clique em **Save**

5. Faça um redeploy (ou o próximo push irá deployar automaticamente)

---

## 📋 Checklist de Verificação

- [x] Script convert-docs carrega `.env` (dotenv instalado)
- [x] Script consegue acessar Blob Storage localmente
- [x] Script baixou documentos do Blob com sucesso
- [ ] `BLOB_READ_WRITE_TOKEN` configurado no Vercel (produção)
- [ ] Testar upload via painel admin em produção
- [ ] Testar download via painel admin em produção
- [ ] Testar listagem de documentos no painel

---

## 🐛 Como Depurar Problemas

### No Painel Admin (Navegador):

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Tente fazer upload/download
4. Veja as mensagens de erro

### Logs da Vercel:

```bash
# Ver logs em tempo real
vercel logs --follow

# Ver logs de uma function específica
vercel logs /api/admin/upload
```

### Testar API Localmente:

```bash
# Rodar servidor de desenvolvimento
npm run dev

# Testar upload (no navegador ou Postman)
POST http://localhost:5173/api/admin/upload
Headers:
  Authorization: Bearer <seu_token>
Body:
  form-data: document = <arquivo.docx>
```

---

## 📊 Status Atual

| Componente | Status | Notas |
|------------|--------|-------|
| Script convert-docs | ✅ Funcionando | Baixou 3 docs do Blob |
| Token local (.env) | ✅ Configurado | vercel_blob_rw_... |
| Token Vercel | ⚠️ Verificar | Precisa estar nas env vars |
| Upload API | ⚠️ Testar | Pode estar OK |
| Download API | ⚠️ Testar | Pode estar OK |
| Painel Admin | ⚠️ Testar | Depende das APIs |

---

## 🆘 Próximos Passos

1. **Faça o commit e push das alterações**
2. **Configure o token no Vercel** (se ainda não estiver)
3. **Teste upload e download** e me informe os erros específicos
4. **Se houver erros**, me envie:
   - Mensagem de erro exata
   - Console do navegador (screenshot)
   - Logs do Vercel (se possível)

Com essas informações, posso fazer ajustes pontuais! 🎯
