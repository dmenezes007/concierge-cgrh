# Gerenciamento de Documentos

## ⚠️ Importante: Limitação do Ambiente Vercel

O Vercel possui um sistema de arquivos **read-only** (somente leitura) em produção. Isso significa que:

- ✅ **Funciona**: Download de documentos
- ❌ **Não funciona**: Upload e Delete direto no painel administrativo em produção
- ✅ **Funciona localmente**: Todas as operações funcionam no ambiente local

## 📝 Como Adicionar Novos Documentos

### Método 1: Repositório Git (Recomendado)

1. **Adicione o arquivo localmente**
   ```bash
   # Copie o arquivo .docx para a pasta docs/
   cp "Novo Documento.docx" docs/
   ```

2. **Processe o documento**
   ```bash
   npm run convert-docs
   ```

3. **Faça commit e push**
   ```bash
   git add docs/"Novo Documento.docx"
   git add src/database.json
   git commit -m "docs: Add new document"
   git push origin main
   ```

4. **Aguarde o deploy automático**
   - O Vercel detecta o push e faz deploy automaticamente
   - Em 1-2 minutos o novo documento estará disponível

### Método 2: Interface da Vercel

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Selecione o projeto `concierge-cgrh`
3. Vá em "Storage" → "Blob" (se configurado)
4. Faça upload dos arquivos

## 🗑️ Como Remover Documentos

### Método 1: Repositório Git (Recomendado)

1. **Delete o arquivo localmente**
   ```bash
   # Delete o arquivo da pasta docs/
   rm docs/"Documento Antigo.docx"
   ```

2. **Atualize o banco de dados**
   ```bash
   npm run convert-docs
   ```

3. **Faça commit e push**
   ```bash
   git add -A
   git commit -m "docs: Remove old document"
   git push origin main
   ```

4. **Aguarde o deploy automático**

## 🔄 Alternativa: Usar Vercel Blob Storage

Para permitir upload e delete via painel administrativo, seria necessário implementar **Vercel Blob Storage**:

### Implementação com Vercel Blob

1. **Instalar dependência**
   ```bash
   npm install @vercel/blob
   ```

2. **Configurar no Vercel Dashboard**
   - Acesse "Storage" → "Create Blob Store"
   - Configure as variáveis de ambiente

3. **Atualizar APIs**
   - Modificar `api/admin/upload.ts` para usar `put()` do Blob
   - Modificar `api/admin/download.ts` para usar `get()` do Blob
   - Modificar `api/admin/documents.ts` para listar e deletar do Blob

### Custo do Vercel Blob

- **Free tier**: 500 MB
- **Hobby**: $0.15/GB-month storage + $0.30/GB transfer
- Documentação: https://vercel.com/docs/storage/vercel-blob

## 📊 Workflow Atual (Recomendado)

```
┌─────────────────────────────────────────────────────────────┐
│                    Gerenciamento Local                       │
│                                                              │
│  1. Adicionar/Remover .docx em docs/                       │
│  2. npm run convert-docs                                     │
│  3. git commit + push                                        │
│  4. Vercel faz deploy automático                            │
│                                                              │
│  ✅ Funciona perfeitamente                                   │
│  ✅ Versionamento completo (Git)                             │
│  ✅ Histórico de mudanças                                    │
│  ✅ Sem custo adicional                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Funcionalidades do Painel Admin (Produção)

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Login | ✅ Funciona | Autenticação com senha |
| Listar documentos | ✅ Funciona | Mostra todos os arquivos em docs/ |
| Download | ✅ Funciona | Download via API autenticada |
| Upload | ⚠️ Limitado | Processa mas não salva permanentemente |
| Delete | ⚠️ Limitado | Não funciona (filesystem read-only) |

## 🛠️ Desenvolvimento Local

No ambiente local, **todas as funcionalidades funcionam normalmente**:

```bash
# Rodar localmente
npm run dev

# Acessar
# http://localhost:5173/admin/login.html
```

Em desenvolvimento local:
- ✅ Upload salva em docs/
- ✅ Delete remove de docs/
- ✅ Download funciona
- ✅ Todas as APIs funcionam completamente

## 📞 Suporte

Para dúvidas sobre gerenciamento de documentos:
1. Verifique este documento
2. Consulte o README.md
3. Consulte o ADMIN_README.md
