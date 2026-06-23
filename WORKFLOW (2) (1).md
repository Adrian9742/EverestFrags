# WORKFLOW.md — Processo de Desenvolvimento
# Hamburgueria · FastAPI + React + PostgreSQL offline-first

Processo obrigatório para qualquer feature nova ou correção de bug.
Siga em ordem. Nunca pule etapas.

---

## As etapas

```
1. RESEARCH      → entender o problema antes de construir
2. PRD           → escopo, casos de uso e contrato de métricas
3. TECHSPEC      → arquitetura, arquivos impactados, contratos de API
   ↳ 3.5 TECH RESEARCH (opcional) → quando há incerteza técnica
4. TASKBREAK     → quebrar TECHSPEC em tarefas atômicas e ordenadas
5. EXEC          → executar tarefa por tarefa (backend → testes → frontend)
6. QUALITY GATE  → validar que não desviou do plano
7. REVIEW        → padrões de código, segurança, consistência
8. SEC           → buscar vulnerabilidades
   ↳ 8.5 DECISION → vulnerabilidade arquitetural → volta ao TECHSPEC
                    vulnerabilidade de impl      → volta ao EXEC
```

---

## Como usar

**Nova feature:**
```
Iniciar RESEARCH para: [descrição da feature]
```

**Corrigir bug:**
```
Iniciar BUG para: [descrição do bug]
```

**Hotfix ou Ajuste Visual:**
```
Iniciar HOTFIX para: [descrição do ajuste estético/CSS ou erro de digitação]
```

**Migration de banco:**
```
Iniciar MIGRATION para: [descrição da mudança no schema]
```

O Claude vai usar os templates em `.claude/workflow/` em ordem
e salvar os artefatos em `.claude/features/[nome-da-feature]/`.

---

## Onde salvar os artefatos

```
.claude/features/[nome-da-feature]/
├── 01-research.md
├── 02-prd.md
├── 03-techspec.md
├── 03.5-tech-research.md   ← se necessário
├── 04-taskbreak.md
├── 06-quality-gate.md
├── 07-review.md
└── 08-sec.md
```

O EXEC (etapa 5) não gera documento — gera código.
O log de execução fica nos checkboxes do `04-taskbreak.md`.

---

## Regras inegociáveis

- Nunca iniciar EXEC sem TASKBREAK aprovado
- Nunca fechar uma feature com SEC pendente
- Mudança de escopo durante execução → registrar no TASKBREAK antes de continuar
- Vulnerabilidade arquitetural no SEC → volta ao TECHSPEC
- Vulnerabilidade de implementação no SEC → volta ao EXEC
- Nunca alterar o banco manualmente → sempre via migration Alembic
- Nunca commitar o arquivo `.env` → apenas `.env.example`

---

## Ordem de execução no EXEC (etapa 5)

Para esse projeto especificamente, o EXEC sempre segue essa sequência:

```
5.1 MODEL       → criar ou alterar o model SQLAlchemy
5.2 MIGRATION   → gerar e revisar a migration com Alembic
5.3 SCHEMA      → criar schemas Pydantic (entrada e saída separados)
5.4 SERVICE     → escrever a lógica de negócio no service
5.5 ROUTER      → expor os endpoints no router FastAPI
5.6 API TEST    → testar as rotas no Insomnia/Postman antes do frontend
5.7 FRONTEND    → construir página + componentes React
5.8 HOOK        → isolar lógica em hook customizado se reutilizável
5.9 INTEGRATION → testar fluxo completo frontend ↔ backend ↔ banco
```

Nunca pular da 5.2 direto para o frontend. A API precisa estar validada antes.

---

## Templates de artefato

### 01-research.md

```markdown
# Research — [nome da feature]

## Problema
O que está faltando ou quebrando? Por que isso importa para o usuário da hamburgueria?

## Contexto
Qual módulo é afetado? (pedidos / financeiro / cardápio / auth / dashboard)
Quem vai usar? (proprietário / caixa / garçom)

## Restrições conhecidas
- Precisa funcionar offline? (quase sempre: sim)
- Afeta o banco? Qual tabela?
- Afeta mais de um módulo?

## Referências
Links, prints, anotações relevantes.
```

---

### 02-prd.md

```markdown
# PRD — [nome da feature]

## Objetivo
Uma frase: o que o usuário consegue fazer depois dessa feature?

## Casos de uso
- [ ] Caso 1: ...
- [ ] Caso 2: ...

## Fora de escopo
O que explicitamente NÃO vai ser feito nessa entrega.

## Critérios de aceitação
- [ ] Critério mensurável 1
- [ ] Critério mensurável 2

## Cargo com acesso
- [ ] Proprietário
- [ ] Caixa
- [ ] Garçom
```

---

### 03-techspec.md

```markdown
# TechSpec — [nome da feature]

## Arquitetura
Descrição das camadas envolvidas e como se conectam.

## Banco de dados
Tabelas criadas ou alteradas:
| Tabela | Operação | Campos |
|--------|----------|--------|
| ...    | CREATE/ALTER | ... |

## Contrato de API
| Método | Rota | Auth | Body | Response |
|--------|------|------|------|----------|
| POST   | /api/... | sim | {...} | {...} |

## Arquivos impactados
Backend:
- backend/app/models/xxx.py        ← CREATE
- backend/app/schemas/xxx.py       ← CREATE
- backend/app/routers/xxx.py       ← CREATE ou MODIFY
- backend/app/services/xxx.py      ← CREATE ou MODIFY

Frontend:
- frontend/src/pages/xxx/Xxx.jsx   ← CREATE ou MODIFY
- frontend/src/hooks/useXxx.js     ← CREATE se reutilizável
- frontend/src/services/xxxService.js ← MODIFY

## Riscos técnicos
O que pode dar errado? Incerteza → abre 03.5-tech-research.md
```

