# 🔍 Como Identificar o Erro de Upload

## ✅ Melhorias Implementadas

Adicionei logs detalhados para identificar exatamente onde está o problema. Agora vamos descobrir o erro!

---

## 🧪 Passo a Passo para Testar

### 1. **Aguarde o Deploy**

Após o push, o Vercel vai fazer deploy automático (leva ~2-3 minutos).

**Verificar deploy:**
- Acesse: https://vercel.com/dmenezes007/concierge-cgrh
- Veja se o último deploy está "Ready" ✅

### 2. **Abra o Painel Admin com Console Aberto**

1. Acesse: `https://seu-dominio.vercel.app/admin/login.html`
2. **ANTES de fazer login**, abra o DevTools:
   - Pressione **F12** (ou Ctrl+Shift+I)
   - Vá na aba **Console**
   - Deixe aberto durante todo o processo

### 3. **Tente Fazer Upload**

1. Faça login no painel
2. Selecione um arquivo .docx (de preferência pequeno, ~1-2 MB)
3. Clique em **Enviar**
4. **OBSERVE o Console**

### 4. **Copie TODAS as Mensagens do Console**

Você verá mensagens como:
```
Enviando arquivo: NomedoArquivo.docx Tamanho: 123456
Response status: 500
Response data: { error: "...", details: "..." }
```

**ME ENVIE TODAS ESSAS MENSAGENS!**

---

## 🎯 Possíveis Erros e Soluções

### ❌ Erro: "BLOB_READ_WRITE_TOKEN não configurado"

**Causa**: Token não está nas variáveis de ambiente do Vercel

**Solução**:
1. Acesse: https://vercel.com/dmenezes007/concierge-cgrh/settings/environment-variables
2. Verifique se `BLOB_READ_WRITE_TOKEN` existe
3. Se não existir, adicione:
   ```
   Name: BLOB_READ_WRITE_TOKEN
   Value: vercel_blob_rw_mu6nkHlfaKHTq65S_WA52XRdM329osw0Kaq4tIgn2R9yFiN
   Environments: ✅ Production ✅ Preview ✅ Development
   ```
4. Salve e faça redeploy

### ❌ Erro: "Request timeout" ou "Network error"

**Causa**: Arquivo muito grande ou conexão lenta

**Solução**:
- Tente com um arquivo menor (< 2 MB)
- Verifique sua conexão com a internet
- Tente novamente

### ❌ Erro: "Não autorizado" ou "401"

**Causa**: Token de sessão expirado

**Solução**:
- Faça logout e login novamente
- Limpe o localStorage: Console → `localStorage.clear()` → F5

### ❌ Erro: "CORS" ou "Access-Control-Allow-Origin"

**Causa**: Problema de CORS na Vercel

**Solução**: Já está configurado nas APIs, mas pode precisar de ajuste

### ❌ Erro: "Function Timeout" ou "504"

**Causa**: Função demorou mais de 10 segundos

**Solução**:
- Tente com arquivo menor
- Pode ser limitação do plano gratuito da Vercel

---

## 📊 Verificar Logs da Vercel

Se o erro persistir, veja os logs do servidor:

```bash
# No terminal
vercel logs --follow
```

Ou acesse:
https://vercel.com/dmenezes007/concierge-cgrh/logs

Procure por linhas com:
- `POST /api/admin/upload`
- `Erro no upload:`
- Qualquer stack trace

---

## 🔧 Teste Local (Alternativa)

Se quiser testar localmente primeiro:

```bash
# No terminal
cd c:\Users\Davison.DESKTOP-7GLJO2G\Documents\concierge-cgrh

# Iniciar servidor local
npm run dev

# Acesse no navegador
http://localhost:5173/admin/login.html
```

**Vantagem**: Você verá os logs diretamente no terminal

---

## 📋 Checklist de Verificação

Antes de fazer upload, verifique:

- [ ] Deploy na Vercel está "Ready" ✅
- [ ] `BLOB_READ_WRITE_TOKEN` está configurado no Vercel
- [ ] Console do navegador está aberto (F12)
- [ ] Arquivo é .docx
- [ ] Arquivo é menor que 10 MB
- [ ] Você está logado no painel

---

## 💬 Me Envie Estas Informações

Quando testar, me envie:

1. **Mensagens do Console** (copie tudo)
2. **Status da resposta** (ex: 500, 400, 200)
3. **Tamanho do arquivo** que tentou enviar
4. **Mensagem de erro** exata que aparece na tela
5. **Screenshot** (se possível)

Com essas informações, posso identificar exatamente o problema e corrigir! 🎯

---

## 🚀 Próximo Teste

Depois que o deploy terminar:

1. ⏰ Aguarde ~2 minutos para o deploy
2. 🔍 Abra o console (F12)
3. 📤 Tente fazer upload
4. 📋 Copie TODAS as mensagens do console
5. 📧 Me envie as mensagens

Vamos resolver isso juntos! 💪
