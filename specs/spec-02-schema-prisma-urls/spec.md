# Spec-02 — Schema Prisma da tabela `urls` e migration inicial
**Implementa:** RF01, RF02, RF04 (ver `../REQUISITOS.md`)
**Depende de:** Spec-01

## Objetivo

Ter a tabela `urls` criada no Postgres via Prisma, pronta para as tarefas de
criação e leitura de URL.

## O que fazer

- Model `Url` conforme o schema de referência abaixo, seguindo a skill
  `prisma-schema-conventions` (naming camelCase no schema / snake_case no
  banco via `@map`/`@@map`, índice em `expiresAt`).
- Migration `create_urls_table` via `prisma migrate dev`.

## Schema de referência

```prisma
model Url {
  id         BigInt    @id @default(autoincrement())
  shortCode  String    @unique @map("short_code") @db.VarChar(10)
  longUrl    String    @map("long_url")
  clickCount BigInt    @default(0) @map("click_count")
  createdAt  DateTime  @default(now()) @map("created_at")
  expiresAt  DateTime? @map("expires_at")

  @@map("urls")
  @@index([expiresAt])
}
```

## Critério de pronto

- [ ] Migration aplicada localmente sem erro.
- [ ] `prisma studio` mostra a tabela `urls` com as colunas em snake_case.
- [ ] `@@unique` em `short_code` confirmado (tentar inserir duplicado falha).

## Testes

Nenhum teste automatizado nesta tarefa — não há lógica de aplicação ainda,
só schema e migration.
