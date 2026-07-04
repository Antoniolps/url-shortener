# Spec-10 — `GET /urls/:shortCode/stats`: consultar estatísticas

**Implementa:** RF04 (ver `../REQUISITOS.md`)
**Depende de:** Spec-06

## Objetivo

Permitir que quem criou uma URL consulte seus metadados e contagem de
cliques atual.

## O que fazer

- Endpoint no `UrlController`/`UrlService` retornando `shortCode`, `longUrl`,
  `clickCount`, `createdAt`, `expiresAt`.
- Código inexistente retorna `404`, reutilizando `UrlNotFoundException` (de
  Spec-05).

## Contrato de referência

```
GET /urls/:shortCode/stats

200 → { "shortCode", "longUrl", "clickCount", "createdAt", "expiresAt" }
404 → código não encontrado
```

## Critério de pronto

- [ ] Endpoint retorna os dados corretos para um `shortCode` existente.
- [ ] Retorna `404` no formato padrão de erro para código inexistente.

## Testes

- Teste unitário do endpoint.
- Teste e2e do fluxo criar → registrar clique (via spec-08/spec-09, aguardando o
  worker processar com polling e timeout, nunca `sleep` arbitrário — ver
  skill `testing-conventions`) → consultar stats e confirmar `clickCount`
  atualizado.
