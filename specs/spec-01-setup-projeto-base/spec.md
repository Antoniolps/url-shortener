# Spec-01 — Setup do projeto base

**Implementa:** infraestrutura (pré-requisito de tudo)
**Depende de:** —

## Objetivo

Deixar o repositório num estado onde as próximas tarefas podem começar sem
precisar configurar nada de infraestrutura básica.

## O que fazer

- Scaffold NestJS (`nest new`), estrutura de pastas conforme skill
  `nestjs-module-conventions`.
- `docker-compose.yml` com Postgres, Redis e RabbitMQ locais.
- Instalar e configurar Prisma (`prisma init`), apontando pro Postgres do
  compose.
- `.env.example` com todas as variáveis necessárias (`DATABASE_URL`,
  `REDIS_URL`, `RABBITMQ_URL`, `BASE_URL` — usada pela spec-06 para montar
  a `shortUrl`).

## Critério de pronto

- [ ] `docker compose up -d` sobe Postgres, Redis e RabbitMQ sem erro.
- [ ] `npm run start:dev` sobe a API NestJS vazia sem erro.
- [ ] `.env.example` cobre todas as variáveis que os próximos serviços vão
  precisar.

## Testes

Nenhum teste automatizado nesta tarefa — é setup de infraestrutura, não
lógica de aplicação.
