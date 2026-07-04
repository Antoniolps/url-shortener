# Spec: Encurtador de URL

## Status
Implemented

## Contexto e motivação

Estudo de system design aplicado: construir um encurtador de URL escalável,
explorando padrões de cache, geração de identificadores, e desacoplamento entre
caminho de leitura (redirect) e efeitos colaterais (contagem de clique).

## Requisitos funcionais

### RF01 — Criar URL curta
Como usuário da API, quero enviar uma URL longa e receber um código curto único,
para poder compartilhar um link mais compacto.

**Critérios de aceite:**
- Dado um `POST /urls` com `{ longUrl: string }` válido, o sistema retorna
  `201 Created` com `{ shortCode: string, shortUrl: string, longUrl: string }`.
- `longUrl` deve ser uma URL válida (schema http/https). URL inválida retorna
  `400 Bad Request`.
- `shortCode` é único no sistema, gerado automaticamente pelo backend (o
  usuário não escolhe o código nesta versão).
- Suporta `expiresAt` opcional no payload de criação.

### RF02 — Redirecionar para a URL original
Como usuário final, ao acessar uma URL curta, quero ser redirecionado para a
URL de destino original, de forma rápida.

**Critérios de aceite:**
- Dado um `GET /:shortCode` com código existente e não expirado, o sistema
  responde com redirect (ver RNF03 sobre 301 vs 302) para `longUrl`.
- Dado um `shortCode` inexistente, retorna `404 Not Found`.
- Dado um `shortCode` expirado (`expiresAt` no passado), retorna `410 Gone`.

### RF03 — Registrar clique
Como responsável pelo produto, quero saber quantos cliques cada link recebeu,
para acompanhar uso, sem que essa contagem impacte a latência do redirect.

**Critérios de aceite:**
- Todo redirect bem-sucedido (RF02) dispara um evento de clique.
- O evento é processado de forma assíncrona; o contador (`clickCount`) é
  eventualmente consistente (não precisa refletir na resposta do próprio
  redirect que o originou).
- Perda ocasional de eventos de clique (ex: falha transitória na fila) é uma
  degradação aceitável — não deve derrubar o redirect.

### RF04 — Consultar estatísticas de uma URL
Como usuário da API, quero consultar metadados e contagem de cliques de uma
URL curta que criei.

**Critérios de aceite:**
- `GET /urls/:shortCode/stats` retorna `{ shortCode, longUrl, clickCount,
  createdAt, expiresAt }`.
- Código inexistente retorna `404 Not Found`.

## Requisitos não funcionais

- **RNF01 (latência de leitura)**: p99 do redirect (cache hit) deve ficar
  abaixo de 50ms, medido na camada da aplicação.
- **RNF02 (escalabilidade de leitura)**: arquitetura deve suportar aumento de
  tráfego de leitura via cache e read replicas sem mudança de contrato de API.
- **RNF03 (tipo de redirect)**: usar `302 Found` por padrão, para preservar a
  possibilidade de contagem de clique precisa e permitir expiração/alteração
  futura da URL de destino sem depender de cache do navegador. Documentar esse
  trade-off (301 seria mais cacheável, porém menos flexível).
- **RNF04 (rate limiting)**: `POST /urls` deve ter limite de requisições por
  IP para evitar abuso — 10 requisições/minuto por IP (detalhes na spec-11;
  limite por API key fica fora de escopo junto com autenticação).
- **RNF05 (consistência de escrita)**: criação de URL é síncrona e
  imediatamente consistente — o link deve estar redirecionável assim que a
  API responde `201`.

## Fora de escopo (nesta versão)

- Autenticação/autorização de usuários (URLs são públicas e sem dono).
- Customização de `shortCode` pelo usuário.
- Analytics detalhado (geolocalização, user agent, referrer).
- Interface web — apenas API.
- Multi-região / multi-tenant.

## Decisões registradas (2026-07-04)

- **TTL do cache Redis**: dinâmico — `min(3600s, tempo até expiresAt)`.
  URL já expirada nunca é cacheada; assim o cache hit não serve link
  expirado (detalhes na spec-07).
- **Rate limit de `POST /urls`**: 10 requisições/minuto por IP (spec-11).