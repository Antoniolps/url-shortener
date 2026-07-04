---
name: prisma-schema-conventions
description: Convenções de naming, migrations e índices do schema Prisma do projeto. Use ao criar ou alterar models Prisma, gerar migrations, ou revisar mudanças de schema.
---

# Convenções de schema Prisma

## Naming

- **Model**: `PascalCase` singular (`Url`, não `Urls` nem `url`).
- **Campo no schema**: `camelCase` (`shortCode`, `createdAt`).
- **Coluna no banco**: `snake_case` via `@map` (`short_code`, `created_at`).
- **Tabela no banco**: `snake_case` plural via `@@map` (`urls`).

```prisma
model Url {
  id         BigInt    @id @default(autoincrement())
  shortCode  String    @unique @map("short_code") @db.VarChar(10)
  createdAt  DateTime  @default(now()) @map("created_at")

  @@map("urls")
}
```

Motivo: schema Prisma em camelCase é idiomático em TypeScript, banco em snake_case
é o padrão do ecossistema Postgres. Nunca deixar sem `@map`/`@@map` — isso gera
coluna `shortCode` (camelCase) direto no Postgres, o que quebra convenção com o
resto do banco (inclusive tabelas de outros serviços da Digivox, se algum dia
compartilharem schema ou tooling de BI).

## Índices

- Todo campo usado em `WHERE` ou `ORDER BY` fora da primary key precisa de índice
  explícito — não assumir que o Prisma cria automaticamente além do `@unique`.
- Campos de expiração/soft-delete (`expiresAt`, `deletedAt`) sempre indexados,
  mesmo que a feature de limpeza ainda não exista — o índice é barato de manter
  e caro de adicionar depois em tabela grande sem downtime cuidadoso.

```prisma
@@index([expiresAt])
```

## Migrations

- Nome sempre descritivo do que muda, no imperativo: `add_expires_at_to_urls`,
  `create_click_events_table`. Nunca `migration_1`, `update`, `fix`.
- Uma migration por mudança lógica. Não acumular múltiplas alterações não
  relacionadas numa migration só, mesmo que o Prisma permita gerar tudo junto.
- Rodar `prisma migrate dev` localmente sempre — nunca editar uma migration já
  aplicada em outro ambiente (gera drift). Se precisar corrigir, criar nova
  migration.
- Migrations destrutivas (`DROP COLUMN`, `DROP TABLE`) exigem confirmação
  explícita antes de aplicar em qualquer ambiente além de local — se estiver
  gerando isso via Claude Code, parar e perguntar antes de rodar
  `prisma migrate deploy`.

## Tipos

- IDs de entidades com alto volume de escrita (ex: `Url.id`): `BigInt`, não `Int`
  — evita esgotar o range em produção depois de milhões de registros.
- Timestamps: sempre `DateTime` nativo do Prisma, nunca `String` para datas.
- Campos opcionais no domínio: `?` no schema (`expiresAt DateTime?`), refletindo
  exatamente a obrigatoriedade real de negócio — não deixar tudo opcional por
  preguiça de migration.

## Client

- Um único `PrismaService` (extends `PrismaClient`) exportado por um `PrismaModule`
  global, injetado nos demais services. Nunca instanciar `new PrismaClient()` fora
  desse provider.
