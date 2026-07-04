---
name: rabbitmq-event-patterns
description: Padrões de publisher/consumer, naming de exchanges/filas/routing keys e formato de payload de eventos RabbitMQ do projeto. Use ao criar, revisar ou alterar qualquer integração com RabbitMQ.
---

# Padrões de eventos RabbitMQ

## Naming

- **Exchange**: `<contexto>.events`, tipo `topic` (ex: `url.events`).
- **Routing key**: `<dominio>.<entidade>.<evento>` no particípio passado
  (ex: `url.click.registered`, não `url.click.register` nem `register-click`).
- **Fila (queue)**: `<servico-consumidor>.<routing-key-resumida>`
  (ex: `click-worker.click-registered`) — o nome da fila identifica quem
  consome, não quem publica.

## Payload de evento

Todo evento é versionado e segue este envelope, sem exceção:

```json
{
  "version": 1,
  "type": "click.registered",
  "occurredAt": "2026-07-04T14:32:10Z",
  "data": {
    "shortCode": "aZ3kQ1"
  }
}
```

- `version`: incrementa quando o formato de `data` muda de forma incompatível.
  Consumers devem checar a versão e decidir se sabem processar aquele formato.
- `type`: espelha a routing key sem o prefixo de domínio (`click.registered`
  para routing key `url.click.registered`).
- `occurredAt`: timestamp de quando o evento aconteceu no domínio, não de quando
  foi publicado (podem divergir sob retry).
- `data`: só o necessário para o consumer agir. Não anexar o objeto de domínio
  inteiro "pra garantir" — isso acopla consumer a mudanças de schema que não
  dizem respeito a ele.

## Publisher

- Publicação é fire-and-forget no caminho de leitura (redirect) — nunca aguardar
  confirmação de publicação antes de responder ao cliente.
- Falha ao publicar (broker indisponível) não deve derrubar a resposta HTTP.
  Logar a falha, seguir com o redirect. Perda ocasional de evento de clique é
  degradação aceitável (ver `spec.md` da feature).
- Um único `RabbitMQPublisherService` compartilhado, injetado onde precisar
  publicar — não instanciar canal/conexão por chamada.

## Consumer

- Idempotência: nesta fase do projeto, contagem aproximada é aceitável — não é
  necessário deduplicar mensagens reprocessadas (RabbitMQ garante at-least-once).
  Se isso mudar, documentar a decisão na spec antes de implementar dedupe.
- Processamento em batch quando fizer sentido (ex: agregar N eventos de clique
  do mesmo `shortCode` num único `UPDATE ... SET click_count = click_count + N`)
  em vez de um UPDATE por evento.
- Consumer nunca deve derrubar o processo em caso de erro de processamento de
  uma mensagem — usar dead-letter queue (`<fila>.dlq`) para mensagens que falham
  repetidamente, não deixar a fila travada.
- Ack manual (`noAck: false`), só confirma após persistir o efeito no banco.

## O que NÃO fazer

- Não usar RabbitMQ para comunicação síncrona request/response entre serviços
  (isso é REST/gRPC, não fila).
- Não publicar evento de clique como parte da mesma transação de banco que
  serve o redirect — o objetivo é justamente desacoplar isso.
- Não reutilizar a mesma fila para tipos de evento diferentes sem routing key
  que os diferencie.
