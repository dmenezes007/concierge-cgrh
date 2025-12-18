# 🎯 GUIA RÁPIDO: Onde Encontrar o Token do Blob

## 🚀 Método 1: Via Página do Blob Storage (MAIS FÁCIL)

### Passo a Passo:

1. **Acesse**: https://vercel.com/dashboard/stores

2. **Procure** por um Blob Storage existente (ícone 📦)
   - OU clique em **Create Database** → **Blob** para criar um novo

3. **Clique** no nome do Blob Storage para abrir

4. Na página que abrir, procure por uma seção com código:
   
   ```bash
   # Você verá algo assim:
   
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_A1b2C3d4E5..."
   ```
   
5. **À DIREITA** deste código, há um botão **"Copy Snippet"** 📋
   - Clique para copiar

6. **Pronto!** Cole no arquivo `.env`:
   ```env
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_A1b2C3d4E5...
   ```

---

## 🎯 Método 2: Via Environment Variables do Projeto (SE O BLOB JÁ ESTÁ CONECTADO)

### Passo a Passo:

1. **Acesse o projeto**:
   ```
   https://vercel.com/dmenezes007/concierge-cgrh/settings/environment-variables
   ```

2. **Procure** na lista de variáveis por:
   ```
   BLOB_READ_WRITE_TOKEN
   ```

3. Se encontrar:
   - Clique no **ícone do olho 👁️** para revelar o valor
   - Clique no **ícone de copiar 📋** para copiar

4. **Cole** no seu arquivo `.env` local

---

## 🆕 Método 3: Criar Novo Blob Storage (SE NÃO TEM NENHUM)

### Passo a Passo Completo:

1. **Acesse**: https://vercel.com/dashboard/stores

2. **Clique** no botão azul **"Create Database"** (canto superior direito)

3. Na lista de opções, **selecione**:
   ```
   📦 Blob
   ```

4. **Dê um nome**: `concierge-blob` (ou qualquer nome)

5. **Clique** em **"Create"**

6. **IMPORTANTE**: Na próxima tela, você verá:
   
   ```
   ✅ Blob created successfully
   
   Connect to a project
   ```

7. **Marque** o checkbox do projeto **concierge-cgrh**

8. **Clique** em **"Connect"**

9. **AGORA SIM**: Na página que abrir, você verá o código com o token:
   
   ```bash
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
   ```
   
10. **Copie** clicando no botão à direita

---

## 📸 Visual - Onde Procurar:

### Na Página do Blob Storage:

```
┌─────────────────────────────────────────────────┐
│  [Vercel Logo]  concierge-blob                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Getting Started                                │
│                                                 │
│  ┌───────────────────────────────────────┐     │
│  │  .env.local                           │     │
│  │                                       │     │
│  │  BLOB_READ_WRITE_TOKEN=              │📋   │ ← AQUI!
│  │    "vercel_blob_rw_A1b2C3..."        │     │
│  │                                       │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│  [Tabs: Overview | Settings | Projects]        │
└─────────────────────────────────────────────────┘
```

### Nas Variáveis de Ambiente:

```
┌─────────────────────────────────────────────────┐
│  Settings → Environment Variables               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ADMIN_PASSWORD_HASH    ●●●●●●●●●●    👁️ 📋     │
│  BLOB_READ_WRITE_TOKEN  ●●●●●●●●●●    👁️ 📋  ← AQUI!
│  KV_REST_API_URL        ●●●●●●●●●●    👁️ 📋     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST

- [ ] Acessei https://vercel.com/dashboard/stores
- [ ] Criei ou abri um Blob Storage
- [ ] Conectei ao projeto `concierge-cgrh` (se novo)
- [ ] Copiei o token `BLOB_READ_WRITE_TOKEN`
- [ ] Colei no arquivo `.env` local
- [ ] Testei: `npm run convert-docs`

---

## 💡 DICAS

### Se você NÃO VER o token na página do Blob:

1. **Verifique se está conectado ao projeto**:
   - Aba **Projects** → Deve aparecer `concierge-cgrh`
   - Se não aparecer, clique em **Connect** e selecione o projeto

2. **Tente a aba "Settings"**:
   - Pode ter uma seção "Tokens" ou "API Keys"

3. **Use o Método 2**:
   - Vá direto nas variáveis de ambiente do projeto
   - Se o Blob está conectado, o token ESTÁ lá

### Token começa com:

```
vercel_blob_rw_...
```

Se seu token **NÃO** começa assim, não é o token correto!

---

## 🆘 Ainda com Dúvidas?

**ALTERNATIVA TEMPORÁRIA** (enquanto não consegue o token):

Você pode fazer upload **manual** dos documentos:

1. Coloque os arquivos .docx na pasta `docs/` localmente
2. Execute: `npm run convert-docs`
3. Faça commit e push
4. Pronto! Os documentos estarão disponíveis

A única diferença é que você precisará fazer upload manual dos arquivos em vez de usar o painel admin, mas o sistema funcionará normalmente.

---

## 📞 Contato

Se nada funcionar, me envie:
- Print da tela da página do Blob Storage
- Print da tela de Environment Variables
- Mensagem de erro ao rodar `npm run convert-docs`

Assim posso ajudar mais especificamente!
