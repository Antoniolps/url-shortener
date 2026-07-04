# T12 — Documentação de setup

**Implementa:** — (suporte ao projeto, não mapeia a um RF/RNF)
**Depende de:** Spec-01–Spec-11 concluídas

## Objetivo

Deixar o projeto pronto para qualquer pessoa (inclusive você em outra
máquina, ou o Claude Code numa sessão nova) subir o ambiente sem precisar
reconstruir contexto do zero.

## O que fazer

- `README.md` com: como subir o `docker-compose`, rodar migrations, variáveis
  de ambiente necessárias, comandos de teste (`npm run test`, `npm run
  test:e2e`).
- Conferir que `.env.example` (de spec-01) está completo e sincronizado com o que
  o projeto realmente usa hoje.

## Critério de pronto

- [ ] Seguindo só o `README.md`, é possível clonar o repo e ter a API
  rodando localmente sem precisar perguntar nada.
- [ ] `.env.example` não tem variável faltando nem variável sobrando.

## Testes

Nenhum teste automatizado — é documentação.
