# 🔄 Alternativa: Upload Manual de Documentos (Sem Blob Storage)

Se você não conseguir configurar o Vercel Blob Storage ou preferir um método mais simples, pode continuar usando upload manual de documentos. O sistema funcionará perfeitamente!

## 📋 Como Funciona

Ao invés de fazer upload pelo painel administrativo, você adicionará os documentos diretamente na pasta `docs/` e fará commit no Git.

## 🚀 Passo a Passo

### 1. Preparar o Documento

1. Tenha seu documento em formato **.docx**
2. Nomeie de forma descritiva (ex: `Pagamento de Férias.docx`)

### 2. Adicionar à Pasta docs/

```bash
# No terminal, na raiz do projeto
cd c:\Users\Davison.DESKTOP-7GLJO2G\Documents\concierge-cgrh

# Copiar o documento para a pasta docs/
# Opção 1: Via Windows Explorer
# - Abra a pasta docs/
# - Cole o arquivo .docx lá

# Opção 2: Via PowerShell
Copy-Item "C:\caminho\do\seu\documento.docx" -Destination ".\docs\"
```

### 3. Processar o Documento

```bash
# Executar o script de conversão
npm run convert-docs
```

**Saída esperada:**
```
🚀 Iniciando conversão de documentos...

⚠️  BLOB_READ_WRITE_TOKEN não configurado - buscando apenas arquivos locais

📁 Encontrados 17 documentos:

   ⏳ Convertendo: SeuNovoDocumento.docx
   ✅ SeuNovoDocumento.docx → 25 seções extraídas

✨ Conversão concluída!
📝 17 documentos convertidos
💾 Arquivo gerado: src/database.json
```

### 4. Fazer Commit e Deploy

```bash
# Adicionar os arquivos modificados
git add docs/ src/database.json

# Fazer commit
git commit -m "docs: add SeuNovoDocumento"

# Enviar para o GitHub
git push origin main
```

### 5. Verificar no Site

Aguarde alguns segundos para o Vercel fazer o deploy automático, depois:

1. Acesse seu site
2. Pesquise por palavras-chave do documento
3. O documento deve aparecer nos resultados! ✅

## 🗑️ Deletar um Documento

### 1. Remover o Arquivo

```bash
# Via PowerShell
Remove-Item ".\docs\DocumentoParaDeletar.docx"

# OU via Windows Explorer
# - Abra a pasta docs/
# - Delete o arquivo
```

### 2. Reprocessar

```bash
npm run convert-docs
```

### 3. Commit e Deploy

```bash
git add docs/ src/database.json
git commit -m "docs: remove DocumentoParaDeletar"
git push origin main
```

## ✏️ Atualizar um Documento

### 1. Substituir o Arquivo

```bash
# Sobrescrever o arquivo antigo com o novo
Copy-Item "C:\caminho\do\documento-atualizado.docx" -Destination ".\docs\documento.docx" -Force
```

### 2. Reprocessar

```bash
npm run convert-docs
```

### 3. Commit e Deploy

```bash
git add docs/ src/database.json
git commit -m "docs: update documento com novas informações"
git push origin main
```

## 🎯 Vantagens desta Abordagem

### ✅ Prós:
- **Simples**: Não precisa configurar Blob Storage
- **Gratuito**: Sem custos adicionais
- **Controle total**: Você vê exatamente o que está sendo deployado
- **Histórico**: Git mantém versões anteriores dos documentos
- **Funciona offline**: Pode trabalhar sem internet

### ❌ Contras:
- **Manual**: Precisa fazer git add/commit/push para cada mudança
- **Tamanho do repo**: Documentos ficam no repositório Git
- **Sem painel admin**: Não pode usar a interface web para upload

## 📊 Comparação: Manual vs Blob Storage

| Recurso | Upload Manual | Blob Storage |
|---------|--------------|--------------|
| **Upload via painel admin** | ❌ Não | ✅ Sim |
| **Processamento automático** | ❌ Manual | ⚠️ Manual (por enquanto) |
| **Armazenamento** | Git (GitHub) | Vercel Blob |
| **Limite de tamanho** | 100 MB/repo | 500 MB (free tier) |
| **Histórico de versões** | ✅ Git | ❌ Não |
| **Custo** | ✅ Grátis | ✅ Grátis (tier gratuito) |
| **Deploy** | Git push | Git push (database) |
| **Complexidade** | 🟢 Baixa | 🟡 Média |

## 🔮 Recomendação

### Use **Upload Manual** se:
- Você atualiza documentos raramente (1-2 vezes por mês)
- Prefere simplicidade
- Já está familiarizado com Git
- Quer manter histórico completo no Git

### Use **Blob Storage** se:
- Precisa que outros usuários façam upload (sem acesso ao Git)
- Atualiza documentos frequentemente
- Quer interface visual para gestão
- Prefere separar código de conteúdo

## 💡 Nossa Recomendação para Você

Baseado no seu caso:

**Comece com Upload Manual!**

Por quê?
1. ✅ Você já tem controle do Git
2. ✅ Funciona imediatamente (sem configuração)
3. ✅ Documentos não mudam com frequência
4. ✅ Você é o único administrador

**Migre para Blob Storage depois se:**
- Quiser interface web para outros usuários
- Precisar de uploads mais frequentes
- Quiser automação futura (webhooks, etc.)

## 🚀 Começar Agora

Adicione seu primeiro documento manualmente:

```bash
# 1. Entre na pasta do projeto
cd c:\Users\Davison.DESKTOP-7GLJO2G\Documents\concierge-cgrh

# 2. Copie um documento de teste
Copy-Item "C:\caminho\do\seu\teste.docx" -Destination ".\docs\"

# 3. Processe
npm run convert-docs

# 4. Veja o resultado
# Abra: src/database.json e procure pelo documento

# 5. Se estiver OK, faça deploy
git add docs/ src/database.json
git commit -m "docs: add documento de teste"
git push origin main
```

## ❓ Dúvidas?

**P: Posso misturar os dois métodos?**
R: Sim! Documentos na pasta `docs/` e documentos no Blob funcionam juntos.

**P: O que acontece se eu configurar o Blob depois?**
R: Os documentos locais continuarão funcionando normalmente. Basta adicionar o token.

**P: Preciso apagar o painel admin?**
R: Não! Deixe lá. Quando configurar o Blob, ele passará a funcionar automaticamente.

**P: O script funciona sem o Blob configurado?**
R: ✅ Sim! Ele detecta automaticamente e busca apenas arquivos locais.

## 📞 Precisa de Ajuda?

Se tiver qualquer problema com o upload manual, me avise! É um método simples e confiável.
