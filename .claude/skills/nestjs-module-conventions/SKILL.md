---
name: nestjs-module-conventions
description: Convenções de estrutura e organização de módulos NestJS do projeto (controller, service, dto, repository, injeção de dependência). Use ao criar, revisar ou refatorar qualquer módulo NestJS.
---

# Convenções de módulo NestJS

## Estrutura de pastas por módulo

Cada domínio vive em `src/<dominio>/` com essa estrutura:

```
src/url/
  url.module.ts
  url.controller.ts
  url.service.ts
  url.repository.ts        # só se a lógica de acesso a dados justificar abstração sobre o Prisma
  dto/
    create-url.dto.ts
    url-response.dto.ts
  url.controller.spec.ts
  url.service.spec.ts
```

Não criar `interfaces/`, `types/`, ou `models/` separados para algo que já é coberto
pelo tipo gerado do Prisma ou por um DTO. Evitar abstração antes de precisar dela.

## Controller

- Só orquestra: recebe request, chama o service, retorna o DTO de resposta.
- Nunca contém lógica de negócio, nunca acessa o Prisma diretamente.
- Um método por rota, decorators do NestJS explícitos (`@Get`, `@Post`, `@Param`, `@Body`).
- Validação de entrada via `class-validator` nos DTOs, nunca `if` manual no controller.

```typescript
@Controller('urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  async create(@Body() dto: CreateUrlDto): Promise<UrlResponseDto> {
    return this.urlService.create(dto);
  }
}
```

## Service

- Contém a lógica de negócio e orquestra repository + cache + publisher de eventos.
- Não conhece detalhes de HTTP (status code, request, response) — isso é do controller.
- Injeção de dependência sempre via constructor, nunca `new` direto de outro service/provider.

## Repository (quando existir)

- Só existe se houver lógica de acesso a dados que vale a pena isolar do Prisma puro
  (queries compostas, múltiplas tabelas, cache-aside). Para um CRUD simples de uma
  tabela, o service pode chamar o `PrismaService` diretamente — não force um
  repository vazio só por padrão arquitetural.
- Repository nunca lança exception de domínio — isso é responsabilidade do service
  (ver skill `api-error-handling`).

## Módulo

- `@Module` declara `imports`, `controllers`, `providers`, `exports` explicitamente.
- Não usar módulos globais (`@Global()`) exceto para infraestrutura verdadeiramente
  transversal (`PrismaModule`, `RedisModule`, `RabbitMQModule`).

## DTOs

- Um DTO de entrada (`CreateUrlDto`) e um de saída (`UrlResponseDto`) por operação
  que expõe formato diferente do modelo interno.
- Sempre com `class-validator` (`@IsUrl`, `@IsOptional`, `@IsDateString`, etc.) e
  `class-transformer` (`@Expose`, `@Exclude`) quando o DTO de resposta precisa
  esconder campos internos.

## Testes

- Todo service tem `.spec.ts` com mocks das dependências (Prisma, Redis, RabbitMQ
  publisher) — nunca teste unitário batendo em infra real. Ver skill `testing-conventions`.

## Checklist antes de considerar um módulo pronto

- [ ] Controller sem lógica de negócio
- [ ] Service sem conhecimento de HTTP
- [ ] DTOs de entrada validados com class-validator
- [ ] Erros lançados como exceptions de domínio, não `Error` cru
- [ ] `.spec.ts` cobrindo o service com mocks
