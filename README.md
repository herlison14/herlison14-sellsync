# SellSync

Hub multichannel ERP para vendedores de marketplace no Brasil.
Concorrente direto do UpSeller, Bling e Tiny — construído com Node.js, TypeScript, Next.js e PostgreSQL.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend API | Fastify 5 + TypeScript |
| Frontend | Next.js 15 + Tailwind CSS |
| Banco de dados | PostgreSQL 16 (Prisma ORM) |
| Cache / Filas | Redis 7 + BullMQ |
| Busca | Meilisearch |
| Integrações | Mercado Livre, Shopee, Amazon (adaptadores isolados) |

## Módulos implementados

- **Auth** — Registro multi-tenant, login, JWT
- **OMS** — Gestão de pedidos unificada (todos os canais)
- **WMS** — Controle de estoque em tempo real, multi-armazém
- **PIM** — Catálogo de produtos, publicação em marketplaces
- **Integrações** — OAuth ML + Shopee, refresh automático de tokens
- **Webhooks** — Recebimento de notificações ML, Shopee, Amazon
- **Workers** — Fila assíncrona: import pedido → reserva estoque → NF-e
- **NF-e** — Estrutura pronta para integrar NFe.io ou TecnoSpeed

## Setup local

### Pré-requisitos
- Node.js 22+
- Docker e Docker Compose

### 1. Clonar e instalar
```bash
git clone https://github.com/herlison14/sellsync.git
cd sellsync
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas credenciais
```

### 3. Subir infraestrutura
```bash
docker compose up -d
# PostgreSQL na porta 5432
# Redis na porta 6379
# Meilisearch na porta 7700
```

### 4. Criar banco de dados
```bash
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

### 5. Rodar em desenvolvimento
```bash
npm run dev
# API:  http://localhost:3001
# Web:  http://localhost:3000
```

## Estrutura do projeto

```
sellsync/
├── apps/
│   ├── api/                    ← Fastify backend
│   │   └── src/
│   │       ├── routes/         ← auth, orders, inventory, products, integrations, webhooks
│   │       ├── services/       ← OrderService, InventoryService
│   │       ├── workers/        ← BullMQ: webhook, inventory-sync, order, nfe
│   │       └── lib/            ← token-refresher
│   └── web/                    ← Next.js 15 frontend
│       └── src/
│           ├── app/dashboard/  ← Dashboard, Orders, Inventory, Integrations pages
│           ├── components/     ← OrdersTable, StockTable, MarketplaceCard, Sidebar
│           └── hooks/          ← use-orders, use-inventory, use-stores
├── packages/
│   ├── database/               ← Prisma schema + client
│   ├── integrations/           ← ML + Shopee + Amazon adapters
│   └── nfe/                    ← NF-e (integrar NFe.io)
└── docker-compose.yml
```

## Próximos passos

- [ ] Integração com NFe.io para emissão de NF-e
- [ ] Adapter Magalu (B2W/Americanas)
- [ ] Precificação dinâmica por regras
- [ ] Relatórios financeiros e de rentabilidade
- [ ] App mobile (React Native / Expo)
- [ ] Tela de login e onboarding
- [ ] Planos e billing (Stripe)
