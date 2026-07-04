---
name: api-error-handling
description: Padrões de exception filters, formato de resposta de erro HTTP e exceptions de domínio do projeto. Use ao implementar tratamento de erros, validação, ou qualquer código que possa falhar em um controller/service NestJS.
---

# Tratamento de erros de API

## Formato de resposta de erro

Todo erro HTTP retornado pela API segue o mesmo formato, garantido por um
exception filter global:

```json
{
  "statusCode": 404,
  "code": "URL_NOT_FOUND",
  "message": "código não encontrado",
  "timestamp": "2026-07-04T14:32:10Z",
  "path": "/aZ3kQ1"
}
```

- `statusCode`: código HTTP padrão.
- `code`: identificador estável em `SCREAMING_SNAKE_CASE`, específico do domínio
  — é o que o cliente da API deve usar para lógica condicional, nunca parsear
  `message` (que pode mudar de texto).
- `message`: texto legível em português, para debug/log — não é contrato de API.

## Exceptions de domínio

- Nunca lançar `Error` cru ou `throw new Error('...')` em código de aplicação.
- Criar classes de exception de domínio que estendem as `HttpException` do
  NestJS, uma por situação de erro de negócio:

```typescript
export class UrlNotFoundException extends NotFoundException {
  constructor(shortCode: string) {
    super({
      code: 'URL_NOT_FOUND',
      message: `código não encontrado: ${shortCode}`,
    });
  }
}

export class UrlExpiredException extends HttpException {
  constructor(shortCode: string) {
    super(
      { code: 'URL_EXPIRED', message: `link expirado: ${shortCode}` },
      HttpStatus.GONE,
    );
  }
}
```

- Service lança a exception de domínio; nunca o repository, nunca o controller.
- Erros de validação de entrada (`class-validator`) são tratados pelo
  `ValidationPipe` global — não reimplementar validação manual no service.

## Exception filter global

- Um único `AllExceptionsFilter` captura tudo, formata a resposta acima, e
  loga o stack trace apenas para erros 5xx (erros 4xx são esperados e não
  precisam de log de erro, só de log informativo/debug).
- Erros não mapeados (exceptions não tratadas, bugs) caem como `500` com
  `code: "INTERNAL_ERROR"` e mensagem genérica — nunca vazar stack trace ou
  detalhe interno na resposta ao cliente, mesmo em ambiente de estudo.

## Mapeamento de erros de infraestrutura

- Erro de conexão com Redis no caminho de leitura: nunca deve virar erro 500
  pro cliente — se o cache falhar, cair para o Postgres (fail-open), logar o
  incidente.
- Erro de conexão com RabbitMQ ao publicar evento de clique: nunca deve
  impactar a resposta do redirect (ver skill `rabbitmq-event-patterns`) — logar
  e seguir.
- Erro de conexão com Postgres: esse sim é erro real de sistema — propaga como
  `500 INTERNAL_ERROR`, já que sem source of truth disponível não há requisição
  possível de atender corretamente.

## Checklist

- [ ] Toda exception lançada é uma classe de domínio, não `Error` genérico
- [ ] `code` de erro é estável e documentado no `plan.md` da feature
  correspondente
- [ ] Falha de cache/fila nunca vira erro 500 no caminho de leitura
- [ ] Nenhum stack trace ou detalhe interno vaza na resposta HTTP
