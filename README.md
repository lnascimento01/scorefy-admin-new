# Scorefy Admin

Painel administrativo Next.js do Scorefy.

## Desenvolvimento

```bash
npm install
npm run dev
```

O app usa `NEXT_PUBLIC_API_BASE` para falar com a API. Na ausência de configuração explícita, os módulos usam os endpoints versionados em `/api/v1/auth/...`.

## Módulo de Atletas

O módulo administrativo de atletas foi implementado sobre a entidade técnica `Player`, preservando a nomenclatura real do backend.

### Rotas do admin

- `/players`
- `/players/create`
- `/players/[playerId]`
- `/players/[playerId]/edit`

### Funcionalidades

- listagem paginada com busca por nome/apelido
- filtro por equipe base
- filtro por status ativo/inativo
- criação de atleta
- edição de cadastro-base
- tela de detalhe
- exclusão condicionada à ausência de histórico vinculado
- transferência entre equipes por modal dedicado

### Regras de segurança da transferência

- a troca de equipe base não usa o update genérico de `Player`
- a operação passa por `POST /api/v1/auth/players/{player}/transfer`
- se o atleta possuir inscrições sazonais ativas, a API responde `422`
- o admin exibe a mensagem retornada pela API sem mascarar o conflito
- nenhuma inscrição sazonal é migrada automaticamente

### Campos usados no formulário

- `team_id`
- `position_id`
- `first_name`
- `last_name`
- `nickname`
- `birthdate`
- `number`
- `nationality`
- `is_active`

## Endpoints consumidos

- `GET /api/v1/auth/players`
- `GET /api/v1/auth/players/{player}`
- `POST /api/v1/auth/players`
- `PATCH /api/v1/auth/players/{player}`
- `DELETE /api/v1/auth/players/{player}`
- `POST /api/v1/auth/players/{player}/transfer`
- `GET /api/v1/auth/teams`
- `GET /api/v1/auth/player-positions`

## Módulo de Equipes

O módulo administrativo de equipes usa a entidade técnica `Team` e respeita o contrato já existente no backend.

### Rotas do admin

- `/teams`
- `/teams/create`
- `/teams/[teamId]/edit`

### Funcionalidades

- listagem paginada com busca por nome, abreviação e slug
- filtro por país
- ordenação por nome e data de criação
- criação de equipe
- edição de equipe
- exclusão condicionada à ausência de vínculos ativos relevantes

### Campos usados no formulário

- `name`
- `short_name`
- `slug`
- `country_id`
- `city`
- `colors`

### Regras de segurança da exclusão

- a listagem continua consumindo `GET /api/v1/auth/teams`
- a exclusão usa `DELETE /api/v1/auth/teams/{team}`
- a API bloqueia a exclusão com `422` quando a equipe possui atletas, partidas, grupos, inscrições sazonais, comissão técnica ou notícias vinculadas
- o admin exibe a mensagem retornada pela API sem mascarar erro de integridade

### Endpoints consumidos

- `GET /api/v1/auth/teams`
- `GET /api/v1/auth/teams/{team}`
- `POST /api/v1/auth/teams`
- `PATCH /api/v1/auth/teams/{team}`
- `DELETE /api/v1/auth/teams/{team}`
- `GET /api/v1/auth/countries`

## Teste local do módulo

1. Acesse `/players`.
2. Crie um atleta em `/players/create`.
3. Abra o detalhe do atleta recém-criado.
4. Edite dados cadastrais em `/players/[playerId]/edit`.
5. Execute a transferência pelo modal de detalhe ou listagem.
6. Tente transferir um atleta com inscrição sazonal ativa para validar o erro `422`.
7. Tente excluir um atleta com histórico para validar o bloqueio seguro.

## Teste local do módulo de equipes

1. Acesse `/teams`.
2. Clique em `Nova equipe` e crie um cadastro válido em `/teams/create`.
3. Após criar, confirme o redirecionamento para `/teams/[teamId]/edit`.
4. Edite `name`, `short_name`, `slug`, `country_id`, `city` e `colors`.
5. Tente excluir uma equipe isolada.
6. Tente excluir uma equipe com atletas ou partidas vinculadas para validar o erro `422`.

## Validação recomendada

```bash
npm run lint
npm run build
```

Para validar o backend junto com o admin, rode também a suíte Laravel no repositório `/var/www/handscores-api` assim que o ambiente de testes tiver driver de banco habilitado.
