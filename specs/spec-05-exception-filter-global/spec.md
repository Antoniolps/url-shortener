# Spec-05 — Exception filter global e exceptions de domínio

**Implementa:** infraestrutura de erro (pré-requisito de Spec-06, Spec-07)
**Depende de:** Spec-01

## Objetivo

Garantir que toda resposta de erro da API siga o mesmo formato, e que exista
um conjunto inicial de exceptions de domínio prontas para uso pelos módulos
de negócio.

## O que fazer

- `AllExceptionsFilter` conforme skill `api-error-handling`: formato de
  resposta padronizado (`statusCode`, `code`, `message`, `timestamp`,
  `path`).
- Classes de exception: `UrlNotFoundException` (404), `UrlExpiredException`
  (410), `InvalidUrlException` (400).

## Critério de pronto

- [ ] Qualquer exception não tratada vira `500` com `code: "INTERNAL_ERROR"`,
  sem vazar stack trace na resposta.
- [ ] As três exceptions de domínio produzem o `code` e `statusCode`
  corretos.

## Testes

- Teste e2e mínimo confirmando o formato de resposta de um erro 404
  (`UrlNotFoundException`) e de um erro de validação 400 (payload inválido
  disparando o `ValidationPipe` global).
