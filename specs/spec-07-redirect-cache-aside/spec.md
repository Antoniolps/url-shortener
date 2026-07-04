# Spec-07 — `GET /:shortCode`: redirect com cache-aside

**Implementa:** RF02, RNF01, RNF03 (ver `../REQUISITOS.md`)
**Depende de:** Spec-03, Spec-05, Spec-06

## Objetivo

Caminho de leitura (o mais quente do sistema) funcionando com cache-aside,
sem se tornar um ponto de falha caso o Redis esteja indisponível.

## O que fazer

- `RedirectModule`, `RedirectController`, `RedirectService`.
- Fluxo: tenta Redis (`GET short_code`) → se hit, redirect direto → se miss,
  busca no Postgres, popula o Redis, então redirect.
- TTL do cache é dinâmico: `min(3600s, tempo até expiresAt)`; URL sem
  `expiresAt` usa 3600s fixo. URL já expirada nunca é cacheada — assim o
  cache hit nunca serve link expirado (resta apenas a janela de clock skew,
  trade-off aceito e documentado no README).
- `shortCode` inexistente → `404` (`UrlNotFoundException`, de T05).
- `shortCode` com `expiresAt` no passado → `410` (`UrlExpiredException`).
- Redirect usa `302 Found` (decisão RNF03 em `../REQUISITOS.md`).

## Critério de pronto

- [ ] Cache hit não consulta o Postgres.
- [ ] Cache miss consulta o Postgres e popula o Redis antes de responder.
- [ ] Falha simulada de conexão com Redis não gera erro 500 — cai
  direto pro Postgres (fail-open, conforme skill `api-error-handling`).
- [ ] Código expirado retorna `410`, código inexistente retorna `404`.

## Testes

- Teste unitário do `RedirectService` cobrindo: cache hit, cache miss, código
  inexistente, código expirado, e falha simulada do Redis. Ver exemplos
  completos na skill `testing-conventions`.