---

### 04-taskbreak.md

```markdown
# Taskbreak — [nome da feature]

## Backend
- [ ] 5.1 Criar model `xxx.py`
- [ ] 5.2 Gerar migration: `alembic revision --autogenerate -m "add_xxx"`
- [ ] 5.2 Revisar migration gerada antes de rodar
- [ ] 5.2 Rodar migration: `alembic upgrade head`
- [ ] 5.3 Criar schema `XxxCreate`, `XxxResponse` em `schemas/xxx.py`
- [ ] 5.4 Implementar `xxx_service.py`
- [ ] 5.5 Implementar router em `routers/xxx.py`
- [ ] 5.5 Registrar router no `main.py`

## Teste de API
- [ ] 5.6 Testar todos os endpoints no Insomnia
- [ ] 5.6 Testar com token válido e token inválido
- [ ] 5.6 Testar com dados faltando (validação Pydantic)

## Frontend
- [ ] 5.7 Criar página `Xxx.jsx`
- [ ] 5.7 Conectar com `xxxService.js`
- [ ] 5.8 Extrair hook `useXxx.js` se houver lógica reutilizável
- [ ] 5.8 Adicionar rota no `App.jsx`
- [ ] 5.9 Testar fluxo completo com o banco rodando

## Estimativa
Tempo estimado: X horas / dias
```

---

### 06-quality-gate.md

```markdown
# Quality Gate — [nome da feature]

## Checklist

### Banco
- [ ] Migration roda sem erros: `alembic upgrade head`
- [ ] Migration reverte sem erros: `alembic downgrade -1`
- [ ] Nenhuma alteração manual no banco

### Backend
- [ ] Todos os endpoints retornam o shape definido no techspec
- [ ] Rotas protegidas retornam 401 sem token
- [ ] Rotas de cargo restrito retornam 403 para cargo errado
- [ ] Nenhum `print()` de debug esquecido

### Frontend
- [ ] Funciona sem internet (backend local, sem chamadas externas)
- [ ] Estados de loading e erro tratados
- [ ] Sem `console.log` de debug no código final
- [ ] Testado com usuário de cada cargo (proprietário, caixa, garçom)

### Geral
- [ ] `.env` não foi commitado
- [ ] `README.md` atualizado se necessário
```

---

### 07-review.md

```markdown
# Review — [nome da feature]

## Padrões de código

### Backend
- [ ] Lógica de negócio está no service, não no router
- [ ] Schemas separados para entrada (Create/Update) e saída (Response)
- [ ] Dependências injetadas via `Depends()` do FastAPI
- [ ] Senhas nunca em texto puro — sempre bcrypt
- [ ] JWT validado no middleware, não dentro de cada rota

### Frontend
- [ ] Chamadas HTTP centralizadas em `services/`, não espalhadas nos componentes
- [ ] Estado global só quando necessário — preferir props e hooks locais
- [ ] Datas e valores monetários formatados com `utils/formatters.js`
- [ ] Constantes de status/categoria em `utils/constants.js`

## Inconsistências encontradas
(listar o que foi corrigido)
```

---

### 08-sec.md

```markdown
# SEC — [nome da feature]

## Checklist de segurança

### Auth
- [ ] Endpoints sensíveis exigem token válido
- [ ] Cargo verificado nas rotas restritas (proprietário vs caixa)
- [ ] Token não exposto em URL ou logs
- [ ] Refresh token com expiração adequada

### Banco
- [ ] Queries usam ORM (SQLAlchemy) — sem SQL cru com f-string
- [ ] Sem dados sensíveis em texto puro (senhas, tokens)

### Dados
- [ ] Inputs validados com Pydantic antes de chegar no banco
- [ ] IDs de outros usuários não acessíveis sem permissão

### Offline / Local
- [ ] Arquivo `.env` fora do repositório
- [ ] PostgreSQL escuta apenas `localhost` (não exposto na rede)
- [ ] Backup automático salvo em pasta local, não em path público

## Vulnerabilidades encontradas
| Severidade | Descrição | Decisão |
|------------|-----------|---------|
| ...        | ...       | volta ao TECHSPEC / volta ao EXEC |
```

---

## Fluxo para migration isolada

Quando a tarefa é só ajustar o banco (adicionar coluna, novo índice):

```
Iniciar MIGRATION para: [descrição]
```

```
1. Descrever a mudança no 03-techspec.md (só a seção "Banco de dados")
2. Gerar: alembic revision --autogenerate -m "descricao_curta"
3. Revisar o arquivo gerado em alembic/versions/
4. Rodar: alembic upgrade head
5. Testar downgrade: alembic downgrade -1
6. Commitar migration + model juntos, nunca separados
```

---

## Comandos úteis do projeto

```bash
# Subir tudo
./start.sh          # Linux/Mac
start.bat           # Windows

# Backend (dentro de /backend)
uvicorn app.main:app --reload --port 8000

# Migrations
alembic revision --autogenerate -m "descricao"
alembic upgrade head
alembic downgrade -1
alembic history

# Frontend (dentro de /frontend)
npm run dev

# Rodar testes
pytest backend/tests/
```
