<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🤖 Concierge RH Digital - CGRH/INPI

Sistema inteligente de busca e gerenciamento de documentos de Recursos Humanos, com painel administrativo para upload e processamento de documentos.

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- Conta Vercel (para deploy)

### Instalação

```bash
# Clonar repositório
git clone https://github.com/dmenezes007/concierge-cgrh.git
cd concierge-cgrh

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves

# Rodar localmente
npm run dev
```

Acesse:
- **App principal**: http://localhost:3000
- **Painel admin**: http://localhost:3000/admin/login.html

## 📚 Documentação

### 🔧 Configuração e Gestão
- **[ADMIN_README.md](ADMIN_README.md)** - Guia completo do painel administrativo
- **[WORKFLOW_DOCUMENTOS.md](WORKFLOW_DOCUMENTOS.md)** - Fluxo completo de upload e indexação

### 🗄️ Vercel Blob Storage
- **[GUIA-TOKEN-BLOB.md](GUIA-TOKEN-BLOB.md)** - 🎯 **COMECE AQUI** - Guia rápido para obter o token
- **[VERCEL-BLOB-SETUP.md](VERCEL-BLOB-SETUP.md)** - Configuração detalhada do Blob Storage
- **[UPLOAD-MANUAL.md](UPLOAD-MANUAL.md)** - Alternativa: Upload sem Blob Storage

### 📊 Integração
- **[VERCEL-KV-SETUP.md](VERCEL-KV-SETUP.md)** - Configuração do Vercel KV (Redis)
- **[GERENCIAMENTO_DOCUMENTOS.md](GERENCIAMENTO_DOCUMENTOS.md)** - Gestão avançada

## 🎯 Como Adicionar um Novo Documento

### Opção 1: Via Painel Admin (Recomendado)

1. Configure o Blob Storage seguindo [GUIA-TOKEN-BLOB.md](GUIA-TOKEN-BLOB.md)
2. Acesse `/admin/login.html` (senha padrão: `admin123`)
3. Faça upload do arquivo .docx
4. Execute localmente: `npm run convert-docs`
5. Commit e push das alterações

### Opção 2: Upload Manual (Sem Blob)

1. Adicione o arquivo .docx na pasta `docs/`
2. Execute: `npm run convert-docs`
3. Commit e push
4. Pronto! ✅

Veja detalhes em [UPLOAD-MANUAL.md](UPLOAD-MANUAL.md)

## 🔐 Segurança

- Senhas hasheadas com bcrypt
- Autenticação via tokens
- Validação server-side
- CORS configurado

**⚠️ IMPORTANTE**: Altere a senha padrão antes do deploy em produção!

## 🛠️ Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run convert-docs # Processar documentos .docx → database.json
```

## 📦 Deploy

### Via Vercel (Recomendado)

```bash
# Conectar ao Vercel
vercel

# Deploy
git push origin main  # Deploy automático via GitHub
```

Configurar variáveis de ambiente no Vercel:
- `ADMIN_PASSWORD_HASH` - Senha do admin
- `BLOB_READ_WRITE_TOKEN` - Token do Blob Storage (opcional)
- `KV_REST_API_URL` e `KV_REST_API_TOKEN` - Redis (opcional)

## 🗂️ Estrutura do Projeto

```
concierge-cgrh/
├── admin/              # Painel administrativo
│   ├── login.html
│   ├── dashboard.html
│   └── *.tsx
├── api/                # Endpoints serverless
│   ├── admin/
│   └── ratings.ts
├── components/         # Componentes React
├── docs/              # Documentos .docx (fonte)
├── scripts/           # Scripts de processamento
│   └── convert-docs.js
├── src/
│   ├── database.json  # Database de documentos processados
│   └── index.css
└── App.tsx            # Aplicação principal
```

## 🌟 Funcionalidades

- ✅ Busca inteligente em documentos RH
- ✅ Painel administrativo para gestão
- ✅ Upload de documentos .docx
- ✅ Processamento automático de conteúdo
- ✅ Sistema de ratings
- ✅ Interface responsiva
- ✅ Sincronização com Vercel Blob Storage

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Add nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário da CGRH/INPI.

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação na pasta raiz
2. Abra uma issue no GitHub
3. Contate o administrador do sistema
