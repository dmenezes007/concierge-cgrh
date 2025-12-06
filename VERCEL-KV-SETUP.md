# Configuração Vercel KV para Sistema de Avaliações

## 📋 Pré-requisitos
- Projeto hospedado na Vercel
- Conta Vercel (gratuita)

## 🚀 Passo a Passo

### 1. Criar Database Vercel KV

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Vá em **Storage** → **Create Database**
3. Escolha **KV (Redis)**
4. Dê um nome (ex: `concierge-ratings`)
5. Clique em **Create**

### 2. Conectar ao Projeto

1. Na página do KV Database, clique em **Connect Project**
2. Selecione o projeto `concierge-cgrh`
3. Clique em **Connect**
4. As variáveis de ambiente serão adicionadas automaticamente

### 3. Verificar Variáveis de Ambiente

No projeto Vercel, vá em **Settings** → **Environment Variables**

Você deve ver:
```
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
```

### 4. Desenvolvimento Local (Opcional)

Para testar localmente:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Vincular projeto
vercel link

# Baixar variáveis de ambiente
vercel env pull .env.local
```

### 5. Instalar Dependências

```bash
npm install
```

### 6. Deploy

```bash
# Commit e push
git add .
git commit -m "feat: Implementar avaliações com Vercel KV"
git push

# Ou deploy direto
vercel --prod
```

## 🧪 Testando

### Testar API Local
```bash
# Iniciar dev server
npm run dev

# Testar POST
curl -X POST http://localhost:5173/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc1","rating":5}'

# Testar GET
curl http://localhost:5173/api/ratings?documentId=doc1
```

### Testar em Produção
```bash
# POST
curl -X POST https://concierge-cgrh.vercel.app/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc1","rating":5}'

# GET
curl https://concierge-cgrh.vercel.app/api/ratings?documentId=doc1
```

## 📊 Estrutura de Dados Redis

```
Key: ratings:{documentId}
Type: List
Values: [5, 4, 5, 3, 4]
```

Exemplo:
```
ratings:ferias-servidor → [5, 4, 5, 5, 3]
ratings:licencas → [4, 3, 5]
```

## 🔒 Segurança

- ✅ CORS configurado para aceitar qualquer origem
- ✅ Validação de rating (1-5)
- ✅ Tokens em variáveis de ambiente
- ⚠️ Considere adicionar rate limiting em produção

## 💰 Limites Gratuitos Vercel KV

- ✅ 256 MB storage
- ✅ 30K comandos/dia
- ✅ Sem limite de projetos

Para o Concierge RH:
- ~15 documentos
- ~100 avaliações/documento = 1500 ratings
- Cada rating = ~10 bytes
- **Total: ~15 KB** (sobra muito espaço!)

## 🆘 Troubleshooting

### Erro 500 na API
- Verifique se as variáveis de ambiente estão configuradas
- Rode `vercel env pull` para atualizar .env.local

### Dados não persistem
- Certifique-se que o projeto está conectado ao KV Database
- Verifique logs: `vercel logs`

### CORS Error
- API já está configurada com CORS aberto
- Se persistir, adicione domínio específico em `res.setHeader('Access-Control-Allow-Origin', 'seu-dominio.com')`

## 📚 Referências

- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- [Redis Commands](https://redis.io/commands)
- [@vercel/kv SDK](https://github.com/vercel/storage/tree/main/packages/kv)
