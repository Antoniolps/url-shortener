# Ordem de execução — Encurtador de URL

Cada spec vive em sua própria pasta (`spec-NN-nome/spec.md`), autocontida com
objetivo, referência a RF/RNF, critério de pronto e testes. Este arquivo
existe só para orientar em que ordem executá-las — abra cada `spec.md`
individualmente na hora de trabalhar nela, não é necessário carregar as
outras.

## Grafo de dependências

```
T01 (setup)
 ├─→ T02 (schema Prisma)
 │    └─→ T04 (Base62)
 ├─→ T03 (providers de infra)
 └─→ T05 (exception filter)

T02 + T03 + T04 + T05 ─→ T06 (criar URL)

T06 ─┬─→ T07 (redirect + cache) ─→ T08 (publica evento de clique)
     │                                  └─→ T09 (worker de clique)
     ├─→ T10 (stats)
     └─→ T11 (rate limiting)

T01–T11 ─→ T12 (documentação)
```

## Sequência recomendada

1. **T01** — Setup do projeto base
2. **T02** — Schema Prisma da tabela `urls`
3. **T03** — Providers de infraestrutura compartilhada
4. **T04** — Utilitário de geração de `shortCode` (Base62)
5. **T05** — Exception filter global e exceptions de domínio
6. **T06** — `POST /urls`: criar URL curta
7. **T07** — `GET /:shortCode`: redirect com cache-aside
8. **T08** — Publicar evento de clique no fluxo de redirect
9. **T09** — `ClickWorkerModule`: consumer de eventos de clique
10. **T10** — `GET /urls/:shortCode/stats`: consultar estatísticas
11. **T11** — Rate limiting em `POST /urls`
12. **T12** — Documentação de setup

## Paralelização possível

Se quiser adiantar trabalho fora da ordem estrita:

- **T02, T03, T05** podem ser feitas em qualquer ordem entre si — todas
  dependem só de T01.
- **T04** depende só de T02 (precisa do `id` da tabela existir
  conceitualmente, mas é uma função pura sem dependência real de dado em
  banco).
- **T10** e **T11** podem ser feitas em paralelo depois de T06 — não
  dependem uma da outra.

## Como usar isso com o Claude Code

Ao pedir para executar uma tarefa, referencie a pasta específica, por
exemplo: "execute a tarefa em `specs/spec-06-criar-url-curta/spec.md`".
Isso evita carregar as outras 11 tarefas no contexto sem necessidade.

Antes de iniciar uma tarefa, confirme que as tarefas listadas em "Depende
de" dentro do `spec.md` dela já foram concluídas.
