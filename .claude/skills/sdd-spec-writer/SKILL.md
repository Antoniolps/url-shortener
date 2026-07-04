---
name: sdd-spec-writer
description: Template e regras de como escrever spec.md, plan.md e tasks.md para novas features do projeto, seguindo Spec-Driven Development. Use sempre que o usuário pedir para criar, iniciar ou planejar uma nova feature, ou pedir uma spec/plan/tasks.
---

# Como escrever specs no formato SDD deste projeto

## Quando usar

Toda vez que uma nova feature ou mudança de comportamento relevante for
proposta, antes de escrever código. Ver regra em `CLAUDE.md`: nunca pular
direto pra implementação sem os três artefatos abaixo existirem.

## Estrutura de diretório

```
specs/<NNN>-<nome-kebab-case>/
  spec.md
  plan.md
  tasks.md
```

`<NNN>` é sequencial e zero-padded (`001`, `002`...), `<nome-kebab-case>`
descreve a feature em poucas palavras (`002-rate-limiting`, não
`002-feature-nova`).

## `spec.md` — o quê e por quê

Sem detalhe técnico de implementação. Estrutura fixa:

1. **Status**: `Draft` / `Approved` / `Implemented`.
2. **Contexto e motivação**: por que essa feature existe, em 2-4 frases.
3. **Requisitos funcionais** (`RF01`, `RF02`...): cada um como história de
   usuário curta + lista de critérios de aceite testáveis (dado/quando/então
   implícito, sem precisar do formato Gherkin literal).
4. **Requisitos não funcionais** (`RNF01`, `RNF02`...): sempre com número
   concreto ou critério objetivo — "rápido" não é RNF, "p99 abaixo de 50ms" é.
5. **Fora de escopo**: lista explícita do que essa feature não cobre, pra
   evitar scope creep durante a implementação.
6. **Perguntas em aberto**: decisões que ainda precisam do usuário antes de
   ir para o `plan.md`. Se essa seção não estiver vazia, o `plan.md` não deve
   ser escrito ainda — voltar e perguntar.

## `plan.md` — como

Depende do `spec.md` estar com "perguntas em aberto" resolvidas. Estrutura:

1. **Arquitetura**: diagrama em ASCII ou descrição textual do fluxo de dados,
   componentes novos/alterados.
2. **Decisões de arquitetura e justificativa**: toda decisão não-óbvia
   explicada em 1-2 frases — o "por quê", não só o "o quê". Decisões
   descartadas relevantes também entram aqui, para não serem re-propostas
   sem contexto numa sessão futura.
3. **Modelo de dados**: schema Prisma proposto (seguir skill
   `prisma-schema-conventions`).
4. **Contratos de API**: request/response de cada endpoint novo/alterado,
   incluindo códigos de erro.
5. **Eventos** (se aplicável): payload, exchange, routing key (seguir skill
   `rabbitmq-event-patterns`).
6. **Módulos propostos**: lista de módulos NestJS novos/alterados (seguir
   skill `nestjs-module-conventions`).
7. **Pontos a decidir antes de gerar tasks.md**: qualquer parâmetro concreto
   ainda não definido (limites de rate limit, TTLs, etc.) — não inventar
   valores arbitrários silenciosamente, listar aqui e perguntar.

## `tasks.md` — quebra em tarefas

Só é escrito depois que `plan.md` está sem pontos em aberto. Estrutura:

- Lista de tarefas em ordem de execução, cada uma pequena o suficiente para
  ser um commit (ver Conventional Commits do projeto).
- Cada tarefa referencia qual `RF`/`RNF` do `spec.md` ela implementa.
- Dependências entre tarefas explícitas (`depende de: T03`).
- Tarefas de teste não são um item separado no final — cada tarefa de
  implementação de lógica de negócio já inclui seu teste correspondente
  (seguir skill `testing-conventions`).

```markdown
## T01 — Schema Prisma da tabela `urls`
Implementa: RF01, RF02
Depende de: —

## T02 — Endpoint POST /urls com geração de shortCode
Implementa: RF01
Depende de: T01
Inclui: teste unitário do UrlService (cenário de sucesso e URL inválida)
```

## Regra geral

Se o usuário pedir código de uma feature nova sem `spec.md`/`plan.md`
existentes, pare e pergunte se deve criar esses artefatos primeiro, em vez de
assumir e implementar direto.
