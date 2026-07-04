# CLAUDE.md

Este arquivo orienta o Claude Code ao trabalhar neste repositório.

## Visão geral do projeto

Encurtador de URL escalável, desenvolvido como estudo de system design. Foco em:
padrão cache-aside, particionamento de responsabilidades entre escrita síncrona
e processamento assíncrono de eventos, e boas práticas de arquitetura backend.

## Stack

- **Runtime**: Node.js + NestJS
- **ORM**: Prisma
- **Banco principal**: PostgreSQL (source of truth)
- **Cache**: Redis (cache-aside, `short_code -> long_url`)
- **Mensageria**: RabbitMQ (eventos de clique, processamento assíncrono)
- **Testes**: Jest + Supertest
- **Package manager**: npm

## Metodologia: Spec-Driven Development (SDD)

Toda feature nova segue o fluxo:

1. `specs/<numero>-<nome-feature>/spec.md` — o quê e por quê (requisitos funcionais,
   critérios de aceite, fora de escopo). Sem detalhe técnico de implementação.
2. `specs/<numero>-<nome-feature>/plan.md` — como (arquitetura, decisões técnicas,
   contratos de API, modelo de dados).
3. `specs/<numero>-<nome-feature>/tasks.md` — quebra em tarefas executáveis e
   ordenadas por dependência.

Nunca pule direto pra implementação sem esses três artefatos existirem e
aprovados. Se o pedido do usuário implicar mudança de comportamento e não
houver spec correspondente, pare e pergunte se deve criar/atualizar a spec
antes de tocar em código.

## Convenções de código

- **Módulos NestJS**: um módulo por domínio (`url`, `redirect`, `click-worker`),
  cada um com `*.controller.ts`, `*.service.ts`, `*.module.ts`, `dto/`, `*.repository.ts`
  quando a lógica de acesso a dados justificar abstração sobre o Prisma.
- **Prisma**: nomes de tabela e coluna em `snake_case` no banco via `@@map`/`@map`,
  nomes de model em `PascalCase` no schema. Migrations sempre nomeadas
  descritivamente (`add_expires_at_to_urls`, não `migration_1`).
- **Erros**: exception filters centralizados, nunca `throw new Error()` cru em
  código de aplicação — usar exceptions do NestJS ou classes de domínio próprias.
- **Eventos RabbitMQ**: payload sempre versionado (`{ version: 1, type: 'click.registered', data: {...} }`),
  routing key no formato `<dominio>.<evento>` (ex: `url.click.registered`).
- **Commits**: Conventional Commits em português, via slash command já existente.

## Comandos úteis

```bash
npm run start:dev        # sobe a API em modo watch
npm run prisma:migrate   # aplica migrations em dev
npm run prisma:studio    # inspeciona o banco
npm run test             # testes unitários
npm run test:e2e         # testes de integração
docker compose up -d     # sobe Postgres, Redis e RabbitMQ locais
```

## Não fazer

- Não escrever direto no Postgres a partir do caminho de leitura (redirect) —
  contagem de clique é sempre via evento assíncrono.
- Não introduzir fila na escrita do link (`POST /urls`) sem uma spec
  justificando o motivo — decisão de arquitetura já discutida e descartada
  para o escopo atual.
- Não gerar `short_code` em memória da aplicação sem lock/sequence do banco
  (risco de colisão em concorrência).
