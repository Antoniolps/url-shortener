---
name: testing-conventions
description: Convenções de estrutura de testes, mocks de Prisma/Redis/RabbitMQ e cobertura esperada do projeto. Use ao escrever, revisar ou corrigir qualquer teste (unitário ou e2e).
---

# Convenções de testes

## Ferramentas

- **Unitário**: Jest, já vem com o boilerplate do NestJS.
- **e2e/integração**: Jest + Supertest, subindo a aplicação NestJS em memória
  contra um Postgres/Redis/RabbitMQ de teste (docker-compose dedicado, nunca
  contra ambiente de dev/staging real).

## Estrutura

- Teste unitário fica ao lado do arquivo testado: `url.service.spec.ts` ao
  lado de `url.service.ts`.
- Teste e2e fica em `test/`, um arquivo por fluxo de negócio, não por
  controller (`test/create-and-redirect-url.e2e-spec.ts`, não
  `test/url.controller.e2e-spec.ts`).

## O que testar em unitário (service)

- Toda regra de negócio do `spec.md` da feature vira pelo menos um teste.
- Mock de `PrismaService`, `RedisService`/client Redis, e o publisher do
  RabbitMQ — teste unitário nunca bate em infraestrutura real.
- Cenário de cache hit e cache miss testados separadamente para o fluxo de
  redirect.
- Cenário de falha de infraestrutura (Redis fora do ar, RabbitMQ fora do ar)
  testado explicitamente para confirmar o comportamento de fail-open descrito
  na skill `api-error-handling` — não assumir que "vai funcionar", testar que
  o service não propaga erro 500 nesses casos.

```typescript
describe('RedirectService', () => {
  it('retorna a URL do cache quando há hit', async () => {
    redisMock.get.mockResolvedValue('https://exemplo.com');
    const result = await service.resolve('aZ3kQ1');
    expect(result).toBe('https://exemplo.com');
    expect(prismaMock.url.findUnique).not.toHaveBeenCalled();
  });

  it('busca no Postgres e popula o cache quando há miss', async () => {
    redisMock.get.mockResolvedValue(null);
    prismaMock.url.findUnique.mockResolvedValue({ longUrl: 'https://exemplo.com' });
    const result = await service.resolve('aZ3kQ1');
    expect(result).toBe('https://exemplo.com');
    expect(redisMock.set).toHaveBeenCalled();
  });

  it('não lança erro 500 se o Redis falhar', async () => {
    redisMock.get.mockRejectedValue(new Error('connection refused'));
    prismaMock.url.findUnique.mockResolvedValue({ longUrl: 'https://exemplo.com' });
    const result = await service.resolve('aZ3kQ1');
    expect(result).toBe('https://exemplo.com');
  });
});
```

## O que testar em e2e

- Fluxos completos ponta a ponta descritos como critérios de aceite no
  `spec.md`: criar URL → redirecionar → consultar stats.
- Códigos de status e formato de erro (`code`, `statusCode`) conforme a skill
  `api-error-handling`, não só o texto da mensagem.
- Processamento assíncrono do clique: publicar evento, aguardar (com timeout
  curto) o worker processar, então checar `clickCount` atualizado — nunca
  assumir que o clique foi contado antes de dar tempo ao consumer.

## Cobertura mínima esperada

- Todo `service` com lógica de negócio: mínimo de um teste por critério de
  aceite listado no `spec.md` da feature correspondente.
- Não perseguir 100% de cobertura de linha como meta em si — cobertura é
  consequência de testar os critérios de aceite, não o objetivo.

## O que NÃO fazer

- Não testar getters/setters triviais ou DTOs sem lógica.
- Não usar `sleep`/`setTimeout` arbitrário em teste e2e para "esperar o
  worker processar" — usar polling com timeout definido e mensagem de falha
  clara se estourar.
- Não deixar teste unitário depender de ordem de execução de outro teste.
