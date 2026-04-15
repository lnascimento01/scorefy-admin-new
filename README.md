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

## Teste local do módulo

1. Acesse `/players`.
2. Crie um atleta em `/players/create`.
3. Abra o detalhe do atleta recém-criado.
4. Edite dados cadastrais em `/players/[playerId]/edit`.
5. Execute a transferência pelo modal de detalhe ou listagem.
6. Tente transferir um atleta com inscrição sazonal ativa para validar o erro `422`.
7. Tente excluir um atleta com histórico para validar o bloqueio seguro.

## Validação recomendada

```bash
npm run lint
npm run build
```

Para validar o backend junto com o admin, rode também a suíte Laravel no repositório `/var/www/handscores-api` assim que o ambiente de testes tiver driver de banco habilitado.
