# T11 — Rate limiting em `POST /urls`

**Implementa:** RNF04 (ver `../REQUISITOS.md`)
**Depende de:** Spec-06

## Objetivo

Evitar abuso na criação de links, sem impactar o caminho de leitura.

## O que fazer

- `ThrottlerGuard` do `@nestjs/throttler` aplicado ao `UrlController`, apenas
  na rota `POST /urls`.
- Limite: 10 requisições/minuto por IP (decisão registrada em
  `../REQUISITOS.md`, RNF04). Storage do throttler em memória — suficiente
  para instância única; multi-instância exigiria storage Redis.
- Resposta `429` seguindo o formato padrão de erro (spec-05).

## Critério de pronto

- [ ] A 11ª requisição de criação dentro de 1 minuto do mesmo IP retorna
  `429`.
- [ ] Rotas de leitura (`GET /:shortCode`, `GET /urls/:shortCode/stats`) não
  são afetadas por esse limite.

## Testes

- Teste e2e confirmando o `429` após exceder o limite dentro da janela de
  tempo, e confirmando que as rotas de leitura seguem funcionando
  normalmente durante o mesmo teste.
