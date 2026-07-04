# Spec-06 — `POST /urls`: criar URL curta

**Implementa:** RF01, RNF05 (ver `../REQUISITOS.md`)
**Depende de:** Spec-02, Spec-03, Spec-04, Spec-05

## Objetivo

Endpoint funcional de criação de URL curta, síncrono e imediatamente
consistente.

## O que fazer

- `UrlModule`, `UrlController`, `UrlService`, seguindo skill
  `nestjs-module-conventions`.
- `CreateUrlDto` com `@IsUrl()` em `longUrl`, `expiresAt` opcional via
  `@IsOptional() @IsDateString()`.
- `UrlService.create()`: grava no Postgres via Prisma, obtém o `id` gerado,
  converte para `shortCode` via `encodeBase62` (spec-04), retorna
  `UrlResponseDto`.
- `shortUrl` é montada como `${BASE_URL}/${shortCode}` — `BASE_URL` vem do
  ambiente (definida no `.env.example` da spec-01).

## Contrato de referência

```
POST /urls
{ "longUrl": "https://...", "expiresAt": "2026-12-31T23:59:59Z" }

201 → { "shortCode", "shortUrl", "longUrl", "expiresAt" }
400 → longUrl inválida
429 → rate limit (implementado em Spec-11, não nesta tarefa)
```

## Critério de pronto

- [ ] `POST /urls` com `longUrl` válida retorna `201` com o formato acima.
- [ ] `POST /urls` com `longUrl` inválida retorna `400` no formato padrão de
  erro (spec-05).
- [ ] `shortCode` gerado é único e reversível para o `id` original.

## Testes

- Teste unitário do `UrlService`: caso de sucesso, caso de `longUrl`
  inválida.
- Teste e2e do fluxo completo de criação, conforme skill
  `testing-conventions`.
