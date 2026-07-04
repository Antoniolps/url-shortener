# Spec 08 — Publicar evento de clique no fluxo de redirect
**Implementa:** RF03 (ver `../REQUISITOS.md`)
**Depende de:** Spec-03, Spec-07

## Objetivo

Registrar que um clique aconteceu, sem que isso adicione latência ou risco de
falha ao redirect em si.

## O que fazer

- `RedirectService` publica evento `click.registered` (routing key
  `url.click.registered`, exchange `url.events`) logo após decidir o
  redirect, de forma fire-and-forget — nunca aguarda confirmação de
  publicação antes de responder ao cliente.
- Payload conforme skill `rabbitmq-event-patterns`:

```json
{
  "version": 1,
  "type": "click.registered",
  "occurredAt": "2026-07-04T14:32:10Z",
  "data": { "shortCode": "aZ3kQ1" }
}
```

- Falha ao publicar (broker indisponível) é logada, mas não impacta a
  resposta do redirect.

## Critério de pronto

- [ ] Redirect bem-sucedido publica exatamente um evento no exchange
  `url.events`.
- [ ] Falha simulada de publicação (RabbitMQ indisponível) não altera o
  status code nem o corpo da resposta do redirect.

## Testes

- Teste unitário confirmando que o `RedirectService` chama o publisher com o
  payload correto, e que uma falha simulada do publisher não propaga erro
  para o chamador.
