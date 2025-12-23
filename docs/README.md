# Pasta docs/

## 🎯 Propósito

Esta pasta contém apenas arquivos auxiliares do projeto (planilhas Excel, etc.).

## ☁️ Documentos .docx

Os documentos `.docx` **NÃO** são mais armazenados localmente nesta pasta. Eles são gerenciados através de:

1. **Vercel Blob Storage** - Armazenamento de arquivos na nuvem
2. **Redis (Vercel KV)** - Indexação e busca de documentos

## 📤 Como gerenciar documentos

### Upload
1. Acesse o painel administrativo: `/admin/`
2. Faça login com as credenciais de administrador
3. Use o botão "Upload" para enviar novos documentos `.docx`
4. O sistema automaticamente:
   - Faz upload para o Blob Storage
   - Indexa todas as palavras no Redis
   - Torna o documento disponível na busca

### Delete
1. No painel administrativo, clique no botão de lixeira ao lado do documento
2. Confirme a deleção
3. O sistema automaticamente:
   - Remove do Blob Storage
   - Remove índices do Redis
   - Remove o documento da interface

### Busca
Os usuários podem buscar documentos na interface principal. A busca procura por:
- Título do documento
- **TODAS** as palavras do conteúdo (não apenas keywords)
- Descrição (até 2000 caracteres)

## 🔧 Scripts úteis

```bash
# Verificar sincronização entre local, Blob e Redis
npm run check-sync

# Re-indexar todos os documentos do Blob
npm run reindex

# Fazer upload de arquivo específico
node scripts/upload-file.js "Nome do Arquivo.docx"
```

## 📊 Estado Atual

✅ **17 documentos** indexados e disponíveis
✅ Sistema 100% cloud-based
✅ Sem dependência de arquivos locais

---

**Última atualização**: 23 de dezembro de 2025
