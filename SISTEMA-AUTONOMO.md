# 🤖 Sistema Autônomo - Concierge RH Digital

## 📋 Visão Geral

O Concierge RH Digital é um sistema **100% autônomo** e **cloud-native**, projetado para funcionar sem intervenção manual no gerenciamento de arquivos.

## ✅ Funcionalidades Autônomas

### 1. **Upload Automático** 📤
- Interface web para upload de documentos .docx
- Indexação automática no Redis (todas as palavras do conteúdo)
- Armazenamento automático no Vercel Blob Storage
- Limite: 50MB por arquivo

### 2. **Busca Inteligente** 🔍
- Busca em tempo real via Redis
- Procura por TODAS as palavras do documento (não apenas keywords)
- Resultados com até 2000 caracteres de descrição
- Fallback para database.json local

### 3. **Tracking Automático** 📊
- Visualizações contadas automaticamente ao abrir documento
- Avaliações salvas no Redis
- Estatísticas exibidas no painel admin

### 4. **Delete Inteligente** 🗑️
- Remove do Redis (dados + índices de busca)
- Remove do Blob Storage (arquivo físico)
- Validação de token antes de deletar
- Logs detalhados de cada etapa

### 5. **Health Check & Auto-Limpeza** 🏥
- **Endpoint**: `/api/health-check`
- **Função**: Detecta arquivos órfãos (no Blob mas não no Redis)
- **Limpeza Automática**: `/api/health-check?cleanup=true`

## 🔧 Como Usar o Sistema Autônomo

### **Verificar Consistência**

1. Acesse o painel admin: `https://seu-dominio.vercel.app/admin/`
2. Clique no botão **"Health Check"** no canto superior direito
3. Veja o relatório:
   - 📊 Documentos no Redis
   - ☁️ Arquivos no Blob Storage
   - 🗑️ Arquivos órfãos detectados

### **Limpar Arquivos Órfãos**

1. No painel admin, clique em **"Limpar Órfãos"**
2. Confirme a ação
3. Sistema automaticamente:
   - Identifica arquivos no Blob que não estão no Redis
   - Deleta esses arquivos do Blob Storage
   - Atualiza a lista de documentos

### **Via API (Automação)**

```bash
# Verificar consistência
curl https://seu-dominio.vercel.app/api/health-check

# Limpar automaticamente
curl https://seu-dominio.vercel.app/api/health-check?cleanup=true
```

## 🐛 Solução de Problemas

### **Problema: Documento deletado volta a aparecer**

**Causa**: Arquivo não foi deletado do Blob Storage (token inválido ou erro)

**Solução**:
1. Clique em **"Health Check"** no painel admin
2. Se houver órfãos, clique em **"Limpar Órfãos"**
3. Sistema deletará automaticamente

**Verificação Manual**:
```bash
# Ver logs detalhados no console do navegador (F12)
# Procure por:
# ✅ Arquivo deletado do Blob Storage com sucesso
# ❌ ERRO CRÍTICO ao deletar arquivo do Blob
```

### **Problema: Token do Blob inválido**

**Sintoma**: Delete retorna erro 500 com mensagem sobre token

**Solução**:
1. Acesse https://vercel.com/dashboard
2. Vá em: Projeto → Settings → Environment Variables
3. Verifique se `BLOB_READ_WRITE_TOKEN` está configurado
4. Copie o token de: Storage → Blob → Token

## 🔄 Fluxo de Sincronização

```
┌────────────────────────────────────────────────────────────┐
│                    UPLOAD DE DOCUMENTO                      │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  1. Upload para Blob Storage │
            └──────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  2. Processar conteúdo DOCX  │
            └──────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  3. Indexar TODAS as palavras│
            │     no Redis                 │
            └──────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  4. Salvar metadata no Redis │
            │     (blobUrl, views, etc)    │
            └──────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                   DELETE DE DOCUMENTO                       │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  1. Buscar doc no Redis      │
            └──────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  2. Deletar do Blob Storage  │
            │     (arquivo físico)         │
            └──────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  3. Remover índices de busca │
            │     no Redis                 │
            └──────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  4. Deletar metadata Redis   │
            └──────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                      HEALTH CHECK                           │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  1. Listar docs do Redis     │
            └──────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  2. Listar arquivos do Blob  │
            └──────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  3. Comparar IDs             │
            │     (Redis vs Blob)          │
            └──────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  4. Identificar órfãos       │
            │     (no Blob, não no Redis)  │
            └──────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  5. Deletar órfãos (cleanup) │
            └──────────────────────────────┘
```

## 🚀 Automação com Cron Jobs (Opcional)

Para garantir limpeza automática periódica, adicione um cron job:

### **Opção 1: Vercel Cron (Recomendado)**

Criar `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/health-check?cleanup=true",
      "schedule": "0 3 * * *"
    }
  ]
}
```
*Executa limpeza todo dia às 3h da manhã*

### **Opção 2: GitHub Actions**

Criar `.github/workflows/cleanup.yml`:
```yaml
name: Cleanup Orphan Files

on:
  schedule:
    - cron: '0 3 * * *' # 3h da manhã
  workflow_dispatch: # Permite execução manual

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Health Check & Cleanup
        run: |
          curl -X GET "https://seu-dominio.vercel.app/api/health-check?cleanup=true"
```

### **Opção 3: Serviço Externo (cron-job.org)**

1. Acesse https://cron-job.org
2. Criar novo job
3. URL: `https://seu-dominio.vercel.app/api/health-check?cleanup=true`
4. Agendamento: Diário às 3h

## 📊 Monitoramento

### **Logs no Vercel**

Acesse: https://vercel.com/dashboard → Seu projeto → Logs

Procure por:
- `✅ Arquivo deletado do Blob Storage com sucesso`
- `❌ ERRO CRÍTICO ao deletar arquivo do Blob`
- `🗑️ Documento deletado do Redis mas ainda no Blob`
- `🧹 Iniciando limpeza automática...`

### **Console do Navegador (F12)**

No painel admin, abra o console e veja:
- Resposta da API de delete
- Status code (200 = sucesso, 500 = erro)
- Detalhes do erro (se houver)

## ✅ Checklist de Funcionamento Correto

- [ ] Upload de documento aparece imediatamente na busca
- [ ] Delete remove documento da lista
- [ ] Health Check retorna "Sistema está sincronizado"
- [ ] Visualizações são incrementadas ao abrir documento
- [ ] Avaliações são salvas e exibidas
- [ ] Documentos deletados NÃO reaparecem após reload

## 🆘 Contato e Suporte

Se você encontrar problemas que o health check não resolve:

1. Verifique os logs do Vercel
2. Execute `npm run check-sync` localmente
3. Verifique variáveis de ambiente:
   - `BLOB_READ_WRITE_TOKEN`
   - `REDIS_URL` ou `KV_REST_API_URL`
4. Teste localmente com `npm run dev` (ou `npx vite`)

---

**Última atualização**: 23 de dezembro de 2025
