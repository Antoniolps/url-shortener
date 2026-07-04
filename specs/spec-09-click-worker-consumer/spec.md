# T09 — `ClickWorkerModule`: consumer de eventos de clique

**Implementa:** RF03 (ver `../REQUISITOS.md`)
**Depende de:** Spec-02, Spec-03, Spec-08

## Objetivo

Consumir os eventos publicados em Spec-08 e refletir a contagem de clique no
Postgres, de forma assíncrona e resiliente a falhas de processamento.

## O que fazer

- Consumer da fila `click-worker.click-registered` (bind na routing key
  `url.click.registered` do exchange `url.events`).
- Ao processar: `UPDATE urls SET click_count = click_count + 1 WHERE
  short_code = $1`.
- Ack manual (`noAck: false`), só confirma após persistir com sucesso.
- Dead-letter queue (`click-worker.click-registered.dlq`) para mensagens que
  falham repetidamente — nunca travar a fila principal.
- Idempotência não é implementada nesta versão — contagem aproximada é
  aceitável (decisão do RF03 em `../REQUISITOS.md` e skill
  `rabbitmq-event-patterns`).

## Critério de pronto

- [ ] Evento publicado em Spec-08 resulta em `click_count` incrementado no
  Postgres.
- [ ] Mensagem malformada (schema inválido) vai para a DLQ sem derrubar o
  worker nem travar mensagens subsequentes.

## Testes

- Teste unitário do consumer: processamento com sucesso incrementando o
  contador, e mensagem malformada sendo roteada para a DLQ sem lançar
  exception não tratada.
