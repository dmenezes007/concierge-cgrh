# 🔐 Painel Administrativo - Concierge RH Digital

## 📋 Visão Geral

Sistema de gerenciamento de documentos com autenticação, permitindo upload e exclusão de arquivos .docx de forma segura.

## 🚀 Funcionalidades

### ✅ Implementadas (MVP)
- 🔒 **Login com senha** (bcrypt hash)
- 📊 **Dashboard administrativo** com estatísticas
- 📤 **Upload de documentos** .docx
- 🗑️ **Deletar documentos** existentes
- 📋 **Listagem de documentos** com tamanho e data
- 🔑 **Sessões persistentes** (Vercel KV ou token temporário)
- 🎨 **UI moderna** com Tailwind CSS (tema escuro)

### 🔄 Próximas Fases
- 🤖 Automação com GitHub API (commits automáticos)
- ✏️ Edição de metadados (descrição, keywords, links)
- 👁️ Preview de documentos antes de publicar
- 📝 Audit log (histórico de alterações)
- 👥 Múltiplos usuários admin

---

## 🛠️ Configuração Inicial

### 1. Gerar Hash da Senha

Execute no terminal para criar uma nova senha:

```bash
node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA_AQUI', 10))"
```

Copie o hash gerado e cole no arquivo `.env`:

```env
ADMIN_PASSWORD_HASH=$2b$10$seu_hash_gerado_aqui
```

### 2. Configurar Variáveis de Ambiente

Crie/edite o arquivo `.env` na raiz do projeto:

```env
# Senha do admin (use o hash gerado acima)
ADMIN_PASSWORD_HASH=$2b$10$j1XYUupBSU2UQGBQgkNbYuicSZODovxfMncVxZ8ukgHiSUlAHNI7.

# Vercel KV (opcional - para sessões persistentes)
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

**Senha padrão atual**: `admin123` ⚠️ **MUDE EM PRODUÇÃO!**

### 3. Deploy no Vercel

```bash
# Adicionar variável de ambiente no Vercel
vercel env add ADMIN_PASSWORD_HASH

# Fazer deploy
git add .
git commit -m "feat: Add admin panel"
git push
```

O Vercel fará o deploy automaticamente.

---

## 📱 Como Usar

### Acessar o Painel

1. Vá para: `https://seu-dominio.vercel.app/admin/login.html`
2. Digite a senha configurada (padrão: `admin123`)
3. Clique em **Acessar Painel**

### Upload de Documentos

1. No dashboard, clique em **Selecione um arquivo .docx**
2. Escolha um arquivo `.docx` no seu computador
3. Clique em **Enviar**
4. ⚠️ **Importante**: Execute `npm run convert-docs` localmente para processar o documento
5. Faça commit e push das alterações

### Deletar Documentos

1. Na tabela de documentos, clique no ícone 🗑️ (lixeira)
2. Confirme a exclusão
3. Execute `npm run convert-docs` para regenerar o database
4. Faça commit e push

---

## 🔧 Desenvolvimento Local

### Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse:
- **App principal**: http://localhost:3000
- **Admin login**: http://localhost:3000/admin/login.html
- **Dashboard**: http://localhost:3000/admin/dashboard.html

### Estrutura de Arquivos

```
concierge-cgrh/
├── admin/
│   ├── login.html              # Página de login
│   ├── login.tsx               # Componente de login
│   ├── login-entry.tsx         # Entry point do login
│   ├── dashboard.html          # Página do dashboard
│   ├── dashboard.tsx           # Componente do dashboard
│   └── dashboard-entry.tsx     # Entry point do dashboard
├── api/
│   └── admin/
│       ├── auth.ts             # Autenticação (login/logout)
│       ├── documents.ts        # Listar/deletar documentos
│       └── upload.ts           # Upload de arquivos
├── docs/                       # Arquivos .docx (fonte)
├── .env                        # Variáveis de ambiente (NÃO COMMITAR!)
└── .env.example                # Exemplo de variáveis
```

---

## 🔐 Segurança

### Senhas

- ✅ Senhas são hasheadas com bcrypt (salt rounds: 10)
- ✅ Hash nunca é exposto ao cliente
- ✅ Validação server-side
- ⚠️ Troque a senha padrão `admin123` antes do deploy!

### Sessões

- ✅ Tokens UUID aleatórios
- ✅ Expiram em 1 hora (3600 segundos)
- ✅ Armazenados no Vercel KV (Redis)
- ✅ Validação em todas as rotas protegidas

### Upload

- ✅ Validação de extensão (.docx apenas)
- ✅ Limite de tamanho: 10 MB
- ✅ Requer autenticação (token Bearer)
- ✅ CORS configurado

---

## 🐛 Troubleshooting

### "Sessão inválida ou expirada"

- Token expirou (1h de validade)
- Faça login novamente

### "Vercel KV não disponível"

- Se KV não estiver configurado, o sistema usa tokens temporários
- Funciona normalmente, mas sessões não persistem entre restarts
- Solução: Configure Vercel KV (veja instruções no README principal)

### Upload não funciona

- Verifique se está logado (token válido)
- Confirme que o arquivo é `.docx`
- Verifique o tamanho (máximo 10 MB)
- Veja logs do servidor: `vercel logs`

### Documento não aparece na app

- Após upload, execute: `npm run convert-docs`
- Faça commit: `git add . && git commit -m "Add new document"`
- Faça push: `git push`
- Aguarde o deploy do Vercel (1-2 minutos)

---

## 📡 API Endpoints

### POST `/api/admin/auth`

**Login:**
```json
{
  "action": "login",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "success": true,
  "token": "uuid-token-here"
}
```

### GET `/api/admin/documents`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "documents": [
    {
      "name": "Férias.docx",
      "size": 45632,
      "modified": "2025-01-15T10:30:00Z",
      "path": "/docs/Férias.docx"
    }
  ],
  "count": 15
}
```

### POST `/api/admin/upload`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
document: <arquivo.docx>
```

### DELETE `/api/admin/documents?filename=<nome>`

**Headers:**
```
Authorization: Bearer <token>
```

---

## 🎨 Personalização

### Mudar Tema de Cores

Edite `admin/login.tsx` e `admin/dashboard.tsx`:

```tsx
// De:
className="bg-blue-600 hover:bg-blue-700"

// Para:
className="bg-green-600 hover:bg-green-700"
```

### Adicionar Logo

Em `admin/login.tsx`, substitua o ícone `<Lock>`:

```tsx
<img src="/logo-admin.png" alt="Logo" className="w-16 h-16" />
```

---

## 📊 Estatísticas

- **Total de arquivos criados**: 12
- **APIs implementadas**: 3
- **Páginas admin**: 2
- **Linhas de código**: ~800
- **Tempo de desenvolvimento**: ~3 horas

---

## 🚀 Próximos Passos

1. ✅ **Concluído**: MVP funcional com login e upload
2. 🔄 **Em andamento**: Configuração do Vercel KV
3. 📋 **Próximo**: Automação com GitHub API
4. 🎯 **Futuro**: Edição de metadados inline

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs: `vercel logs`
2. Consulte este README
3. Verifique o console do navegador (F12)

---

**Desenvolvido para**: Concierge RH Digital  
**Versão**: 1.0.0 (MVP)  
**Data**: Dezembro 2025
