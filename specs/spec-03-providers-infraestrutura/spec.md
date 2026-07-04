# Spec-03 — Providers de infraestrutura compartilhada
**Implementa:** infraestrutura (pré-requisito de spec-06, spec-07, spec-09)
**Depende de:** Spec-01

## Objetivo

Ter `PrismaService`, client Redis e publisher do RabbitMQ prontos e
injetáveis, para que os módulos de negócio não precisem lidar com detalhes de
conexão.

## O que fazer

- `PrismaModule` global com `PrismaService` (extends `PrismaClient`).
- `RedisModule` global com client Redis configurado via `REDIS_URL`.
- `RabbitMQModule` global: configuração do exchange `url.events` (tipo
  `topic`) e um `RabbitMQPublisherService` compartilhado, conforme skill
  `rabbitmq-event-patterns`.

## Critério de pronto

- [ ] `PrismaService` injetável em qualquer módulo, conecta ao Postgres do
  compose.
- [ ] Client Redis injetável, conecta ao Redis do compose.
- [ ] `RabbitMQPublisherService` consegue publicar uma mensagem de teste no
  exchange `url.events`.

## Testes

- Teste unitário de health check básico de cada provider.
- Cenário de falha de conexão (mock) deve retornar erro tratável — nunca uma
  exception não capturada subindo até o processo. Ver skill
  `api-error-handling` para o padrão de fail-open que os consumidores desses
  providers vão precisar (Redis e RabbitMQ nunca derrubam o caminho de
  leitura).
