# Spec-04 — Utilitário de geração de `shortCode` (Base62)

**Implementa:** RF01 (ver `../REQUISITOS.md`)
**Depende de:** Spec-02

## Objetivo

Ter uma função pura e testada que converte o `id` (BigInt, vindo da sequence
do Postgres) em um `shortCode` curto e legível, e o inverso.

## O que fazer

- Função `encodeBase62(id: bigint): string` e seu inverso
  `decodeBase62(code: string): bigint`, em `src/common/base62.ts`.
- Alfabeto padrão Base62 (`0-9A-Za-z`).

## Critério de pronto

- [ ] `encodeBase62(1n)` produz um código curto determinístico.
- [ ] `decodeBase62(encodeBase62(id)) === id` para qualquer `id` válido.
- [ ] Decode de uma string com caractere fora do alfabeto Base62 lança
  exception de domínio (não `Error` genérico — ver skill
  `api-error-handling`).

## Testes

- Teste unitário cobrindo: id pequeno (`1n`), id grande (próximo do limite
  razoável de `BigInt` para o caso de uso, ex: `10^15`), round-trip
  encode→decode, e string inválida no decode lançando a exception de domínio
  esperada.
