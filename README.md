# URL Shortener

Encurtador de URL escalável, desenvolvido como estudo de system design com
Node.js + NestJS. Padrões explorados: cache-aside no caminho de leitura,
geração de identificadores via sequence do banco + Base62, e desacoplamento
entre o redirect (síncrono) e a contagem de cliques (assíncrona via fila).

## Stack

| Componente | Tecnologia | Papel |
| --- | --- | --- |
| API | NestJS 11 (Node 24) | HTTP + orquestração |
| Banco | PostgreSQL 16 + Prisma 7 | Source of truth (`urls`) |
| Cache | Redis 7 (ioredis) | Cache-aside `short_code -> long_url` |
| Mensageria | RabbitMQ 4 (@golevelup/nestjs-rabbitmq) | Eventos de clique |

## Subindo o ambiente

Pré-requisitos: Node.js 22+, npm e Docker.

```bash
# 1. Infra local (Postgres, Redis e RabbitMQ)
docker compose up -d

# 2. Variáveis de ambiente
cp .env.example .env

# 3. Dependências e migrations
npm install
npm run prisma:migrate

# 4. API em modo watch
npm run start:dev
```

> As portas do compose são deslocadas para não colidir com serviços locais:
> Postgres em `5433`, Redis em `6380`, RabbitMQ em `5673` (management UI em
> `http://localhost:15673`, usuário/senha `url_shortener`).

### Variáveis de ambiente (`.env.example`)

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | Conexão do Postgres (source of truth) |
| `REDIS_URL` | Conexão do Redis (cache do redirect) |
| `RABBITMQ_URL` | Conexão do RabbitMQ (eventos de clique) |
| `BASE_URL` | Base pública usada para montar a `shortUrl` |

## API

```
POST /urls
  { "longUrl": "https://...", "expiresAt": "2026-12-31T23:59:59Z"? }
  201 -> { shortCode, shortUrl, longUrl, expiresAt }
  400 -> longUrl inválida | 429 -> rate limit (10 req/min por IP)

GET /:shortCode
  302 -> Location: longUrl
  404 -> código inexistente | 410 -> link expirado

GET /urls/:shortCode/stats
  200 -> { shortCode, longUrl, clickCount, createdAt, expiresAt }
  404 -> código inexistente
```

Erros seguem sempre o mesmo formato:
`{ statusCode, code, message, timestamp, path }` — `code` é o identificador
estável (ex: `URL_NOT_FOUND`, `URL_EXPIRED`, `RATE_LIMIT_EXCEEDED`).

## Arquitetura

```
POST /urls ──> Postgres (sequence -> id -> Base62 -> short_code)   [síncrono]

GET /:code ──> Redis (hit? 302)
                 └miss─> Postgres ─> popula Redis (TTL dinâmico) ─> 302
                 └────────> publica url.click.registered (fire-and-forget)

RabbitMQ url.events (topic)
  └─> fila click-worker.click-registered ─> UPDATE click_count + 1
        └falha/malformada─> click-worker.click-registered.dlq
```

### Decisões e trade-offs

- **302 em vez de 301**: o 301 é cacheado agressivamente pelo navegador, o
  que impediria contagem de cliques precisa e a expiração/alteração futura do
  destino. O 302 mantém cada clique passando pela API — trade-off aceito de
  mais tráfego em troca de controle (RNF03).
- **TTL dinâmico do cache**: `min(3600s, tempo até expiresAt)`. Um link já
  expirado nunca entra no cache, então um cache hit nunca serve link
  expirado — resta apenas a janela de clock skew entre app e Redis, aceita
  como degradação mínima.
- **Fail-open de Redis e RabbitMQ**: falha de cache cai para o Postgres;
  falha de publicação de clique é logada e descartada. Só o Postgres
  indisponível gera `500` — sem source of truth não há o que responder.
- **Contagem eventual e aproximada**: o clique é processado de forma
  assíncrona (at-least-once, sem deduplicação) — `clickCount` pode atrasar
  alguns instantes e, sob retry, contar a mais. Aceitável para o escopo.
- **Rate limit em memória**: 10 req/min por IP só no `POST /urls`. Com mais
  de uma instância da API, o storage do throttler precisaria ir pro Redis.

## Testes

```bash
npm run test       # unitários (services com mocks de infra)
npm run test:e2e   # integração: exige docker compose up -d e .env
```

Os testes e2e cobrem os fluxos completos: criação, formato de erro,
criar → clicar → stats (aguardando o worker com polling) e rate limit.

## Comandos úteis

```bash
npm run start:dev        # API em modo watch
npm run prisma:migrate   # aplica migrations em dev
npm run prisma:studio    # inspeciona o banco
docker compose up -d     # sobe Postgres, Redis e RabbitMQ
```
